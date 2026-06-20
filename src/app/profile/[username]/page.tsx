"use client"
import { useCallback, useEffect, useState } from "react"
import type { ChangeEvent } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useApp } from "@/context/AppContext"
import PollCard from "@/components/PollCard"
import { handleVote } from "@/lib/vote"
import { fetchPollCards } from "@/lib/polls"
import type { Poll, Profile } from "@/types/domain"

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
const IMAGE_ACCEPT = ALLOWED_IMAGE_TYPES.join(",")

export default function ProfilePage() {
  const params = useParams<{ username: string }>()
  const username = params.username
  const { user: currentUser, isDark, requireLogin } = useApp()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [polls, setPolls] = useState<Poll[]>([])
  const [uploading, setUploading] = useState(false)

  const isOwnProfile = currentUser?.username === username

  const fetchProfileData = useCallback(async () => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single()

    if (!profileData) return

    setProfile(profileData as Profile)

    const pollData = await fetchPollCards({
      profileUsername: username,
      limit: 50,
    })

    setPolls(pollData)
  }, [username])

  useEffect(() => {
    void fetchProfileData()
  }, [fetchProfileData])

  const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      const file = event.target.files?.[0]
      if (!file || !currentUser) return
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        alert("Please upload a JPG, PNG, or WebP image.")
        return
      }

      const filePath = `${currentUser.id}/avatar`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const urlWithCacheBuster = `${publicUrl}?t=${new Date().getTime()}`

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlWithCacheBuster })
        .eq('id', currentUser.id)

      if (updateError) throw updateError

      if (profile) setProfile({ ...profile, avatar_url: urlWithCacheBuster })
    } catch (error) {
      console.error(error)
      alert('Error uploading avatar!')
    } finally {
      setUploading(false)
      event.target.value = ""
    }
  }

  const onVote = (pollId: string, optionId: string) => handleVote({
    user: currentUser, pollId, optionId, requireLogin,
    onSuccess: (updatedPoll: Poll) => setPolls(prev => prev.map(p => p.id === pollId ? updatedPoll : p))
  })

  return (
    <div className="max-w-xl mx-auto p-4 pt-10">
      <div className="flex flex-col items-center mb-10 text-center">

        <div className={`relative group w-24 h-24 rounded-full overflow-hidden mb-4 border-2 ${isDark ? 'border-zinc-800' : 'border-gray-200'}`}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={username} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center text-3xl font-black ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
              {username ? username[0].toUpperCase() : 'U'}
            </div>
          )}

          {isOwnProfile && (
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              <input type="file" accept={IMAGE_ACCEPT} className="hidden" onChange={uploadAvatar} disabled={uploading} />
              <span className="text-white text-xs font-bold uppercase tracking-tighter">
                {uploading ? 'uploading...' : 'edit'}
              </span>
            </label>
          )}
        </div>

        <h1 className="text-2xl font-black">@{username}</h1>
        <p className="opacity-50 text-sm mt-1">{polls.length} polls</p>
      </div>

      <div className="flex flex-col gap-6">
        {polls.map((poll) => (
          <PollCard
            key={poll.id}
            poll={poll}
            user={currentUser}
            onVote={onVote}
            onDelete={(deletedId: string) => setPolls(prev => prev.filter(p => p.id !== deletedId))}
          />
        ))}
      </div>
    </div>
  )
}

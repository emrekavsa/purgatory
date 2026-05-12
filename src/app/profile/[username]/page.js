"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useApp } from "@/context/AppContext"
import PollCard from "@/components/PollCard"
import { voteAction } from "@/lib/actions"

const POLL_SELECT = '*, profiles(username, id, avatar_url), poll_options(id, content, image_url, votes(user_id)), comments(id)'

export default function ProfilePage() {
  const { username } = useParams()
  const { user: currentUser, isDark, requireLogin } = useApp()
  const [profile, setProfile] = useState(null)
  const [polls, setPolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const isOwnProfile = currentUser?.username === username

  const fetchProfileData = async () => {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single()

      if (profileData) {
        setProfile(profileData)
        const { data: pollData } = await supabase
          .from("polls")
          .select(POLL_SELECT)
          .eq("user_id", profileData.id)
          .order("created_at", { ascending: false })

        if (pollData) setPolls(pollData)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfileData()
  }, [username])

  const uploadAvatar = async (event) => {
    try {
      setUploading(true)
      const file = event.target.files[0]
      if (!file) return

      // GÜVENLİK FİX: Rastgele isim yerine her kullanıcı için sabit dosya adı.
      // Uzantıyı sildik ki jpg/png fark etmeksizin hep aynı dosyanın üstüne yazılsın.
      const filePath = `${currentUser.id}/avatar`

      // GÜVENLİK FİX: upsert: true ile eskisinin üstüne yazıyoruz
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // GÜVENLİK FİX: Tarayıcı Cache'ini (Önbelleğini) kırmak için linke zaman damgası ekliyoruz
      const urlWithCacheBuster = `${publicUrl}?t=${new Date().getTime()}`

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlWithCacheBuster })
        .eq('id', currentUser.id)

      if (updateError) throw updateError

      setProfile({ ...profile, avatar_url: urlWithCacheBuster })
    } catch (error) {
      console.error(error)
      alert('Error uploading avatar!')
    } finally {
      setUploading(false)
    }
  }

  const onVote = async (pollId, optionId) => {
    if (!currentUser) return requireLogin()
    
    const result = await voteAction({ 
      poll_id: pollId, 
      option_id: optionId, 
      user_id: currentUser.id 
    })

    if (result.success) {
      const { data: updatedPoll } = await supabase
        .from('polls')
        .select(POLL_SELECT)
        .eq('id', pollId)
        .single()

      if (updatedPoll) {
        setPolls(prev => prev.map(p => p.id === pollId ? updatedPoll : p))
      }
    } else {
      if (result.error.includes('duplicate key') || result.error.includes('unique constraint')) {
        alert('You have already voted!')
      } else {
        alert(result.error)
      }
    }
  }

  if (loading) return null

  return (
    <div className="max-w-xl mx-auto p-4 pt-10">
      <div className="flex flex-col items-center mb-10 text-center">
        <div className="relative group">
          <div className={`w-24 h-24 rounded-full overflow-hidden mb-4 border-2 ${isDark ? 'border-zinc-800' : 'border-gray-200'}`}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={username} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full flex items-center justify-center text-3xl font-black ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                {username ? username[0].toUpperCase() : 'U'}
              </div>
            )}
          </div>
          
          {isOwnProfile && (
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity">
              <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={uploading} />
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
            // Profilde anket silindiğinde sayfayı yenilemeden direkt aradan çıkarır
            onDelete={(deletedId) => setPolls(prev => prev.filter(p => p.id !== deletedId))} 
          />
        ))}
      </div>
    </div>
  )
}
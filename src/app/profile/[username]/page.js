"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useApp } from "@/context/AppContext"
import PollCard from "@/components/PollCard"
import { handleVote, POLL_SELECT } from "@/lib/api"
import Login from "@/components/Login"

export default function ProfilePage() {
  const { username } = useParams()
  const { user: currentUser, isDark, realtimeTrigger } = useApp()
  const [polls, setPolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [isLoginOpen, setIsLoginOpen] = useState(false)

  const fetchUserPolls = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('polls')
      .select(POLL_SELECT)
      .eq('profiles.username', username)
      .order('created_at', { ascending: false })

    if (!error && data) setPolls(data)
    setLoading(false)
  }

  useEffect(() => {
    if (username) fetchUserPolls()
  }, [username, realtimeTrigger])

  const onVote = (pollId, optionId) =>
    handleVote(pollId, optionId, currentUser, setPolls, () => setIsLoginOpen(true))

  return (
    <div className="w-full">
      <div className="max-w-xl mx-auto p-4 mt-8">
        <div className={`p-8 rounded-3xl border mb-10 text-center ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-100'}`}>
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
            {username ? username[0].toUpperCase() : 'U'}
          </div>
          <h1 className="text-2xl font-black">@{username}</h1>
          <p className="opacity-50 text-sm mt-1">{polls.length} Polls Created</p>
        </div>

        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-10 font-bold text-blue-500 animate-pulse">Loading...</div>
          ) : polls.length > 0 ? (
            polls.map((poll) => (
              <PollCard
                key={poll.id}
                poll={poll}
                user={currentUser}
                onVote={onVote}
                isDark={isDark}
              />
            ))
          ) : (
            <div className="text-center py-20 opacity-30 font-bold italic">
              No polls found.
            </div>
          )}
        </div>
      </div>
      
      <Login isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} isDark={isDark} />
    </div>
  )
}
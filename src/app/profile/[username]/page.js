"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useApp } from "@/context/AppContext"
import PollCard from "@/components/PollCard"

export default function ProfilePage() {
  const { username } = useParams()
  const { user: currentUser, isDark } = useApp()
  const [polls, setPolls] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserPolls = async () => {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('polls')
        .select('*, profiles!inner(username), poll_options(*, votes(*)), comments(id)')
        .eq('profiles.username', username)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setPolls(data)
      }
      setLoading(false)
    }

    if (username) fetchUserPolls()
  }, [username])

  const handleVote = async (pollId, optionId) => {
    if (!currentUser) return alert("Please sign in!")
    const { error } = await supabase
      .from('votes')
      .insert([{ poll_id: pollId, option_id: optionId, user_id: currentUser.id }])
    
    if (!error) {
      window.location.reload()
    }
  }

  return (
    <div className="w-full">
      <div className="max-w-xl mx-auto p-4 mt-8">
        <div className={`p-8 rounded-3xl border mb-10 text-center ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-100'
        }`}>
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
            {username ? username[0].toUpperCase() : "U"}
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
                onVote={handleVote} 
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
    </div>
  )
}
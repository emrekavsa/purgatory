"use client"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useApp } from "@/context/AppContext"
import PollCard from "@/components/PollCard"
import { voteAction } from "@/lib/actions"

export const POLL_SELECT = '*, profiles(username, id, avatar_url), poll_options(id, content, image_url, votes(user_id)), comments(id)'

export default function Home() {
  const searchParams = useSearchParams()
  const category = searchParams.get('c')

  const { user, isDark, loading: authLoading, requireLogin } = useApp()
  const [polls, setPolls] = useState([])
  const [dataLoading, setDataLoading] = useState(false)
  const [sortBy, setSortBy] = useState('newest')

  const fetchPolls = async () => {
    setDataLoading(true)
    try {
      let query = supabase
        .from("polls")
        .select(POLL_SELECT)

      if (category) {
        query = query.eq('category', category)
      }

      const { data } = await query.order("created_at", { ascending: false })

      if (data) setPolls(data)
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    fetchPolls()
  }, [category])

  const onVote = async (pollId, optionId) => {
    if (!user) return requireLogin()

    const result = await voteAction({ poll_id: pollId, option_id: optionId, user_id: user.id })

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
      // Düzeltildi: string match yerine alreadyVoted flag
      if (result.alreadyVoted) {
        alert('You have already voted!')
      } else {
        alert(result.error)
      }
    }
  }

  if (authLoading) return null

  const sortedPolls = [...polls].sort((a, b) => {
    if (sortBy === 'popular') {
      const votesA = a.poll_options.reduce((acc, opt) => acc + (opt.votes?.length || 0), 0)
      const votesB = b.poll_options.reduce((acc, opt) => acc + (opt.votes?.length || 0), 0)
      return votesB - votesA
    }
    if (sortBy === 'interacted') {
      const commentsA = a.comments?.length || 0
      const commentsB = b.comments?.length || 0
      return commentsB - commentsA
    }
    return new Date(b.created_at) - new Date(a.created_at)
  })

  return (
    <div className="w-full">
      <div className="max-w-xl mx-auto p-4 mt-0">
        <div className="flex items-center justify-center gap-2 mb-6 mt-0">
          {['newest', 'popular', 'interacted'].map((type) => (
            <button
              key={type}
              onClick={() => setSortBy(type)}
              className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wider transition-all ${
                sortBy === type
                  ? 'bg-blue-600 text-white'
                  : isDark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-6">
          {sortedPolls.length > 0 ? (
            sortedPolls.map((poll) => (
              <PollCard
                key={poll.id}
                poll={poll}
                user={user}
                onVote={onVote}
              />
            ))
          ) : !dataLoading && (
            <div className="text-center py-20 opacity-30 font-bold italic">
              No polls found.
            </div>
          )}
        </div>

        {dataLoading && (
          <div className={`text-center py-10 font-bold animate-pulse ${isDark ? 'text-white' : 'text-blue-500'}`}>
            Loading...
          </div>
        )}
      </div>
    </div>
  )
}
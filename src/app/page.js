"use client"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useApp } from "@/context/AppContext"
import PollCard from "@/components/PollCard"
import { handleVote } from "@/lib/vote"

const POLL_SELECT = '*, profiles(username, id, avatar_url), poll_options(id, content, image_url, votes(user_id)), comments(id)'
const ITEMS_PER_PAGE = 10

export default function Home() {
  const searchParams = useSearchParams()
  const category = searchParams.get('c')

  const { user, isDark, loading: authLoading, requireLogin } = useApp()
  const [polls, setPolls] = useState([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [sortBy, setSortBy] = useState('newest')

  const fetchPolls = async (pageIndex, isNewFilter) => {
    isNewFilter ? setDataLoading(true) : setLoadingMore(true)

    try {
      let query = supabase.from("polls").select(POLL_SELECT)

      if (category) query = query.eq('category', category)

      if (sortBy === 'popular') {
        query = query.order('vote_count', { ascending: false })
      } else if (sortBy === 'interacted') {
        query = query.order('comment_count', { ascending: false })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      const from = pageIndex * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1
      const { data, error } = await query.range(from, to)

      if (error) throw error

      setHasMore(data.length === ITEMS_PER_PAGE)
      setPolls(prev => isNewFilter ? data : [...prev, ...data])
    } catch (error) {
      console.error("Fetch error:", error.message)
    } finally {
      setDataLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
  if (authLoading) return
  setPage(0)
  fetchPolls(0, true)
}, [category, sortBy, authLoading])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchPolls(nextPage, false)
  }

  const onVote = (pollId, optionId) => handleVote({
    user, pollId, optionId, requireLogin,
    onSuccess: (updatedPoll) => setPolls(prev => prev.map(p => p.id === pollId ? updatedPoll : p))
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

        {dataLoading && (
          <div className={`text-center py-20 font-bold animate-pulse ${isDark ? 'text-white' : 'text-blue-500'}`}>
            Loading...
          </div>
        )}

        {!dataLoading && (
          <div className="flex flex-col gap-6">
            {polls.length > 0 ? (
              polls.map((poll) => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  user={user}
                  onVote={onVote}
                  onDelete={(deletedId) => setPolls(prev => prev.filter(p => p.id !== deletedId))}
                />
              ))
            ) : (
              <div className="text-center py-20 opacity-30 font-bold italic">
                No polls found.
              </div>
            )}
          </div>
        )}

        {!dataLoading && hasMore && polls.length > 0 && (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                loadingMore
                  ? 'opacity-50 cursor-not-allowed'
                  : isDark ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-gray-100 text-black hover:bg-gray-200'
              }`}
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}

        {!hasMore && polls.length > 0 && (
          <div className="text-center py-10 font-bold text-xs opacity-30 uppercase tracking-widest">
            You've reached the end
          </div>
        )}

      </div>
    </div>
  )
}
"use client"
import { Suspense, useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useApp } from "@/context/AppContext"
import PollCard from "@/components/PollCard"
import { handleVote } from "@/lib/vote"
import { fetchPollCards } from "@/lib/polls"
import type { Poll } from "@/types/domain"

const ITEMS_PER_PAGE = 10

function HomeContent() {
  const searchParams = useSearchParams()
  const category = searchParams.get('c')

  const { user, isDark, loading: authLoading, requireLogin } = useApp()
  const [polls, setPolls] = useState<Poll[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [sortBy, setSortBy] = useState('newest')

  const fetchPolls = useCallback(async (pageIndex: number, isNewFilter: boolean) => {
    isNewFilter ? setDataLoading(true) : setLoadingMore(true)

    try {
      const from = pageIndex * ITEMS_PER_PAGE
      const nextPolls = await fetchPollCards({
        category,
        limit: ITEMS_PER_PAGE,
        offset: from,
      })
      if (sortBy === 'popular') {
        nextPolls.sort((a, b) => {
const aVotes = a.poll_options?.reduce((sum, option) => sum + Number(option.vote_count ?? option.votes?.length ?? 0), 0) || 0
const bVotes = b.poll_options?.reduce((sum, option) => sum + Number(option.vote_count ?? option.votes?.length ?? 0), 0) || 0
          return bVotes - aVotes
        })
      } else if (sortBy === 'interacted') {
nextPolls.sort((a, b) => Number(b.comment_count ?? b.comments?.length ?? 0) - Number(a.comment_count ?? a.comments?.length ?? 0))
      }
      setHasMore(nextPolls.length === ITEMS_PER_PAGE)
      setPolls(prev => isNewFilter ? nextPolls : [...prev, ...nextPolls])
    } catch (error) {
      console.error("Fetch error:", error instanceof Error ? error.message : error)
    } finally {
      setDataLoading(false)
      setLoadingMore(false)
    }
  }, [category, sortBy])

  useEffect(() => {
    if (authLoading) return
    setPage(0)
    void fetchPolls(0, true)
  }, [authLoading, fetchPolls])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchPolls(nextPage, false)
  }

  const onVote = (pollId: string, optionId: string) => handleVote({
    user, pollId, optionId, requireLogin,
    onSuccess: (updatedPoll: Poll) => setPolls(prev => prev.map(p => p.id === pollId ? updatedPoll : p))
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
                  onDelete={(deletedId: string) => setPolls(prev => prev.filter(p => p.id !== deletedId))}
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
            You&apos;ve reached the end
          </div>
        )}

      </div>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  )
}

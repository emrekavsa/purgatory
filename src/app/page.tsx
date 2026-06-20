"use client"
import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useApp } from "@/context/AppContext"
import PollCard from "@/components/PollCard"
import PollCardSkeleton from "@/components/PollCardSkeleton"
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

  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const isFetchingRef = useRef(false)
  const pageRef = useRef(0)

  const fetchPolls = useCallback(async (pageIndex: number, isNewFilter: boolean) => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    isNewFilter ? setDataLoading(true) : setLoadingMore(true)

    try {
      const from = pageIndex * ITEMS_PER_PAGE
      const nextPolls = await fetchPollCards({
        category,
        sort: sortBy,
        limit: ITEMS_PER_PAGE,
        offset: from,
      })
      setHasMore(nextPolls.length === ITEMS_PER_PAGE)
      setPolls(prev => isNewFilter ? nextPolls : [...prev, ...nextPolls])
    } catch (error) {
      console.error("Fetch error:", error instanceof Error ? error.message : error)
    } finally {
      setDataLoading(false)
      setLoadingMore(false)
      isFetchingRef.current = false
    }
  }, [category, sortBy])

  // Initial fetch & reset on filter/sort change
  useEffect(() => {
    if (authLoading) return
    setPage(0)
    pageRef.current = 0
    isFetchingRef.current = false
    void fetchPolls(0, true)
  }, [authLoading, fetchPolls])

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingRef.current) {
          const nextPage = pageRef.current + 1
          pageRef.current = nextPage
          setPage(nextPage)
          fetchPolls(nextPage, false)
        }
      },
      { rootMargin: "200px" }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [fetchPolls, hasMore, polls.length])

  const onVote = (pollId: string, optionId: string) => {
    const poll = polls.find(p => p.id === pollId)
    if (!poll) return
    handleVote({
      user, poll, optionId, requireLogin,
      onOptimistic: (updated: Poll) => setPolls(prev => prev.map(p => p.id === pollId ? updated : p)),
      onSuccess: (updated: Poll) => setPolls(prev => prev.map(p => p.id === pollId ? updated : p))
    })
  }

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
          <div className="flex flex-col gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <PollCardSkeleton key={i} />
            ))}
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

        {/* Infinite scroll sentinel + loading indicator */}
        {hasMore && polls.length > 0 && (
          <div ref={sentinelRef} className="flex justify-center py-8">
            {loadingMore && (
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-zinc-500' : 'bg-gray-400'}`} style={{ animationDelay: '0ms' }} />
                <span className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-zinc-500' : 'bg-gray-400'}`} style={{ animationDelay: '150ms' }} />
                <span className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-zinc-500' : 'bg-gray-400'}`} style={{ animationDelay: '300ms' }} />
              </div>
            )}
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

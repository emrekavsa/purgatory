"use client"
import { useEffect, useState, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useApp } from "@/context/AppContext"
import PollCard from "@/components/PollCard"
import { voteAction } from "@/lib/actions"

const POLL_SELECT = '*, profiles(username, id, avatar_url), poll_options(id, content, image_url, votes(user_id)), comments(id)'
const ITEMS_PER_PAGE = 10;

export default function Home() {
  const searchParams = useSearchParams()
  const category = searchParams.get('c') 
  
  const { user, isDark, loading: authLoading, requireLogin } = useApp()
  const [polls, setPolls] = useState([])
  
  const [dataLoading, setDataLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  
  const [sortBy, setSortBy] = useState('newest')
  
  const observer = useRef()

  const fetchPolls = async (pageIndex = 0, isNewFilter = false) => {
    if (isNewFilter) {
      setDataLoading(true)
      setPage(0)
    } else {
      setLoadingMore(true)
    }

    try {
      let query = supabase.from("polls").select(POLL_SELECT)

      if (category) {
        query = query.eq('category', category)
      }

      // GÜÇLENDİRİLMİŞ SIRALAMA: Javascript yerine doğrudan Supabase Computed Columns kullanıyoruz!
      if (sortBy === 'popular') {
        query = query.order('vote_count', { ascending: false })
      } else if (sortBy === 'interacted') {
        query = query.order('comment_count', { ascending: false })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      const from = pageIndex * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1
      query = query.range(from, to)

      const { data, error } = await query

      if (error) throw error;

      if (data) {
        if (data.length < ITEMS_PER_PAGE) {
          setHasMore(false)
        } else {
          setHasMore(true)
        }
        setPolls(prev => isNewFilter ? data : [...prev, ...data])
      }
    } catch (error) {
      console.error("Fetch hatası:", error.message)
    } finally {
      setDataLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchPolls(0, true)
  }, [category, sortBy])

  const lastElementRef = useCallback(node => {
    if (dataLoading || loadingMore) return;
    if (observer.current) observer.current.disconnect()

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => {
          const nextPage = prevPage + 1;
          fetchPolls(nextPage, false);
          return nextPage;
        })
      }
    })

    if (node) observer.current.observe(node)
  }, [dataLoading, loadingMore, hasMore, category, sortBy])


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
      if (result.error.includes('duplicate key') || result.error.includes('unique constraint')) {
        alert('You have already voted!')
      } else {
        alert(result.error)
      }
    }
  }

  if (authLoading) return null

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
            Loading Initial Data...
          </div>
        )}

        {!dataLoading && (
          <div className="flex flex-col gap-6">
            {polls.length > 0 ? (
              polls.map((poll, index) => {
                if (polls.length === index + 1) {
                  return (
                    <div ref={lastElementRef} key={poll.id}>
                      <PollCard 
                        poll={poll} 
                        user={user} 
                        onVote={onVote} 
                        onDelete={(deletedId) => setPolls(prev => prev.filter(p => p.id !== deletedId))}
                      />
                    </div>
                  )
                } else {
                  return (
                    <PollCard 
                      key={poll.id} 
                      poll={poll} 
                      user={user} 
                      onVote={onVote} 
                      onDelete={(deletedId) => setPolls(prev => prev.filter(p => p.id !== deletedId))}
                    />
                  )
                }
              })
            ) : (
              <div className="text-center py-20 opacity-30 font-bold italic">
                No polls found.
              </div>
            )}
          </div>
        )}

        {loadingMore && (
          <div className="text-center py-6 font-bold text-sm opacity-50 uppercase tracking-widest animate-pulse">
            Loading More...
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
"use client"
import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/context/AppContext'
import PollCard from '@/components/PollCard'
import Link from 'next/link'
import { handleVote } from '@/lib/vote'
import { fetchPollCards } from '@/lib/polls'
import type { Poll, Profile } from '@/types/domain'

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ""
  const { isDark, user, requireLogin } = useApp()

  const [activeTab, setActiveTab] = useState('polls')
  const [polls, setPolls] = useState<Poll[]>([])
  const [people, setPeople] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)

  const getResults = useCallback(async () => {
    if (query.trim() === "") {
      setLoading(false)
      return
    }

    setLoading(true)

    const peopleRes = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .ilike('username', `%${query}%`)
      .limit(10)

    const pollData = await fetchPollCards({ search: query, limit: 10 })

    setPolls(pollData)
    setPeople((peopleRes.data || []) as Profile[])
    setLoading(false)
  }, [query])

  useEffect(() => {
    void Promise.resolve().then(getResults)
  }, [getResults])

  const onVote = (pollId: string, optionId: string) => handleVote({
    user, pollId, optionId, requireLogin,
    onSuccess: (updatedPoll: Poll) => setPolls(prev => prev.map(p => p.id === pollId ? updatedPoll : p))
  })

  return (
    <div key={query} className="w-full">
      <div className="max-w-xl mx-auto p-4 mt-6">
        <h1 className="text-2xl font-bold mb-6 italic opacity-80">
          {query ? `Results for "${query}"` : "Search"}
        </h1>

        <div className={`flex gap-2 p-1 rounded-2xl mb-8 ${isDark ? 'bg-zinc-900' : 'bg-gray-200/50'}`}>
          <button
            onClick={() => setActiveTab('polls')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'polls'
                ? (isDark ? 'bg-zinc-800 text-white' : 'bg-white text-black shadow-sm')
                : 'opacity-50'
            }`}
          >
            Polls ({polls.length})
          </button>
          <button
            onClick={() => setActiveTab('people')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'people'
                ? (isDark ? 'bg-zinc-800 text-white' : 'bg-white text-black shadow-sm')
                : 'opacity-50'
            }`}
          >
            People ({people.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <p className="animate-pulse font-bold">Searching...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'polls' ? (
              polls.length > 0 ? (
                polls.map(poll => (
                  <PollCard
                    key={poll.id}
                    poll={poll}
                    user={user}
                    onVote={onVote}
                  />
                ))
              ) : <p className="text-center py-10 opacity-40">No polls found.</p>
            ) : (
              people.length > 0 ? (
                people.map(profile => (
                  <Link
                    key={profile.id}
                    href={`/profile/${encodeURIComponent(profile.username ?? "")}`}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                      isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-100'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold overflow-hidden">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.username ?? "User"} className="w-full h-full object-cover" />
                      ) : (
                        profile.username ? profile.username[0].toUpperCase() : "U"
                      )}
                    </div>
                    <div>
                      <div className="font-bold">@{profile.username}</div>
                      <div className="text-xs opacity-50">View Profile</div>
                    </div>
                  </Link>
                ))
              ) : <p className="text-center py-10 opacity-40">No users found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchContent />
    </Suspense>
  )
}

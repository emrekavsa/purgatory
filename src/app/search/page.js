"use client"
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/context/AppContext'
import Navbar from '@/components/Navbar'
import PollCard from '@/components/PollCard'
import Link from 'next/link'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ""
  const { isDark, user } = useApp()
  
  const [activeTab, setActiveTab] = useState('polls')
  const [polls, setPolls] = useState([])
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(false)

  const getResults = async () => {
    if (query.trim() === "") {
      setLoading(false)
      return
    }
    
    setLoading(true)
    
    const pollsRes = await supabase
      .from('polls')
      .select('id, title, created_at, profiles(username), poll_options(id, content, image_url, votes(user_id)), comments(id)')
      .ilike('title', `%${query}%`)
      .limit(10)

    const peopleRes = await supabase
      .from('profiles')
      .select('id, username')
      .ilike('username', `%${query}%`)
      .limit(10)

    setPolls(pollsRes.data || [])
    setPeople(peopleRes.data || [])
    setLoading(false)
  }

  useEffect(() => {
    getResults()
  }, [query])

  return (
    <div key={query} className={`min-h-screen pb-20 ${isDark ? 'bg-black text-white' : 'bg-gray-50 text-black'}`}>
      <Navbar />
      
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
                    isDark={isDark} 
                    onVote={getResults} 
                  />
                ))
              ) : <p className="text-center py-10 opacity-40">No polls found.</p>
            ) : (
              people.length > 0 ? (
                people.map(profile => (
                  <Link 
                    key={profile.id}
                    href={`/profile/${profile.username}`}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                      isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-100'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                      {profile.username ? profile.username[0].toUpperCase() : "U"}
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
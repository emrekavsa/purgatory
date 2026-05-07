"use client"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useApp } from "@/context/AppContext"
import PollCard from "@/components/PollCard"
import Login from "@/components/Login"
import { handleVote, POLL_SELECT } from "@/lib/api"

export default function Home() {
  const searchParams = useSearchParams()
  const category = searchParams.get('c') 
  
  const { user, isDark, loading: authLoading, realtimeTrigger } = useApp()
  const [polls, setPolls] = useState([])
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)

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
  }, [realtimeTrigger, category])

  const onVote = (pollId, optionId) =>
    handleVote(pollId, optionId, user, setPolls, () => setIsLoginOpen(true))

  if (authLoading) return null

  return (
    <div className="w-full">
      <div className="max-w-xl mx-auto p-4 mt-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 italic opacity-80 uppercase">
            Polls
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            {category 
              ? `Filtering by ${category}` 
              : "Join the discussion and cast your vote."}
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {polls.length > 0 ? (
            polls.map((poll) => (
              <PollCard
                key={poll.id}
                poll={poll}
                user={user}
                onVote={onVote}
                isDark={isDark}
              />
            ))
          ) : !dataLoading && (
            <div className="text-center py-20 opacity-30 font-bold italic">
              No polls found in this category.
            </div>
          )}
        </div>

        {dataLoading && (
          <div className={`text-center py-10 font-bold animate-pulse ${isDark ? 'text-white' : 'text-blue-500'}`}>
            Loading...
          </div>
        )}
      </div>

      <Login isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} isDark={isDark} />
    </div>
  )
}
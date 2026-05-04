"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/context/AppContext";
import PollCard from "@/components/PollCard";
import Login from "@/components/Login";

export default function Home() {
  const { user, isDark, loading: authLoading } = useApp();
  const [polls, setPolls] = useState([]);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  const fetchPolls = async () => {
    setDataLoading(true);
    try {
      const { data } = await supabase
        .from("polls")
        .select("id, title, created_at, profiles(username), poll_options(id, content, image_url, votes(user_id)), comments(id)")
        .order("created_at", { ascending: false });

      if (data) setPolls(data);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  const handleVote = async (pollId, optionId) => {
    if (!user) return setIsLoginOpen(true);
    
    const { error } = await supabase
      .from("votes")
      .insert([{ poll_id: pollId, option_id: optionId, user_id: user.id }]);
    
    if (!error) {
      fetchPolls();
    } else if (error.code === "23505") {
      alert("Already voted!");
    }
  };

  if (authLoading) return null;

  return (
    <div className="w-full">
      <div className="max-w-xl mx-auto p-4 mt-8">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 italic opacity-80">Polls</h1>
          <p className="text-gray-500 text-sm">Join the discussion and cast your vote.</p>
        </div>

        <div className="flex flex-col gap-6">
          {polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              user={user}
              onVote={handleVote}
              isDark={isDark}
            />
          ))}
          
          {!dataLoading && polls.length === 0 && (
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

      <Login isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} isDark={isDark} />
    </div>
  );
}
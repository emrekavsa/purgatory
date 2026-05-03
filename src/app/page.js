"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/context/AppContext";
import PollCard from "@/components/PollCard";
import Login from "@/components/Login";

export default function Home() {
  const { user, isDark, loading: authLoading } = useApp();
  const [polls, setPolls] = useState([]);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const fetchingRef = useRef(false);

  const fetchPolls = useCallback(async (isInitial = false) => {
    if (fetchingRef.current || (!isInitial && !hasMore)) return;

    fetchingRef.current = true;
    setDataLoading(true);
    
    try {
      let query = supabase
        .from("polls")
        .select("id, title, created_at, profiles(username), poll_options(id, content, image_url, votes(user_id)), comments(id)")
        .order("created_at", { ascending: false })
        .limit(5);

      if (!isInitial && polls.length > 0) {
        query = query.lt("created_at", polls[polls.length - 1].created_at);
      }

      const { data, error } = await query;

      if (!error && data) {
        setPolls((prev) => {
          if (isInitial) return data;
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewData = data.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNewData];
        });
        if (data.length < 5) setHasMore(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      fetchingRef.current = false;
      setDataLoading(false);
    }
  }, [polls, hasMore]);

  useEffect(() => {
    fetchPolls(true);
    
    return () => {
      fetchingRef.current = false;
      setDataLoading(false);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const atBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 300;
      if (atBottom && !fetchingRef.current && hasMore) {
        fetchPolls();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [fetchPolls, hasMore]);

  const handleVote = async (pollId, optionId) => {
    if (!user) return setIsLoginOpen(true);
    const { error } = await supabase
      .from("votes")
      .insert([{ poll_id: pollId, option_id: optionId, user_id: user.id }]);
    
    if (error) {
      alert(error.code === "23505" ? "Already voted!" : "Vote failed.");
    } else {
      fetchPolls(true);
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
          {polls.map((poll, index) => (
            <PollCard
              key={`${poll.id}-${index}`}
              poll={poll}
              user={user}
              onVote={handleVote}
              isDark={isDark}
            />
          ))}
        </div>

        {dataLoading && (
          <div className="text-center py-10 font-bold text-blue-500 opacity-70 animate-pulse">
            Loading...
          </div>
        )}
      </div>

      <Login isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} isDark={isDark} />
    </div>
  );
}
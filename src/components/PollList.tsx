"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import PollCard from "@/components/PollCard";
import PollCardSkeleton from "@/components/PollCardSkeleton";
import { handleVote } from "@/lib/vote";
import { fetchPollCards } from "@/lib/polls";
import { createClient } from "@/lib/supabase/client";
import type { Poll } from "@/types/domain";

const ITEMS_PER_PAGE = 10;

export default function PollList({
  initialPolls,
  initialCategory,
}: {
  initialPolls: Poll[];
  initialCategory?: string;
}) {
  const { user, isDark, loading: authLoading, requireLogin } = useApp();
  const supabase = createClient();
  
  const [polls, setPolls] = useState<Poll[]>(initialPolls);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialPolls.length === ITEMS_PER_PAGE);
  const [dataLoading, setDataLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [category, setCategory] = useState(initialCategory);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);
  const pageRef = useRef(0);
  const prevSortBy = useRef(sortBy);
  const prevCategory = useRef(initialCategory);

  const fetchPolls = useCallback(
    async (pageIndex: number, isNewFilter: boolean) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      isNewFilter ? setDataLoading(true) : setLoadingMore(true);

      try {
        const from = pageIndex * ITEMS_PER_PAGE;
        const nextPolls = await fetchPollCards(supabase, {
          category,
          sort: sortBy,
          limit: ITEMS_PER_PAGE,
          offset: from,
        });
        setHasMore(nextPolls.length === ITEMS_PER_PAGE);
        setPolls((prev) => (isNewFilter ? nextPolls : [...prev, ...nextPolls]));
      } catch (error) {
        console.error("Fetch error:", error instanceof Error ? error.message : error);
      } finally {
        setDataLoading(false);
        setLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [category, sortBy, supabase],
  );

  // Sync state when navigating via Next.js Links (e.g. initial load)
  useEffect(() => {
    setCategory(initialCategory);
    setPolls(initialPolls);
    setPage(0);
    pageRef.current = 0;
    setHasMore(initialPolls.length === ITEMS_PER_PAGE);
  }, [initialCategory, initialPolls]);

  // Sync state instantly on shallow pushState navigation
  useEffect(() => {
    const handleCategoryChange = (e: Event) => {
      const customEvent = e as CustomEvent<string | undefined>;
      const newCat = customEvent.detail;
      setCategory(newCat);
    };

    window.addEventListener("categoryChange", handleCategoryChange);
    return () => window.removeEventListener("categoryChange", handleCategoryChange);
  }, []);

  // Fetch when category changes
  useEffect(() => {
    if (prevCategory.current === category) return;
    prevCategory.current = category;
    
    setPage(0);
    pageRef.current = 0;
    isFetchingRef.current = false;
    void fetchPolls(0, true);
  }, [category, fetchPolls]);

  // Fetch when user clicks sort buttons
  useEffect(() => {
    if (prevSortBy.current === sortBy) return;
    prevSortBy.current = sortBy;
    
    setPage(0);
    pageRef.current = 0;
    isFetchingRef.current = false;
    void fetchPolls(0, true);
  }, [sortBy, fetchPolls]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingRef.current && hasMore) {
          const nextPage = pageRef.current + 1;
          pageRef.current = nextPage;
          setPage(nextPage);
          void fetchPolls(nextPage, false);
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchPolls, hasMore, polls.length]);

  const onVote = useCallback(
    (poll: Poll, optionId: string) => {
      handleVote({
        user,
        poll,
        optionId,
        requireLogin,
        onOptimistic: (updated: Poll) =>
          setPolls((prev) => prev.map((p) => (p.id === poll.id ? updated : p))),
        onSuccess: (updated: Poll) =>
          setPolls((prev) => prev.map((p) => (p.id === poll.id ? updated : p))),
      });
    },
    [user, requireLogin],
  );

  const onDelete = useCallback((deletedId: string) => {
    setPolls((prev) => prev.filter((p) => p.id !== deletedId));
  }, []);

  return (
    <div className="w-full">
      <div className="max-w-xl mx-auto p-4 mt-0">
        <div className="flex items-center justify-center gap-2 mb-6 mt-0">
          {["newest", "popular", "interacted"].map((type) => (
            <button
              key={type}
              onClick={() => setSortBy(type)}
              className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wider transition-all ${
                sortBy === type
                  ? "bg-blue-600 text-white"
                  : isDark
                    ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
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
              polls.map((poll, index) => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  user={user}
                  onVote={onVote}
                  priority={index < 2}
                  onDelete={onDelete}
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
                <span
                  className={`w-2 h-2 rounded-full animate-bounce ${isDark ? "bg-zinc-500" : "bg-gray-400"}`}
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className={`w-2 h-2 rounded-full animate-bounce ${isDark ? "bg-zinc-500" : "bg-gray-400"}`}
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className={`w-2 h-2 rounded-full animate-bounce ${isDark ? "bg-zinc-500" : "bg-gray-400"}`}
                  style={{ animationDelay: "300ms" }}
                />
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
  );
}

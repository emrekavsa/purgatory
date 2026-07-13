"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/context/AppContext";
import PollCard from "@/components/PollCard";
import PollCardSkeleton from "@/components/PollCardSkeleton";
import { handleVote } from "@/lib/vote";
import { fetchPollCards } from "@/lib/polls";
import type { Poll, Profile } from "@/types/domain";
import {
  IMAGE_ACCEPT,
  validateImageFile,
} from "@/lib/validation";

const ITEMS_PER_PAGE = 10;

export default function ProfileClient({
  username,
  initialProfile,
  initialPolls,
}: {
  username: string;
  initialProfile: Profile | null;
  initialPolls: Poll[];
}) {
  const { user: currentUser, isDark, requireLogin } = useApp();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [polls, setPolls] = useState<Poll[]>(initialPolls);
  const [uploading, setUploading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialPolls.length === ITEMS_PER_PAGE);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);
  const pageRef = useRef(0);
  const isFirstRender = useRef(true);

  const isOwnProfile = currentUser?.username === username;

  // Fetch polls with pagination
  const fetchPolls = useCallback(
    async (pageIndex: number, isFirst: boolean) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      isFirst ? setDataLoading(true) : setLoadingMore(true);

      try {
        const data = await fetchPollCards(supabase, {
          profileUsername: username,
          limit: ITEMS_PER_PAGE,
          offset: pageIndex * ITEMS_PER_PAGE,
        });
        setHasMore(data.length === ITEMS_PER_PAGE);
        setPolls((prev) => (isFirst ? data : [...prev, ...data]));
      } catch (err) {
        console.error(err);
      } finally {
        setDataLoading(false);
        setLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [username, supabase],
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    pageRef.current = 0;
    isFetchingRef.current = false;
    void fetchPolls(0, true);
  }, [fetchPolls]);

  // IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingRef.current && hasMore) {
          const nextPage = pageRef.current + 1;
          pageRef.current = nextPage;
          void fetchPolls(nextPage, false);
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchPolls, hasMore, polls.length]);

  const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file || !currentUser) return;
      const validationError = await validateImageFile(file);
      if (validationError) {
        alert(validationError);
        return;
      }

      const filePath = `${currentUser.id}/avatar`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "31536000",
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const urlWithCacheBuster = `${publicUrl}?t=${new Date().getTime()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlWithCacheBuster })
        .eq("id", currentUser.id);

      if (updateError) throw updateError;

      if (profile) setProfile({ ...profile, avatar_url: urlWithCacheBuster });
    } catch (error) {
      console.error(error);
      alert("Error uploading avatar!");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const onVote = useCallback(
    (poll: Poll, optionId: string) => {
      handleVote({
        user: currentUser,
        poll,
        optionId,
        requireLogin,
        onOptimistic: (updated: Poll) =>
          setPolls((prev) => prev.map((p) => (p.id === poll.id ? updated : p))),
        onSuccess: (updated: Poll) =>
          setPolls((prev) => prev.map((p) => (p.id === poll.id ? updated : p))),
      });
    },
    [currentUser, requireLogin],
  );

  const onDelete = useCallback((deletedId: string) => {
    setPolls((prev) => prev.filter((p) => p.id !== deletedId));
  }, []);

  return (
    <div className="max-w-xl mx-auto p-4 pt-10">
      <div className="flex flex-col items-center mb-10 text-center">
        <div
          className={`relative group w-24 h-24 rounded-full overflow-hidden mb-4 border-2 ${isDark ? "border-zinc-800" : "border-gray-200"}`}
        >
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={username}
              fill
              priority
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center text-3xl font-black ${isDark ? "bg-zinc-800" : "bg-gray-100"}`}
            >
              {username ? username[0].toUpperCase() : "U"}
            </div>
          )}

          {isOwnProfile && (
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              <input
                type="file"
                accept={IMAGE_ACCEPT}
                className="hidden"
                onChange={uploadAvatar}
                disabled={uploading}
              />
              <span className="text-white text-xs font-bold uppercase tracking-tighter">
                {uploading ? "uploading..." : "edit"}
              </span>
            </label>
          )}
        </div>

        <h1 className="text-2xl font-black">@{username}</h1>
        <p className="opacity-50 text-sm mt-1">
          {polls.length}
          {hasMore ? "+" : ""} polls
        </p>
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
                user={currentUser}
                onVote={onVote}
                priority={index < 2}
                onDelete={onDelete}
              />
            ))
          ) : (
            <div className="text-center py-20 opacity-30 font-bold italic">
              No polls yet.
            </div>
          )}
        </div>
      )}

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
  );
}

"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/context/AppContext";
import PollCard from "@/components/PollCard";
import Comment from "@/components/Comment";
import PollCardSkeleton from "@/components/PollCardSkeleton";
import { handleVote } from "@/lib/vote";
import type { Poll, CommentRecord } from "@/types/domain";
import { MAX_COMMENT_LENGTH } from "@/lib/validation";

export default function PollDetailClient({
  initialPoll,
  initialComments,
  pollId,
}: {
  initialPoll: Poll;
  initialComments: CommentRecord[];
  pollId: string;
}) {
  const supabase = createClient();
  const { user, isDark, requireLogin } = useApp();

  const [poll, setPoll] = useState<Poll | null>(initialPoll);
  const [comments, setComments] = useState<CommentRecord[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(initialComments.length === 20);
  const [loadingComments, setLoadingComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const observer = useRef<IntersectionObserver | null>(null);

  const loadMoreComments = useCallback(async () => {
    if (loadingComments || !hasMoreComments) return;
    setLoadingComments(true);

    const { data, error } = await supabase
      .from("comments")
      .select("*, profiles(username, avatar_url)")
      .eq("poll_id", pollId)
      .order("created_at", { ascending: false })
      .range(comments.length, comments.length + 19);

    if (!error && data) {
      const formatted = data as CommentRecord[];
      setComments((prev) => [...prev, ...formatted]);
      if (formatted.length < 20) setHasMoreComments(false);
    }
    setLoadingComments(false);
  }, [comments.length, hasMoreComments, loadingComments, pollId, supabase]);

  const lastCommentRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loadingComments) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMoreComments) {
          void loadMoreComments();
        }
      });

      if (node) observer.current.observe(node);
    },
    [loadingComments, hasMoreComments, loadMoreComments],
  );

  const onVote = useCallback(
    (pollParam: Poll, optionId: string) => {
      if (!poll) return;
      handleVote({
        user,
        poll: pollParam,
        optionId,
        requireLogin,
        onOptimistic: setPoll,
        onSuccess: setPoll,
      });
    },
    [user, requireLogin, poll]
  );

  const handleComment = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return requireLogin();
    const content = newComment.trim();
    if (!content || content.length > MAX_COMMENT_LENGTH || commenting) return;

    setCommenting(true);
    const { error } = await supabase.from("comments").insert([
      {
        poll_id: pollId,
        user_id: user.id,
        content,
      },
    ]);

    if (!error) {
      setNewComment("");
      const { data } = await supabase
        .from("comments")
        .select("*, profiles(username, avatar_url)")
        .eq("poll_id", pollId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) {
        setComments(data as CommentRecord[]);
        if (poll) {
          setPoll({
            ...poll,
            comment_count: String(Number(poll.comment_count || 0) + 1),
          });
        }
      }
    } else {
      alert(error.message);
    }
    setCommenting(false);
  };

  const handleCommentUpdate = async (commentId: string, content: string) => {
    const normalizedContent = content.trim();
    if (!normalizedContent || normalizedContent.length > MAX_COMMENT_LENGTH) {
      alert(`Comments must be between 1 and ${MAX_COMMENT_LENGTH} characters.`);
      return;
    }

    const { error } = await supabase
      .from("comments")
      .update({ content: normalizedContent })
      .eq("id", commentId);
    if (!error) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, content: normalizedContent } : c,
        ),
      );
    } else {
      alert(error.message);
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!user || !confirm("Delete this comment?")) return;

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      alert(error.message);
      return;
    }

    const removedIds = new Set<string>([commentId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const comment of comments) {
        if (
          comment.parent_id &&
          removedIds.has(comment.parent_id) &&
          !removedIds.has(comment.id)
        ) {
          removedIds.add(comment.id);
          changed = true;
        }
      }
    }

    setComments((previous) =>
      previous.filter((comment) => !removedIds.has(comment.id)),
    );
    setPoll((current) =>
      current
        ? {
            ...current,
            comment_count: String(
              Math.max(0, Number(current.comment_count || 0) - removedIds.size),
            ),
          }
        : current,
    );
  };

  const handleReply = async (
    commentId: string,
    content: string | null,
  ) => {
    if (!user) return requireLogin();
    const normalizedContent = content?.trim();
    if (
      !normalizedContent ||
      normalizedContent.length > MAX_COMMENT_LENGTH ||
      commenting
    ) {
      return;
    }

    setCommenting(true);
    const { error } = await supabase.from("comments").insert([
      {
        poll_id: pollId,
        user_id: user.id,
        parent_id: commentId,
        content: normalizedContent,
      },
    ]);
    if (!error) {
      setReplyingTo(null);
      // refetch comments to show new reply
      const { data } = await supabase
        .from("comments")
        .select("*, profiles(username, avatar_url)")
        .eq("poll_id", pollId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) {
        setComments(data as CommentRecord[]);
      }
    } else {
      alert(error.message);
    }
    setCommenting(false);
  };

  if (!poll) {
    return (
      <div className="max-w-xl mx-auto p-4 mt-6">
        <PollCardSkeleton />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="max-w-xl mx-auto p-4 mt-6">
        <div
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 mb-6 cursor-pointer opacity-50 hover:opacity-100 transition-opacity font-bold text-sm"
        >
          <span>←</span> Back
        </div>

        <PollCard poll={poll} user={user} onVote={onVote} />

        <div className={`mt-8 p-6 rounded-[32px] border shadow-xl ${isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-gray-100 text-black"}`}>
          <h3 className="text-xl font-black mb-6">Discussion ({poll.comment_count || 0})</h3>

          <form onSubmit={handleComment} className="mb-8 flex gap-3">
            <input
              type="text"
              placeholder="Write a comment..."
              required
              value={newComment}
              maxLength={MAX_COMMENT_LENGTH}
              onChange={(e) => setNewComment(e.target.value)}
              className={`flex-1 px-4 py-3 rounded-2xl border outline-none text-sm transition-all ${
                isDark
                  ? "bg-zinc-900 border-zinc-800 focus:border-zinc-600 text-white"
                  : "bg-gray-50 border-gray-200 focus:border-gray-300 text-black"
              }`}
            />
            <button
              disabled={commenting}
              className="px-6 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
            >
              Post
            </button>
          </form>

          <div className="space-y-4">
            {comments.filter((c) => !c.parent_id).length > 0 ? (
              comments
                .filter((c) => !c.parent_id)
                .map((main) => (
                  <div key={main.id}>
                    <Comment
                      comment={main}
                      allComments={comments}
                      user={user}
                      onDelete={handleCommentDelete}
                      onUpdate={handleCommentUpdate}
                      onReply={handleReply}
                      replyingTo={replyingTo}
                      setReplyingTo={setReplyingTo}
                    />
                  </div>
                ))
            ) : (
              <p className="text-center py-10 opacity-40 italic font-bold">
                No comments yet. Be the first!
              </p>
            )}
            
            {/* Infinite scroll sentinel */}
            <div ref={lastCommentRef} className="h-4 w-full" />

            {loadingComments && (
              <p className="text-center py-4 opacity-50 text-sm font-bold animate-pulse">
                Loading more...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

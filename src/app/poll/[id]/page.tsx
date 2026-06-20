"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/context/AppContext";
import PollCard from "@/components/PollCard";
import Comment from "@/components/Comment";
import ReportModal from "@/components/ReportModal";
import type { CommentRecord, Poll, ReportTargetType } from "@/types/domain";

const POLL_SELECT =
  "*, profiles(username, id, avatar_url), poll_options(id, content, image_url, votes(user_id)), comments(id)";

export default function PollDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user, isDark, requireLogin } = useApp();

  const [poll, setPoll] = useState<Poll | null>(null);
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ id: string | null; type: ReportTargetType | null }>({ id: null, type: null });
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const commentInputRef = useRef<HTMLTextAreaElement | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const { data: p } = await supabase
        .from("polls")
        .select(POLL_SELECT)
        .eq("id", id)
        .single();
      const { data: c } = await supabase
        .from("comments")
        .select("*, profiles(username, id, avatar_url)")
        .eq("poll_id", id)
        .order("created_at", { ascending: true });

      if (p) setPoll(p as Poll);
      setComments((c || []) as CommentRecord[]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) void fetchData();
  }, [fetchData, id]);

  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel("votes-" + id)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "votes",
        },
        () => {
          void fetchData();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchData, id]);

  const onVote = async (pollId: string, optionId: string) => {
    if (!user) return requireLogin();
    const { error } = await supabase.from("votes").insert([
      {
        poll_id: pollId,
        option_id: optionId,
        user_id: user.id,
      },
    ]);

    if (!error) {
      fetchData();
    } else if (
      error.message.includes("duplicate key") ||
      error.message.includes("unique constraint")
    ) {
      alert("You already voted!");
    } else {
      alert(error.message);
    }
  };

  const handleCommentSubmit = async (e?: FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!user || !newComment.trim() || submitting) return;
    setSubmitting(true);

    const { error } = await supabase.from("comments").insert([
      {
        poll_id: id,
        user_id: user.id,
        content: newComment.trim(),
      },
    ]);

    if (!error) {
      setNewComment("");
      fetchData();
    } else {
      alert(error.message);
    }
    setSubmitting(false);
  };

  const handleReply = async (parentId: string, content: string | null, isReport = false) => {
    if (isReport) {
      if (!user) return requireLogin();
      setReportTarget({ id: parentId, type: "Comment" });
      setIsReportOpen(true);
      return;
    }

    if (!user || !content?.trim()) return;
    const { error } = await supabase.from("comments").insert([
      {
        poll_id: id,
        user_id: user.id,
        content: content.trim(),
        parent_id: parentId,
      },
    ]);

    if (!error) {
      setReplyingTo(null);
      fetchData();
    } else {
      alert(error.message);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return requireLogin();
    if (!confirm("Delete comment?")) return;

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id);

    if (!error) fetchData();
    else alert(error.message);
  };

  const handleUpdateComment = async (commentId: string, content: string) => {
    if (!user) return requireLogin();

    const { error } = await supabase
      .from("comments")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", commentId)
      .eq("user_id", user.id);

    if (!error) fetchData();
    else alert(error.message);
  };

  if (!poll && !loading)
    return (
      <div className="p-10 text-center font-bold opacity-40">
        Poll not found.
      </div>
    );

  return (
    <div className="w-full">
      <div className="max-w-xl mx-auto p-4 mt-6">
        <PollCard
          poll={poll}
          user={user}
          onVote={onVote}
          onCommentClick={() => commentInputRef.current?.focus()}
        />

        <div
          className={`mt-8 p-6 rounded-3xl border shadow-sm ${isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-gray-100 text-black"}`}
        >
          <div className="mb-5 font-bold text-lg tracking-tight">
            Discussion ({comments.length})
          </div>

          <form
            onSubmit={handleCommentSubmit}
            className="mb-8 flex gap-2 items-center"
          >
            <textarea
              ref={commentInputRef}
              placeholder="Share your thoughts..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className={`flex-1 min-h-10 max-h-28 px-3.5 py-2.5 rounded-xl border outline-none resize-none text-sm leading-5 ${isDark ? "bg-zinc-800 border-zinc-700 text-white" : "bg-white border-gray-200 text-black"}`}
              rows={1}
            />
            <button
              disabled={submitting}
              type="submit"
              className="h-10 px-4 bg-blue-600 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-all"
            >
              {submitting ? "..." : "Post"}
            </button>
          </form>

          <div className="space-y-4">
            {comments
              .filter((c) => !c.parent_id)
              .map((main) => (
                <div key={main.id}>
                  <Comment
                    comment={main}
                    allComments={comments}
                    user={user}
                    onDelete={handleDeleteComment}
                    onUpdate={handleUpdateComment}
                    onReply={handleReply}
                    replyingTo={replyingTo}
                    setReplyingTo={setReplyingTo}
                  />
                </div>
              ))}
          </div>
        </div>
      </div>

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetId={reportTarget.id}
        targetType={reportTarget.type}
        userId={user?.id}
      />
    </div>
  );
}

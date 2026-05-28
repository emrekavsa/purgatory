"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/context/AppContext";
import PollCard from "@/components/PollCard";
import Comment from "@/components/Comment";
import ReportModal from "@/components/ReportModal";
import {
  createCommentAction,
  deleteCommentAction,
  updateCommentAction,
  voteAction,
} from "@/lib/actions";

const POLL_SELECT =
  "*, profiles(username, id, avatar_url), poll_options(id, content, image_url, votes(user_id)), comments(id)";

export default function PollDetailPage() {
  const { id } = useParams();
  const { user, isDark, requireLogin } = useApp();

  const [poll, setPoll] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState({ id: null, type: null });
  const [replyingTo, setReplyingTo] = useState(null);

  const commentInputRef = useRef(null);

  const fetchData = async () => {
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

      if (p) setPoll(p);
      setComments(c || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);
  const onVote = async (pollId, optionId) => {
    if (!user) return requireLogin();

    const result = await voteAction({
      poll_id: pollId,
      option_id: optionId,
      user_id: user.id,
    });

    if (result.success) {
      fetchData();
    } else {
      if (
        result.error.includes("duplicate key") ||
        result.error.includes("unique constraint")
      ) {
        alert("You have already voted!");
      } else {
        alert(result.error);
      }
    }
  };

  const handleCommentSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!user || !newComment.trim() || submitting) return;

    setSubmitting(true);
    const result = await createCommentAction({
      poll_id: id,
      user_id: user.id,
      content: newComment.trim(),
    });

    if (result.success) {
      setNewComment("");
      fetchData();
    } else {
      alert(result.error);
    }
    setSubmitting(false);
  };

  const handleReply = async (parentId, content, isReport = false) => {
    if (isReport) {
      if (!user) return requireLogin();
      setReportTarget({ id: parentId, type: "Comment" });
      setIsReportOpen(true);
      return;
    }

    if (!user || !content?.trim()) return;
    const result = await createCommentAction({
      poll_id: id,
      user_id: user.id,
      content: content.trim(),
      parent_id: parentId,
    });
    if (result.success) {
      setReplyingTo(null);
      fetchData();
    } else alert(result.error);
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm("Delete this comment?")) return;
    const result = await deleteCommentAction({
      comment_id: commentId,
      user_id: user.id,
    });
    if (result.success) fetchData();
    else alert(result.error);
  };

  const handleUpdateComment = async (commentId, content) => {
    const result = await updateCommentAction({
      comment_id: commentId,
      user_id: user.id,
      content,
    });
    if (result.success) fetchData();
    else alert(result.error);
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
          <div className="mb-8 font-bold text-lg tracking-tight">
            Discussion ({comments.length})
          </div>

          <form
            onSubmit={handleCommentSubmit}
            className="mb-10 flex gap-3 items-stretch"
          >
            <textarea
              ref={commentInputRef}
              placeholder="Share your thoughts..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className={`flex-1 p-4 rounded-2xl border outline-none resize-none ${isDark ? "bg-zinc-800 border-zinc-700 text-white" : "bg-white border-gray-200 text-black"}`}
              rows="2"
            />
            <button
              disabled={submitting}
              type="submit"
              className="px-6 min-h-[56px] h-auto bg-blue-600 text-white font-bold rounded-2xl disabled:opacity-50 transition-all"
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

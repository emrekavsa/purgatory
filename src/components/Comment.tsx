"use client";
import { useState } from "react";
import { formatRelativeTime } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { useRouter } from 'next/navigation'
import type { Dispatch, SetStateAction } from "react";
import type { AppUser, CommentRecord } from "@/types/domain";

type CommentProps = {
  comment: CommentRecord;
  allComments: CommentRecord[];
  depth?: number;
  user: AppUser | null;
  onDelete: (commentId: string) => void | Promise<void>;
  onUpdate: (commentId: string, content: string) => void | Promise<void>;
  onReply: (commentId: string, content: string | null, isReport?: boolean) => void | Promise<void>;
  replyingTo: string | null;
  setReplyingTo: Dispatch<SetStateAction<string | null>>;
};

export default function Comment({
  comment,
  allComments,
  depth = 0,
  user,
  onDelete,
  onUpdate,
  onReply,
  replyingTo,
  setReplyingTo,
}: CommentProps) {
  const { isDark } = useApp();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [replyContent, setReplyContent] = useState(
    `@${comment.profiles?.username} `,
  );
  const [collapsed, setCollapsed] = useState(false);

  const replies = allComments.filter((r) => r.parent_id === comment.id);
  const isEdited =
    comment.updated_at &&
    new Date(comment.updated_at).getTime() - new Date(comment.created_at || "").getTime() > 1000;
  const isReplying = replyingTo === comment.id;

  const handleSave = () => {
    if (!editContent.trim()) return;
    onUpdate(comment.id, editContent.trim());
    setIsEditing(false);
  };

  const handleReply = () => {
    onReply(comment.id, replyContent.trim());
    setReplyContent(`@${comment.profiles?.username} `);
  };

  const toggleReply = () => {
    setReplyingTo(isReplying ? null : comment.id);
    setReplyContent(`@${comment.profiles?.username} `);
  };

  return (
    <div className={`relative ${depth > 0 ? "ml-6 md:ml-10" : ""}`}>
      {depth < 6 && (
        <div
          onClick={
            replies.length > 0 ? () => setCollapsed(!collapsed) : undefined
          }
          className={`absolute left-[15px] top-[48px] bottom-0 w-[2px] transition-colors ${
            replies.length > 0
              ? `cursor-pointer hover:bg-blue-500`
              : "cursor-default"
          } ${isDark ? "bg-zinc-800" : "bg-gray-200"}`}
        />
      )}

      <div className="group/comment flex gap-3 py-3">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-white font-bold text-[10px] overflow-hidden">
          {comment.profiles?.avatar_url ? (
            <img
              src={comment.profiles.avatar_url}
              alt={comment.profiles?.username ?? "User"}
              className="w-full h-full object-cover"
            />
          ) : (
            comment.profiles?.username?.[0]?.toUpperCase()
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <div className="text-xs space-x-1">
              <span
                className="font-bold cursor-pointer"
                  onClick={() =>
                    comment.profiles?.username &&
                    router.push(`/profile/${encodeURIComponent(comment.profiles.username)}`)
                  }
              >
                @{comment.profiles?.username}
              </span>
              <span className="opacity-40">
                • {formatRelativeTime(comment.created_at)}
              </span>
              {isEdited && <span className="opacity-30 italic">(edited)</span>}
            </div>

            <div className="flex gap-2 opacity-0 group-hover/comment:opacity-100 transition-opacity items-center">
              {user && user.id !== comment.user_id && (
                <button
                  onClick={() => onReply(comment.id, null, true)}
                  className="p-1 opacity-40 hover:opacity-100 hover:bg-red-500/10 rounded-full transition-all"
                >
                  <img
                    src="/report.svg"
                    alt="Report"
                    className={`w-3.5 h-3.5 ${isDark ? "invert" : ""}`}
                  />
                </button>
              )}
              {user?.id === comment.user_id && !isEditing && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-3.5 h-3.5 opacity-40 hover:opacity-100 dark:invert"
                  >
                    <img src="/edit-icon.svg" alt="Edit" />
                  </button>
                  <button
                    onClick={() => onDelete(comment.id)}
                    className="w-3.5 h-3.5 opacity-40 hover:opacity-100"
                  >
                    <img src="/delete-icon.svg" alt="Delete" />
                  </button>
                </>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="mt-1 flex flex-col gap-2">
              <textarea
                className={`w-full p-3 text-sm rounded-xl border outline-none resize-none ${isDark ? "bg-zinc-800 border-zinc-700 text-white" : "bg-white border-gray-100 text-black"}`}
                rows={2}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-2 text-[10px] font-bold">
                <button
                  onClick={() => setIsEditing(false)}
                  className="opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="bg-blue-600 text-white px-3 py-1 rounded-full"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm opacity-90 leading-relaxed">
              {comment.content}
            </p>
          )}

          <button
            onClick={toggleReply}
            className="text-[10px] font-bold opacity-40 mt-2 hover:opacity-100"
          >
            {isReplying ? "CANCEL" : "REPLY"}
          </button>

          {isReplying && (
<div className="mt-2 flex gap-2 items-center">
              <textarea
className={`flex-1 min-h-9 max-h-24 px-3 py-2 text-sm leading-5 rounded-xl border outline-none resize-none ${isDark ? "bg-zinc-800 border-zinc-700 text-white" : "bg-white border-gray-100 text-black"}`}
rows={1}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                autoFocus
              />
              <button
                onClick={handleReply}
className="h-9 px-4 bg-blue-600 text-white text-xs font-bold rounded-xl transition-all hover:bg-blue-700"
              >
                Post
              </button>
            </div>
          )}
        </div>
      </div>

      {!collapsed &&
        replies.map((reply) => (
          <Comment
            key={reply.id}
            comment={reply}
            allComments={allComments}
            depth={depth + 1}
            user={user}
            onDelete={onDelete}
            onUpdate={onUpdate}
            onReply={onReply}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
          />
        ))}
    </div>
  );
}

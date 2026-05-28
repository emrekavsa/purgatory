"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatRelativeTime } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import ReportModal from "@/components/ReportModal";
import { deletePollAction } from "@/lib/actions";

export default function PollCard({ poll, user, onVote, onDelete }) {
  const router = useRouter();
  const { isDark } = useApp();
  const [copied, setCopied] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  if (!poll || !poll.poll_options) return null;

  const authorName = poll.profiles?.username || "Anonymous";
  const hasImages = poll.poll_options.some((opt) => opt.image_url);
  const commentCount = poll.comments?.length || 0;
  const category = poll.category || "General";
  const totalVotes = poll.poll_options.reduce(
    (sum, opt) => sum + (opt.votes?.length || 0),
    0,
  );

  const userVote = user
    ? poll.poll_options.find((opt) =>
        opt.votes?.some((v) => v.user_id === user.id),
      )
    : null;

  const hasVoted = !!userVote;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this poll?")) return;
    const res = await deletePollAction(user.id, poll.id);
    if (res.success) {
      onDelete ? onDelete(poll.id) : router.refresh();
    } else {
      alert("Failed to delete: " + res.error);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/poll/${poll.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 700);
  };

  const getContainerClass = () => {
    if (!hasImages) return "flex flex-col gap-2";
    if (poll.poll_options.length === 3) return "grid grid-cols-3 gap-4";
    return "grid grid-cols-2 gap-4";
  };
  const containerClass = getContainerClass();
  return (
    <div
      className={`group p-5 border rounded-3xl transition-all relative ${
        isDark
          ? "bg-zinc-900 border-zinc-800 text-white"
          : "bg-white border-gray-200 text-black"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm">
          <div
            onClick={() => router.push(`/profile/${authorName}`)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
              {poll.profiles?.avatar_url ? (
                <img
                  src={poll.profiles.avatar_url}
                  alt={authorName}
                  className="w-full h-full object-cover"
                />
              ) : (
                authorName[0].toUpperCase()
              )}
            </div>
            <span className="font-semibold hover:underline">@{authorName}</span>
          </div>
          <span className="opacity-30 text-xs">
            • {formatRelativeTime(poll.created_at)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {user && user.id !== poll.user_id && (
            <button
              onClick={() => setIsReportOpen(true)}
              className="p-2 opacity-30 hover:opacity-100 hover:bg-red-500/10 rounded-full transition-all"
            >
              <img
                src="/report.svg"
                alt="Report"
                className={`w-4 h-4 ${isDark ? "invert" : ""}`}
              />
            </button>
          )}

          {(user?.id === poll.user_id || user?.is_admin) && (
            <button
              onClick={handleDelete}
              className="transition-all opacity-0 group-hover:opacity-100 outline-none"
            >
              <img
                src="/delete-icon.svg"
                alt="Delete"
                className="w-4 h-4 opacity-40 hover:opacity-100 transition-opacity"
              />
            </button>
          )}

          <div
            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              isDark ? "bg-zinc-800 text-zinc-400" : "bg-gray-100 text-gray-500"
            }`}
          >
            {category}
          </div>
        </div>
      </div>

      <h3 className="text-xl font-bold mb-5 leading-tight">{poll.title}</h3>

      <div className={containerClass}>
        {poll.poll_options.map((opt) => {
          const voteCount = opt.votes?.length || 0;
          const percent =
            totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isMyChoice = opt.id === userVote?.id;

          return (
            <button
              key={opt.id}
              onClick={() => onVote(poll.id, opt.id)}
              disabled={hasVoted}
              className={`group/opt relative flex overflow-hidden border rounded-2xl min-h-[56px] transition-all
                ${hasImages ? "flex-col" : "flex-row items-center p-4"}
                ${isDark ? "border-zinc-800" : "border-gray-100"}
                ${!hasVoted ? (isDark ? "hover:bg-zinc-800" : "hover:bg-gray-50") : "cursor-default"}
                ${isMyChoice ? "ring-2 ring-blue-500" : ""}
              `}
            >
              {hasVoted && (
                <div
                  className={`absolute left-0 top-0 bottom-0 transition-all duration-1000 ease-out z-0 ${
                    isMyChoice
                      ? "bg-blue-500/10"
                      : isDark
                        ? "bg-zinc-800"
                        : "bg-gray-100"
                  }`}
                  style={{ width: `${percent}%` }}
                />
              )}

              {hasImages && (
                <div
                  className={`relative w-full aspect-[4/3] overflow-hidden border-b border-inherit z-10 ${isDark ? "bg-black" : "bg-zinc-100"}`}
                >
                  {opt.image_url ? (
                    <img
                      src={opt.image_url}
                      className="w-full h-full object-contain p-1"
                      alt={opt.content}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-20 text-xs italic">
                      no image
                    </div>
                  )}
                </div>
              )}

              <div
                className={`relative z-10 flex w-full items-center justify-between ${hasImages ? "p-4" : "flex-1 text-left"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{opt.content}</span>
                  {isMyChoice && (
                    <span className="text-blue-500 font-bold">✓</span>
                  )}
                </div>
                {hasVoted && (
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-sm">{percent}%</span>
                    <span className="text-xs opacity-40">
                      {voteCount} votes
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div
        className={`mt-5 flex items-center justify-between border-t pt-4 ${isDark ? "border-zinc-800" : "border-gray-100"}`}
      >
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/poll/${poll.id}`)}
            className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full ${isDark ? "bg-zinc-800 text-zinc-300" : "bg-gray-100 text-gray-600"}`}
          >
            <img
              src={isDark ? "/whitecomment.svg" : "/darkcomment.svg"}
              alt=""
              className="w-4 h-4 opacity-70"
            />
            <span>{commentCount}</span>
          </button>
          <button
            onClick={handleShare}
            className={`flex items-center justify-center w-11 h-9 rounded-full ${copied ? "bg-green-600" : isDark ? "bg-zinc-800" : "bg-gray-100"}`}
          >
            <img
              src="/share.svg"
              alt=""
              className={`w-4 h-4 ${isDark || copied ? "invert" : ""}`}
            />
          </button>
        </div>
        {hasVoted && (
          <div className="text-xs opacity-40 font-black uppercase tracking-tighter">
            {totalVotes} total votes
          </div>
        )}
      </div>

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetId={poll.id}
        targetType="Poll"
        userId={user?.id}
      />
    </div>
  );
}

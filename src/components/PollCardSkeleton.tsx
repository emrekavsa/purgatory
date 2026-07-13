"use client";

export default function PollCardSkeleton() {
  const shimmer = "bg-gray-200 dark:bg-zinc-800";

  return (
    <div className="p-5 border rounded-3xl animate-pulse bg-white border-gray-200 dark:bg-zinc-900 dark:border-zinc-800">
      {/* Header: avatar + username + time + category */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full ${shimmer}`} />
          <div className={`h-3.5 w-24 rounded-full ${shimmer}`} />
          <div className={`h-3 w-12 rounded-full ${shimmer} opacity-50`} />
        </div>
        <div className={`h-6 w-16 rounded-full ${shimmer}`} />
      </div>

      {/* Title */}
      <div className="mb-5 space-y-2">
        <div className={`h-5 w-4/5 rounded-full ${shimmer}`} />
        <div className={`h-5 w-3/5 rounded-full ${shimmer}`} />
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2">
        <div className={`h-14 w-full rounded-2xl ${shimmer}`} />
        <div className={`h-14 w-full rounded-2xl ${shimmer}`} />
      </div>

      {/* Footer: comment + share */}
      <div className="mt-5 flex items-center gap-2 border-t pt-4 border-gray-100 dark:border-zinc-800">
        <div className={`h-9 w-16 rounded-full ${shimmer}`} />
        <div className={`h-9 w-11 rounded-full ${shimmer}`} />
      </div>
    </div>
  );
}

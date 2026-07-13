"use client";
import PollCardSkeleton from "@/components/PollCardSkeleton";

export default function Loading() {
  const shimmer = "bg-gray-200 dark:bg-zinc-800";

  return (
    <div className="max-w-xl mx-auto p-4 pt-10 animate-pulse">
      <div className="flex flex-col items-center mb-10 text-center">
        <div
          className={`relative w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-gray-200 dark:border-zinc-800 ${shimmer}`}
        />

        <div className={`h-8 w-40 rounded-full mb-3 ${shimmer}`} />
        <div className={`h-4 w-20 rounded-full opacity-50 ${shimmer}`} />
      </div>

      <div className="flex flex-col gap-6">
        <PollCardSkeleton />
        <PollCardSkeleton />
        <PollCardSkeleton />
      </div>
    </div>
  );
}

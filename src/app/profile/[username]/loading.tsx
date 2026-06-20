"use client";
import PollCardSkeleton from "@/components/PollCardSkeleton";
import { useApp } from "@/context/AppContext";

export default function Loading() {
  const { isDark } = useApp();
  const shimmer = isDark ? "bg-zinc-800" : "bg-gray-200";

  return (
    <div className="max-w-xl mx-auto p-4 pt-10 animate-pulse">
      <div className="flex flex-col items-center mb-10 text-center">
        <div
          className={`relative w-24 h-24 rounded-full overflow-hidden mb-4 border-2 ${
            isDark ? "border-zinc-800" : "border-gray-200"
          } ${shimmer}`}
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

import PollCardSkeleton from "@/components/PollCardSkeleton";

export default function Loading() {
  return (
    <div className="max-w-xl mx-auto p-4 mt-6 animate-in fade-in duration-200">
      <div className="flex justify-between items-center mb-6">
        <div className="w-24 h-6 bg-zinc-800 rounded animate-pulse" />
      </div>
      <PollCardSkeleton />
      <div className="mt-8 space-y-4">
        <div className="w-32 h-6 bg-zinc-800 rounded animate-pulse" />
        <div className="w-full h-20 bg-zinc-800 rounded-2xl animate-pulse" />
        <div className="w-full h-20 bg-zinc-800 rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}

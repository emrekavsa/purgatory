import PollCardSkeleton from "@/components/PollCardSkeleton";

export default function Loading() {
  return (
    <div className="max-w-xl mx-auto p-4 space-y-6 mt-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-center py-4 mb-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <PollCardSkeleton />
      <PollCardSkeleton />
      <PollCardSkeleton />
    </div>
  );
}

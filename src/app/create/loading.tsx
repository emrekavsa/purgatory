"use client";
import { useApp } from "@/context/AppContext";

export default function CreateLoading() {
  const { isDark } = useApp();
  const shimmer = isDark ? "bg-zinc-800" : "bg-gray-200";
  const border = isDark ? "border-zinc-800" : "border-gray-100";
  const cardBg = isDark ? "bg-zinc-900" : "bg-white";
  const optionBg = isDark ? "bg-zinc-800/30" : "bg-gray-50";

  return (
    <div className="max-w-xl mx-auto p-4 mt-10 w-full animate-pulse">
      <div className={`p-6 border rounded-[32px] shadow-xl ${cardBg} ${border}`}>
        {/* Title input skeleton */}
        <div className={`w-full h-[56px] mb-4 rounded-2xl ${shimmer}`} />

        {/* Category skeleton */}
        <div className="mb-6 px-1">
          <div className={`w-16 h-3 rounded mb-2 ml-1 ${shimmer}`} />
          <div className={`w-full h-[52px] rounded-2xl ${shimmer}`} />
        </div>

        {/* Options skeleton */}
        <div className="flex flex-col gap-4 mb-6">
          <div className={`w-16 h-3 rounded px-1 ${shimmer}`} />
          
          {/* Option 1 */}
          <div className={`p-3 sm:p-4 border rounded-2xl ${optionBg} ${border}`}>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`flex-1 h-5 rounded ${shimmer}`} />
              <div className={`w-[60px] h-9 rounded-xl ${shimmer}`} />
            </div>
          </div>

          {/* Option 2 */}
          <div className={`p-3 sm:p-4 border rounded-2xl ${optionBg} ${border}`}>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`flex-1 h-5 rounded ${shimmer}`} />
              <div className={`w-[60px] h-9 rounded-xl ${shimmer}`} />
            </div>
          </div>
        </div>

        {/* Submit button skeleton */}
        <div className={`w-full h-[56px] rounded-2xl ${isDark ? "bg-blue-600/20" : "bg-blue-100"}`} />
      </div>
    </div>
  );
}

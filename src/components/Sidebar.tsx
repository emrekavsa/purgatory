"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";

export default function Sidebar() {
  const searchParams = useSearchParams();
  const [activeCat, setActiveCat] = useState<string | null>(searchParams.get("c"));
  const { isDark } = useApp();

  useEffect(() => {
    setActiveCat(searchParams.get("c"));
  }, [searchParams]);

  const handleCategoryClick = (e: React.MouseEvent, catName: string | null) => {
    e.preventDefault();
    setActiveCat(catName);
    const url = catName ? `/?c=${encodeURIComponent(catName)}` : "/";
    window.history.pushState(null, "", url);
    window.dispatchEvent(new CustomEvent("categoryChange", { detail: catName }));
  };

  const getLinkClass = (catName: string | null) => {
    const isActive = activeCat === catName || (!activeCat && !catName);
    return `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all cursor-pointer text-sm ${
      isActive
        ? `text-blue-600 ${isDark ? "bg-zinc-900" : "bg-blue-50"}`
        : `opacity-60 hover:opacity-100 ${isDark ? "text-gray-300 hover:bg-zinc-900" : "text-gray-600 hover:bg-gray-50"}`
    }`;
  };

  return (
    <aside
      className={`hidden lg:flex flex-col w-64 fixed left-0 top-14 h-[calc(100vh-56px)] border-r z-40 ${isDark ? "bg-black border-zinc-800" : "bg-white border-gray-200"}`}
    >
      <div className="w-full h-full overflow-y-auto p-4 space-y-1">
        <a
          href="/"
          onClick={(e) => handleCategoryClick(e, null)}
          className={getLinkClass(null)}
        >
          <img
            src="/home.svg"
            alt="home"
            className={`w-5 h-5 ${isDark ? "invert" : ""}`}
          />
          <span className="text-sm tracking-wider">Home</span>
        </a>
        <a href="/?c=Tech" onClick={(e) => handleCategoryClick(e, "Tech")} className={getLinkClass("Tech")}>
          <span className="flex items-center justify-center w-6 h-6">
            <img
              src="/tech.svg"
              alt="tech"
              className={`w-5 h-5 object-contain ${isDark ? "invert" : ""}`}
            />
          </span>
          <span>Tech</span>
        </a>
        <a href="/?c=Sports" onClick={(e) => handleCategoryClick(e, "Sports")} className={getLinkClass("Sports")}>
          <span className="flex items-center justify-center w-6 h-6">
            <img
              src="/sports.svg"
              alt="sports"
              className={`w-5 h-5 object-contain ${isDark ? "invert" : ""}`}
            />
          </span>
          <span>Sports</span>
        </a>
        <a href="/?c=Gaming" onClick={(e) => handleCategoryClick(e, "Gaming")} className={getLinkClass("Gaming")}>
          <span className="flex items-center justify-center w-6 h-6">
            <img
              src="/gaming.svg"
              alt="gaming"
              className={`w-5 h-5 object-contain ${isDark ? "invert" : ""}`}
            />
          </span>
          <span>Gaming</span>
        </a>
        <a
          href="/?c=Movies%20%26%20TV%20Shows"
          onClick={(e) => handleCategoryClick(e, "Movies & TV Shows")}
          className={getLinkClass("Movies & TV Shows")}
        >
          <span className="flex items-center justify-center w-6 h-6">
            <img
              src="/movie.svg"
              alt="movies & tv shows"
              className={`w-5 h-5 object-contain ${isDark ? "invert" : ""}`}
            />
          </span>
          <span>Movies & TV Shows</span>
        </a>
      </div>
    </aside>
  );
}

"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/context/AppContext";

export default function Navbar() {
  const { user, isDark, requireLogin } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
    router.push("/");
  };

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchTerm.trim() !== "") {
      router.push(`/search?q=${searchTerm.trim()}`);
    }
  };

  const username = user?.username || "User";

  return (
    <nav
      className={`flex items-center px-6 h-14 border-b sticky top-0 z-50 gap-4 ${
        isDark
          ? "bg-black border-zinc-800 text-white"
          : "bg-white border-gray-100 text-black"
      }`}
    >
      <div className="flex-1 flex items-center">
        <Link href="/" className="shrink-0">
          <span className="text-4xl lowercase tracking-wide select-none font-[family-name:var(--font-aktura)] pt-1">
            purgatory
          </span>
        </Link>
      </div>

      <div className="w-full max-w-md relative">
        <img
          src="/search.svg"
          className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 pointer-events-none ${isDark ? "invert" : ""}`}
        />
        <input
          type="text"
          placeholder="Search anything"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleSearch}
          className={`w-full h-9 pl-9 pr-4 rounded-full text-sm outline-none transition-all ${
            isDark
              ? "bg-zinc-800 text-white placeholder:text-zinc-500 focus:bg-zinc-700"
              : "bg-gray-100 text-black placeholder:text-gray-400 focus:bg-white focus:ring-1 focus:ring-gray-200"
          }`}
        />
      </div>

      <div className="flex-1 flex items-center justify-end gap-2">
        {!user ? (
          <button
            onClick={requireLogin}
            className="h-9 px-4 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-700 transition-all"
          >
            Log in
          </button>
        ) : (
          <>
            {user.is_admin && (
              <Link
                href="/admin"
                className="text-xs font-bold opacity-50 hover:opacity-100 transition-opacity px-2"
              >
                Admin
              </Link>
            )}
            <Link
              href="/create"
              className="h-9 px-4 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-700 transition-all flex items-center"
            >
              Create
            </Link>
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-8 h-8 rounded-full font-bold text-sm flex items-center justify-center overflow-hidden border transition-all ${
                  isDark
                    ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                    : "bg-gray-100 border-gray-200 hover:bg-gray-200"
                }`}
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  username[0].toUpperCase()
                )}
              </button>
              {isOpen && (
                <div
                  className={`absolute right-0 mt-2 w-44 border shadow-lg rounded-xl p-1.5 z-50 ${
                    isDark
                      ? "bg-zinc-900 border-zinc-800 text-white"
                      : "bg-white border-gray-200 text-black"
                  }`}
                >
                  <Link
                    href={`/profile/${username}`}
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-left px-3 py-2 hover:bg-gray-500/10 rounded-lg text-sm font-bold"
                  >
                    View profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-red-500 hover:bg-red-500/10 rounded-lg text-sm font-bold"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
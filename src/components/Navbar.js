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
      className={`flex justify-between items-center p-3 px-6 border-b sticky top-0 z-50 ${
        isDark
          ? "bg-black border-zinc-800 text-white"
          : "bg-white border-gray-100 text-black"
      }`}
    >
      <div className="w-[120px] md:w-[240px] flex items-center justify-start">
        <Link
          href="/"
          className="flex items-center group transition-opacity hover:opacity-80"
        >
          <span className="text-4xl lowercase tracking-wide select-none font-[family-name:var(--font-aktura)] pt-1">
            purgatory
          </span>
        </Link>
      </div>

      <div className="flex-1 max-w-xl mx-4 relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search anything"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleSearch}
          className={`w-full h-10 pl-11 pr-4 rounded-full text-sm outline-none transition-all border-transparent border
            ${
              isDark
                ? "bg-zinc-800 focus:bg-zinc-700 text-white focus:border-zinc-600"
                : "bg-gray-100 focus:bg-white text-black focus:border-gray-300 focus:ring-1 focus:ring-gray-200"
            }`}
        />
      </div>

      <div className="w-auto md:w-[240px] flex items-center justify-end gap-3">
        {!user ? (
          <button
            onClick={requireLogin}
            className="p-2 px-5 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-700 transition-all active:scale-95"
          >
            Log In
          </button>
        ) : (
          <>
            {user.is_admin === true && (
              <Link
                href="/admin"
                className={`p-2 px-4 rounded-full font-bold text-sm transition-all active:scale-95 ${
                  isDark 
                    ? "bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700" 
                    : "bg-gray-100 text-black hover:bg-gray-200 border border-gray-200"
                }`}
              >
                Admin
              </Link>
            )}

            <Link
              href="/create"
              className="p-2 px-4 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-700 hidden md:block transition-all active:scale-95"
            >
              + Create
            </Link>

            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-9 h-9 border rounded-full font-bold flex items-center justify-center transition-all overflow-hidden ${
                  isDark
                    ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                    : "bg-gray-100 border-gray-300 hover:bg-gray-200"
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
                  className={`absolute right-0 mt-2 w-48 border shadow-2xl rounded-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 ${
                    isDark
                      ? "bg-zinc-900 border-zinc-800 text-white"
                      : "bg-white border-gray-200 text-black"
                  }`}
                >
                  {user.is_admin === true && (
                    <Link
                      href="/admin"
                      onClick={() => setIsOpen(false)}
                      className="block w-full text-left p-2 hover:bg-gray-500/10 rounded-lg text-sm font-bold text-blue-500 md:hidden"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <Link
                    href={`/profile/${username}`}
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-left p-2 hover:bg-gray-500/10 rounded-lg text-sm font-bold"
                  >
                    View Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left p-2 text-red-500 hover:bg-red-500/10 rounded-lg text-sm font-bold"
                  >
                    Sign Out
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
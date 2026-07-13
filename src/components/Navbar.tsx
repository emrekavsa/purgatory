"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { KeyboardEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/context/AppContext";

export default function Navbar() {
  const supabase = createClient();
  const { user, isDark, requireLogin } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
    router.push("/");
  };

  const handleSearch = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchTerm.trim() !== "") {
      router.push(`/search?q=${searchTerm.trim()}`);
    }
  };

  const username = user?.username || "User";

  return (
    <nav
      className="flex items-center px-3 sm:px-6 h-14 border-b sticky top-0 z-50 gap-2 sm:gap-4 bg-white border-gray-100 text-black dark:bg-black dark:border-zinc-800 dark:text-white"
    >
      <div className="flex items-center shrink-0 sm:flex-1">
        <Link href="/" className="shrink-0">
          <img
            src="/poll-icon.svg"
            alt="Purgatory"
            className={`h-7 w-7 sm:hidden ${isDark ? "invert" : ""}`}
          />
          <span className="hidden sm:inline text-4xl lowercase tracking-wide select-none font-[family-name:var(--font-aktura)] pt-1">
            purgatory
          </span>
        </Link>
      </div>

      <div className="min-w-0 flex-1 sm:w-full sm:max-w-md relative">
        <img
          src="/search.svg"
          alt=""
          className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 pointer-events-none ${isDark ? "invert" : ""}`}
        />
        {!searchTerm && (
          <span className="pointer-events-none absolute left-9 top-1/2 -translate-y-1/2 text-sm font-bold opacity-40">
            <span className="sm:hidden">Search</span>
            <span className="hidden sm:inline">Search anything</span>
          </span>
        )}
        <input
          type="text"
          aria-label="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleSearch}
          className="w-full h-9 pl-9 pr-4 rounded-full text-sm outline-none transition-all bg-gray-100 text-black placeholder:text-gray-400 focus:bg-white focus:ring-1 focus:ring-gray-200 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500 dark:focus:bg-zinc-700 dark:focus:ring-0"
        />
      </div>

      <div className="shrink-0 sm:flex-1 flex items-center justify-end gap-1.5 sm:gap-2">
        {!user ? (
          <button
            onClick={requireLogin}
            className="h-9 px-3 sm:px-4 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-700 transition-all"
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
              className="h-9 px-3 sm:px-4 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-700 transition-all flex items-center"
            >
              Create
            </Link>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-8 h-8 rounded-full font-bold text-sm flex items-center justify-center overflow-hidden border transition-all relative ${
                  isDark
                    ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                    : "bg-gray-100 border-gray-200 hover:bg-gray-200"
                }`}
              >
                {user?.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={username}
                    fill
                    sizes="32px"
                    className="object-cover"
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
                    href={`/profile/${encodeURIComponent(username)}`}
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

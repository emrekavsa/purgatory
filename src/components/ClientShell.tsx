"use client";
import { Suspense } from "react";
import { useApp } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Login from "@/components/Login";
import type { ReactNode } from "react";

export default function ClientShell({ children }: { children: ReactNode }) {
  const { isDark, isLoginOpen, setIsLoginOpen } = useApp();

  return (
    <div
      className={`${isDark ? "bg-black text-white" : "bg-white text-black"} transition-colors min-h-screen`}
    >
      <div className="flex flex-col min-h-screen relative">
        <Navbar />
        <div className="flex flex-1 relative">
          <Suspense fallback={null}>
            <Sidebar />
          </Suspense>
          <main className="flex-1 w-full min-w-0">{children}</main>
        </div>
        <Login isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      </div>
    </div>
  );
}

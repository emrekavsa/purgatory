"use client";
import { Suspense, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import dynamic from "next/dynamic";

const Login = dynamic(() => import("@/components/Login"), { ssr: false });
import type { ReactNode } from "react";

export default function ClientShell({ children }: { children: ReactNode }) {
  const { user, isLoginOpen, setIsLoginOpen } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const isUsernameOnboarding = pathname === "/onboarding/username";
  const needsUsername = user?.username_set === false;

  useEffect(() => {
    if (!needsUsername || isUsernameOnboarding) return;

    const nextPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    router.replace(
      `/onboarding/username?next=${encodeURIComponent(nextPath)}`,
    );
  }, [isUsernameOnboarding, needsUsername, router]);

  if (needsUsername && !isUsernameOnboarding) {
    return (
      <div
        className="min-h-screen bg-white text-black dark:bg-black dark:text-white"
        aria-busy="true"
      />
    );
  }

  if (isUsernameOnboarding) {
    return (
      <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black transition-colors dark:bg-black dark:text-white">
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

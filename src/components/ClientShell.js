"use client"
import { useApp } from "@/context/AppContext"
import Navbar from "@/components/Navbar"
import Sidebar from "@/components/Sidebar"
import Login from "@/components/Login"
import BottomNav from "@/components/BottomNav"

export default function ClientShell({ children }) {
  const { isDark, isLoginOpen, setIsLoginOpen } = useApp()

  return (
    <div className={`${isDark ? 'bg-black text-white' : 'bg-white text-black'} transition-colors min-h-screen`}>
      <div className="flex flex-col min-h-screen relative">
        <Navbar onShowLogin={() => setIsLoginOpen(true)} />

        <div className="flex flex-1 relative">
          <Sidebar />
          <main className="flex-1 w-full min-w-0 pb-20 md:pb-0">
            {children}
          </main>
        </div>

        <BottomNav />

        <Login
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
        />
      </div>
    </div>
  )
}
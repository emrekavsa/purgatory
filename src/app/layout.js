"use client";
import { useState } from "react";
import { AppProvider } from '@/context/AppContext'
import "../styles/globals.css"
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import Login from '@/components/Login'
import { useApp } from '@/context/AppContext'

function RootLayoutContent({ children }) {
  const { isDark } = useApp();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Body etiketini burada tanımlıyoruz ki isDark sınıfını alabilsin
  return (
    <body className={`${isDark ? 'bg-black text-white' : 'bg-white text-black'} transition-colors`}>
      <div className="flex flex-col min-h-screen relative">
        <Navbar onShowLogin={() => setIsLoginOpen(true)} />

        <div className="flex flex-1 relative">
          <Sidebar />
          <main className="flex-1 w-full min-w-0">
            {children}
          </main>
        </div>

        <Login 
          isOpen={isLoginOpen} 
          onClose={() => setIsLoginOpen(false)} 
          isDark={isDark} 
        />
      </div>
    </body>
  );
}

export default function RootLayout({ children }) {
  return (
    <AppProvider>
      <html lang="en">
        {/* Head buraya gelebilir */}
        <RootLayoutContent>
          {children}
        </RootLayoutContent>
      </html>
    </AppProvider>
  )
}
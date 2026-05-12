"use client"
import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const AppContext = createContext()

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isDark, setIsDark] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isLoginOpen, setIsLoginOpen] = useState(false)

  const fetchProfile = async (sessionUser) => {
    if (!sessionUser) return null
    
    // BURAYI GÜNCELLEDİM: is_admin sütununu da artık çekiyoruz
    const { data } = await supabase
      .from('profiles')
      .select('username, avatar_url, is_admin') 
      .eq('id', sessionUser.id)
      .single()

    return { 
      ...sessionUser, 
      username: data?.username || 'User', 
      avatar_url: data?.avatar_url,
      is_admin: data?.is_admin || false // Buraya ekledik ki user objesinde adminlik gözüksün
    }
  }

  const requireLogin = () => {
    setIsLoginOpen(true)
  }

  useEffect(() => {
    const themeQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDark(themeQuery.matches)

    const handleTheme = (e) => setIsDark(e.matches)
    themeQuery.addEventListener('change', handleTheme)

    const getInitialSession = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          const fullUser = await fetchProfile(authUser)
          setUser(fullUser)
        }
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setLoading(false)
      } else if (event === 'SIGNED_IN' && session?.user) {
        const fullUser = await fetchProfile(session.user)
        setUser(fullUser)
        setLoading(false)
      }
    })

    return () => {
      themeQuery.removeEventListener('change', handleTheme)
      authSub.unsubscribe()
    }
  }, [])

  return (
    <AppContext.Provider value={{ user, isDark, loading, isLoginOpen, setIsLoginOpen, requireLogin }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
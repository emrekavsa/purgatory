"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { AppUser } from "@/types/domain";

type AppContextValue = {
  user: AppUser | null;
  isDark: boolean;
  loading: boolean;
  isLoginOpen: boolean;
  setIsLoginOpen: (isOpen: boolean) => void;
  requireLogin: () => void;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const fetchProfile = async (sessionUser: User): Promise<AppUser | null> => {
    if (!sessionUser) return null;

    const { data } = await supabase
      .from("profiles")
      .select("username, avatar_url, is_admin, isbanned")
      .eq("id", sessionUser.id)
      .single();

    if (data?.isbanned) {
      await supabase.auth.signOut();
      alert("Your account has been banned.");
      return null;
    }

    return {
      ...sessionUser,
      username: data?.username || "User",
      avatar_url: data?.avatar_url,
      is_admin: data?.is_admin || false,
      isbanned: data?.isbanned || false,
    };
  };

  const requireLogin = () => {
    setIsLoginOpen(true);
  };

  useEffect(() => {
    const themeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(themeQuery.matches);

    const handleTheme = (e: MediaQueryListEvent) => setIsDark(e.matches);
    themeQuery.addEventListener("change", handleTheme);

    const getInitialSession = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (authUser) {
          const fullUser = await fetchProfile(authUser);
          setUser(fullUser);
        }
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const {
      data: { subscription: authSub },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setLoading(false);
      } else if (event === "SIGNED_IN" && session?.user) {
        const fullUser = await fetchProfile(session.user);
        setUser(fullUser);
        setLoading(false);
      }
    });

    return () => {
      themeQuery.removeEventListener("change", handleTheme);
      authSub.unsubscribe();
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        isDark,
        loading,
        isLoginOpen,
        setIsLoginOpen,
        requireLogin,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

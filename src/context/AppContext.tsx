"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { AppUser } from "@/types/domain";

type AppContextValue = {
  user: AppUser | null;
  isDark: boolean;
  loading: boolean;
  isLoginOpen: boolean;
  setIsLoginOpen: (isOpen: boolean) => void;
  requireLogin: () => void;
  refreshUser: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

function createIncompleteUser(sessionUser: User): AppUser {
  return {
    ...sessionUser,
    username: "User",
    avatar_url: null,
    username_set: false,
    is_admin: false,
    isbanned: false,
  };
}

export function AppProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser: AppUser | null;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<AppUser | null>(initialUser);
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const fetchProfile = useCallback(
    async (sessionUser: User): Promise<AppUser | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar_url, username_set, is_admin, isbanned")
        .eq("id", sessionUser.id)
        .single();

      if (error || !data) {
        return createIncompleteUser(sessionUser);
      }

      if (data.isbanned) {
        await supabase.auth.signOut();
        alert("Your account has been banned.");
        return null;
      }

      return {
        ...sessionUser,
        username: data.username || "User",
        avatar_url: data.avatar_url,
        username_set: data.username_set ?? false,
        is_admin: data.is_admin || false,
        isbanned: data.isbanned || false,
      };
    },
    [supabase],
  );

  const refreshUser = useCallback(async () => {
    setLoading(true);

    try {
      const {
        data: { user: sessionUser },
      } = await supabase.auth.getUser();

      if (!sessionUser) {
        setUser(null);
        return;
      }

      setUser(await fetchProfile(sessionUser));
    } finally {
      setLoading(false);
    }
  }, [fetchProfile, supabase]);

  const requireLogin = () => {
    setIsLoginOpen(true);
  };

  useEffect(() => {
    let disposed = false;
    let authEventTimer: number | undefined;
    let authEventVersion = 0;
    const themeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleTheme = () => setIsDark(themeQuery.matches);
    handleTheme();
    themeQuery.addEventListener("change", handleTheme);

    const {
      data: { subscription: authSub },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const eventVersion = ++authEventVersion;

      if (authEventTimer !== undefined) {
        window.clearTimeout(authEventTimer);
        authEventTimer = undefined;
      }

      if (event === "SIGNED_OUT") {
        setUser(null);
        setLoading(false);
      } else if (event === "SIGNED_IN" && session?.user) {
        const sessionUser = session.user;
        setLoading(true);

        // Supabase currently warns against awaiting client calls directly in
        // onAuthStateChange because it can deadlock the client. Defer profile
        // loading until the auth callback has returned.
        authEventTimer = window.setTimeout(() => {
          authEventTimer = undefined;

          void fetchProfile(sessionUser)
            .then((fullUser) => {
              if (!disposed && eventVersion === authEventVersion) {
                setUser(fullUser);
              }
            })
            .catch(() => {
              if (!disposed && eventVersion === authEventVersion) {
                setUser(createIncompleteUser(sessionUser));
              }
            })
            .finally(() => {
              if (!disposed && eventVersion === authEventVersion) {
                setLoading(false);
              }
            });
        }, 0);
      }
    });

    return () => {
      disposed = true;
      authEventVersion += 1;
      if (authEventTimer !== undefined) {
        window.clearTimeout(authEventTimer);
      }
      themeQuery.removeEventListener("change", handleTheme);
      authSub.unsubscribe();
    };
  }, [fetchProfile, supabase]);

  return (
    <AppContext.Provider
      value={{
        user,
        isDark,
        loading,
        isLoginOpen,
        setIsLoginOpen,
        requireLogin,
        refreshUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);

  if (!context) {
    return {
      user: null,
      isDark: false,
      loading: false,
      isLoginOpen: false,
      setIsLoginOpen: () => {},
      requireLogin: () => {},
      refreshUser: async () => {},
    };
  }

  return context;
};

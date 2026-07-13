"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { OAUTH_NEXT_COOKIE, OAUTH_NEXT_COOKIE_MAX_AGE } from "@/lib/auth";
import { useApp } from "@/context/AppContext";
import {
  isValidUsername,
  normalizeUsername,
  USERNAME_REQUIREMENTS,
} from "@/lib/username";

type LoginMode = "login" | "register";
type LoadingAction = "password" | "google" | null;

type LoginProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function Login({ isOpen, onClose }: LoginProps) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { isDark } = useApp();
  const [mode, setMode] = useState<LoginMode>("login");
  const [form, setForm] = useState({ email: "", password: "", username: "" });
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
  const loading = loadingAction !== null;

  useEffect(() => {
    if (!isOpen) {
      setForm({ email: "", password: "", username: "" });
      setMode("login");
      setLoadingAction(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value =
      e.target.name === "username"
        ? e.target.value.toLowerCase()
        : e.target.value;

    setForm({ ...form, [e.target.name]: value });
  };

  const openRecovery = () => {
    onClose();
    router.push("/recovery");
  };

  const handleAuth = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    setLoadingAction("password");

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });

        if (error) throw error;
        onClose();
        return;
      }

      const username = normalizeUsername(form.username);
      if (!isValidUsername(username)) {
        throw new Error(USERNAME_REQUIREMENTS);
      }

      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { username },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;
      alert("Check your email to confirm your account before logging in.");
      setMode("login");
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGoogleAuth = async () => {
    if (loading) return;

    setLoadingAction("google");

    try {
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      const nextPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const cookieParts = [
        `${OAUTH_NEXT_COOKIE}=${encodeURIComponent(nextPath)}`,
        "Path=/auth/callback",
        `Max-Age=${OAUTH_NEXT_COOKIE_MAX_AGE}`,
        "SameSite=Lax",
      ];

      if (window.location.protocol === "https:") {
        cookieParts.push("Secure");
      }

      document.cookie = cookieParts.join("; ");

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl.toString(),
        },
      });

      if (error) throw error;
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not sign in with Google");
      setLoadingAction(null);
    }
  };

  const inputClass = `w-full px-4 py-2.5 border rounded-xl outline-none text-sm transition-all ${
    isDark
      ? "bg-zinc-800 border-zinc-700 text-white"
      : "bg-gray-50 border-gray-200 text-black"
  }`;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className={`p-6 w-full max-w-sm border rounded-2xl ${
          isDark
            ? "bg-zinc-900 border-zinc-800 text-white"
            : "bg-white border-gray-200 text-black"
        }`}
      >
        <div
          className={`flex gap-1 mb-5 p-1 rounded-xl ${isDark ? "bg-zinc-800" : "bg-gray-100"}`}
        >
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
              mode === "login"
                ? "bg-blue-600 text-white"
                : isDark
                  ? "text-zinc-400"
                  : "text-gray-400"
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
              mode === "register"
                ? "bg-blue-600 text-white"
                : isDark
                  ? "text-zinc-400"
                  : "text-gray-400"
            }`}
          >
            Register
          </button>
        </div>

        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className={`w-full h-11 px-4 border rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-50 ${
            isDark
              ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
              : "bg-white border-gray-200 hover:bg-gray-50"
          }`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="w-5 h-5 shrink-0"
          >
            <path
              fill="#4285F4"
              d="M21.6 12.23c0-.71-.06-1.4-.19-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z"
            />
            <path
              fill="#34A853"
              d="M12 22c2.7 0 4.98-.9 6.63-2.42l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"
            />
            <path
              fill="#FBBC05"
              d="M6.39 13.87A6 6 0 0 1 6.08 12c0-.65.11-1.29.31-1.87V7.51H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.49l3.35-2.62Z"
            />
            <path
              fill="#EA4335"
              d="M12 6c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.51l3.35 2.62C7.18 7.76 9.39 6 12 6Z"
            />
          </svg>
          {loadingAction === "google"
            ? "Redirecting to Google..."
            : "Continue with Google"}
        </button>

        <div className="my-4 flex items-center gap-3" aria-hidden="true">
          <div
            className={`h-px flex-1 ${isDark ? "bg-zinc-800" : "bg-gray-200"}`}
          />
          <span className="text-[11px] font-bold uppercase tracking-wider opacity-40">
            or
          </span>
          <div
            className={`h-px flex-1 ${isDark ? "bg-zinc-800" : "bg-gray-200"}`}
          />
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-2.5">
          {mode === "register" && (
            <input
              name="username"
              placeholder="Username"
              required
              minLength={3}
              maxLength={20}
              pattern="[a-z0-9_]{3,20}"
              title={USERNAME_REQUIREMENTS}
              autoCapitalize="none"
              autoCorrect="off"
              value={form.username}
              onChange={handleChange}
              className={inputClass}
            />
          )}
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            value={form.email}
            onChange={handleChange}
            className={inputClass}
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            value={form.password}
            onChange={handleChange}
            className={inputClass}
          />
          {mode === "login" && (
            <button
              type="button"
              onClick={openRecovery}
              className="self-start -mt-1 text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors"
            >
              Forgot your password?
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-1 bg-blue-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-all hover:bg-blue-700"
          >
            {loadingAction === "password"
              ? "Processing..."
              : mode === "login"
                ? "Continue"
                : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full text-center text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

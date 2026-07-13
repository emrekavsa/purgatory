"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  Suspense,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type RecoveryStep = "request" | "update";

function RecoveryContent() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const exchangedCodeRef = useRef<string | null>(null);
  const [step, setStep] = useState<RecoveryStep>("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Custom toast states instead of alert()
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // 1. Handle PKCE flow (if user clicks link in email, URL has ?code=...)
    const code = searchParams.get("code");
    if (code && exchangedCodeRef.current !== code) {
      exchangedCodeRef.current = code;
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (!error) {
          setStep("update");
          window.history.replaceState(null, "", "/recovery");
        } else {
          setErrorMsg("Invalid or expired recovery link.");
        }
      });
    }

    // 2. Handle the recovery event emitted by implicit links.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setStep("update");
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [searchParams, supabase]);

  const sendResetEmail = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setSuccessMsg("");
    setErrorMsg("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/recovery`,
      });

      if (error) throw error;
      setSuccessMsg("Check your email for the password recovery link.");
      setEmail(""); // clear input
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Could not send recovery email.");
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setSuccessMsg("");
    setErrorMsg("");

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setSuccessMsg("Password updated. You can now log in.");
      await supabase.auth.signOut();
      
      // Redirect after showing success for a moment
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 border rounded-xl outline-none text-sm transition-all bg-gray-50 border-gray-200 text-black dark:bg-zinc-800 dark:border-zinc-700 dark:text-white";

  return (
    <div
      className="min-h-[calc(100dvh-3.5rem)] flex items-start justify-center px-4 pt-16 md:pt-20 bg-white text-black dark:bg-black dark:text-white"
    >
      <div
        className="w-full max-w-sm p-6 border rounded-2xl bg-white border-gray-200 dark:bg-zinc-900 dark:border-zinc-800"
      >
        <h1 className="text-xl font-black mb-1">Account recovery</h1>
        <p className="text-xs opacity-50 mb-5">
          {step === "request"
            ? "Enter your email and we will send a password recovery link."
            : "Enter a new password for your account."}
        </p>

        {errorMsg && (
          <div className="mb-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold text-center">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-500 text-sm font-bold text-center">
            {successMsg}
          </div>
        )}

        {step === "request" ? (
          <form onSubmit={sendResetEmail} className="flex flex-col gap-2.5">
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-1 bg-blue-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-all hover:bg-blue-700"
            >
              {loading ? "Sending..." : "Send recovery email"}
            </button>
          </form>
        ) : (
          <form onSubmit={updatePassword} className="flex flex-col gap-2.5">
            <input
              type="password"
              placeholder="New password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            <input
              type="password"
              placeholder="Confirm password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-1 bg-blue-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-all hover:bg-blue-700"
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function RecoveryPage() {
  return (
    <Suspense fallback={null}>
      <RecoveryContent />
    </Suspense>
  );
}

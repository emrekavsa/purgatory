"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { createClient } from "@/lib/supabase/client";
import { isValidUsername, normalizeUsername } from "@/lib/username";

type UsernameFormProps = {
  nextPath: string;
};

type PendingAction = "save" | "signout" | null;

const USERNAME_HELP =
  "3-20 karakter; yalnızca küçük harf, rakam ve alt çizgi kullanabilirsin.";

export default function UsernameForm({ nextPath }: UsernameFormProps) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useApp();
  const [username, setUsername] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (authLoading || pendingAction === "save") return;

    if (!user) {
      router.replace("/");
      return;
    }

    if (user.username_set !== false) {
      router.replace(nextPath);
    }
  }, [authLoading, nextPath, pendingAction, router, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pendingAction) return;

    const normalizedUsername = normalizeUsername(username);
    setUsername(normalizedUsername);
    setErrorMessage("");

    if (!isValidUsername(normalizedUsername)) {
      setErrorMessage(USERNAME_HELP);
      return;
    }

    if (!user) {
      setErrorMessage("Oturumun sona erdi. Lütfen yeniden giriş yap.");
      return;
    }

    setPendingAction("save");

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ username: normalizedUsername, username_set: true })
        .eq("id", user.id)
        .eq("username_set", false)
        .select("id")
        .maybeSingle();

      if (error?.code === "23505") {
        setErrorMessage("Bu kullanıcı adı zaten alınmış.");
        return;
      }

      if (error || !data) {
        setErrorMessage("Kullanıcı adı kaydedilemedi. Lütfen tekrar dene.");
        return;
      }

      await refreshUser();
      router.replace(nextPath);
      router.refresh();
    } catch {
      setErrorMessage("Kullanıcı adı kaydedilemedi. Lütfen tekrar dene.");
    } finally {
      setPendingAction(null);
    }
  };

  const handleSignOut = async () => {
    if (pendingAction) return;

    setPendingAction("signout");
    setErrorMessage("");

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        setErrorMessage("Çıkış yapılamadı. Lütfen tekrar dene.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setErrorMessage("Çıkış yapılamadı. Lütfen tekrar dene.");
    } finally {
      setPendingAction(null);
    }
  };

  if (authLoading || !user || user.username_set !== false) {
    return (
      <main
        className="flex min-h-dvh items-center justify-center bg-white px-4 text-black dark:bg-black dark:text-white"
        aria-busy="true"
      >
        <span className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500" />
        <span className="sr-only">Yükleniyor</span>
      </main>
    );
  }

  const isBusy = pendingAction !== null;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-4 py-10 text-black dark:bg-black dark:text-white">
      <section className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl shadow-black/5 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/30">
        <div className="mb-6">
          <h1 className="text-2xl font-black tracking-tight">
            Kullanıcı adını seç
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Bu ad profilinde, anketlerinde ve yorumlarında herkese açık olarak
            görünecek.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-zinc-400">
                @
              </span>
              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value.toLowerCase());
                  if (errorMessage) setErrorMessage("");
                }}
                minLength={3}
                maxLength={20}
                pattern="[a-z0-9_]{3,20}"
                title={USERNAME_HELP}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                aria-label="Kullanıcı adı"
                disabled={isBusy}
                aria-describedby="username-help username-error"
                aria-invalid={Boolean(errorMessage)}
                className="h-11 w-full rounded-xl border border-zinc-300 bg-zinc-50 pl-8 pr-3 text-sm font-semibold outline-none transition placeholder:text-zinc-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                placeholder="kullanici_adi"
              />
            </div>
            <p
              id="username-help"
              className="mt-1.5 text-xs leading-5 text-zinc-500 dark:text-zinc-400"
            >
              {USERNAME_HELP}
            </p>
          </div>

          <div
            id="username-error"
            role="alert"
            aria-live="polite"
            className={`min-h-5 text-sm font-semibold text-red-600 dark:text-red-400 ${
              errorMessage ? "visible" : "invisible"
            }`}
          >
            {errorMessage || "Hata yok"}
          </div>

          <button
            type="submit"
            disabled={isBusy}
            className="flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-zinc-950"
          >
            {pendingAction === "save" ? "Kaydediliyor..." : "Devam et"}
          </button>
        </form>

        <div className="mt-5 border-t border-zinc-200 pt-4 text-center dark:border-zinc-800">
          <p className="mb-2 truncate text-xs text-zinc-500 dark:text-zinc-400">
            {user.email}
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isBusy}
            className="text-sm font-bold text-zinc-600 transition hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-300 dark:hover:text-red-400"
          >
            {pendingAction === "signout" ? "Çıkış yapılıyor..." : "Çıkış yap"}
          </button>
        </div>
      </section>
    </main>
  );
}

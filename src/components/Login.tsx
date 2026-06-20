"use client"

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react"
import { supabase } from "@/lib/supabase"
import { useApp } from "@/context/AppContext"
import { isValidUsername, normalizeUsername, USERNAME_REQUIREMENTS } from "@/lib/username"

type LoginMode = "login" | "register"

type LoginProps = {
  isOpen: boolean
  onClose: () => void
}

export default function Login({ isOpen, onClose }: LoginProps) {
  const { isDark } = useApp()
  const [mode, setMode] = useState<LoginMode>("login")
  const [form, setForm] = useState({ email: "", password: "", username: "" })
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setForm({ email: "", password: "", username: "" })
      setMode("login")
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.name === "username"
      ? e.target.value.toLowerCase()
      : e.target.value

    setForm({ ...form, [e.target.name]: value })
  }

  const handlePasswordReset = async () => {
    if (resetLoading) return
    if (!form.email.trim()) {
      alert("Enter your email first.")
      return
    }

    setResetLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error
      alert("Check your email for the password reset link.")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not send reset email.")
    } finally {
      setResetLoading(false)
    }
  }

  const handleAuth = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (loading) return

    setLoading(true)

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        })

        if (error) throw error
        onClose()
        return
      }

      const username = normalizeUsername(form.username)
      if (!isValidUsername(username)) {
        throw new Error(USERNAME_REQUIREMENTS)
      }

      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { username },
          emailRedirectTo: window.location.origin,
        },
      })

      if (error) throw error
      alert("Check your email to confirm your account before logging in.")
      setMode("login")
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const inputClass = `w-full px-4 py-2.5 border rounded-xl outline-none text-sm transition-all ${
    isDark ? "bg-zinc-800 border-zinc-700 text-white" : "bg-gray-50 border-gray-200 text-black"
  }`

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`p-6 w-full max-w-sm border rounded-2xl ${
        isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-gray-200 text-black"
      }`}>
        <div className={`flex gap-1 mb-5 p-1 rounded-xl ${isDark ? "bg-zinc-800" : "bg-gray-100"}`}>
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
              mode === "login" ? "bg-blue-600 text-white" : isDark ? "text-zinc-400" : "text-gray-400"
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
              mode === "register" ? "bg-blue-600 text-white" : isDark ? "text-zinc-400" : "text-gray-400"
            }`}
          >
            Register
          </button>
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
              onClick={handlePasswordReset}
              disabled={resetLoading}
              className="self-start -mt-1 text-xs font-bold text-blue-500 hover:text-blue-400 disabled:opacity-50 transition-colors"
            >
              {resetLoading ? "Sending reset link..." : "Forgot your password?"}
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-1 bg-blue-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-all hover:bg-blue-700"
          >
            {loading ? "Processing..." : mode === "login" ? "Continue" : "Create account"}
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
  )
}

"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useApp } from "@/context/AppContext"

type RecoveryStep = "request" | "update"

export default function RecoveryPage() {
  const router = useRouter()
  const { isDark } = useApp()
  const [step, setStep] = useState<RecoveryStep>("request")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setStep("update")
    })

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStep("update")
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const sendResetEmail = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/recovery`,
      })

      if (error) throw error
      alert("Check your email for the password recovery link.")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not send recovery email.")
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (loading) return

    if (password.length < 8) {
      alert("Password must be at least 8 characters.")
      return
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      alert("Password updated. You can now log in.")
      await supabase.auth.signOut()
      router.push("/")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not update password.")
    } finally {
      setLoading(false)
    }
  }

  const inputClass = `w-full px-4 py-2.5 border rounded-xl outline-none text-sm transition-all ${
    isDark ? "bg-zinc-800 border-zinc-700 text-white" : "bg-gray-50 border-gray-200 text-black"
  }`

  return (
    <div className={`min-h-[calc(100dvh-3.5rem)] flex items-center justify-center p-4 ${isDark ? "bg-black text-white" : "bg-white text-black"}`}>
      <div className={`w-full max-w-sm p-6 border rounded-2xl ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200"}`}>
        <h1 className="text-xl font-black mb-1">Account recovery</h1>
        <p className="text-xs opacity-50 mb-5">
          {step === "request"
            ? "Enter your email and we will send a password recovery link."
            : "Enter a new password for your account."}
        </p>

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
  )
}

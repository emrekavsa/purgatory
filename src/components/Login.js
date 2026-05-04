"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Login({ isOpen, onClose, isDark }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', username: '' })
  const [loading, setLoading] = useState(false)

  // Modal kapandığında formu sıfırla
  useEffect(() => {
    if (!isOpen) {
      setForm({ email: '', password: '', username: '' })
      setMode('login')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleAuth = async (e) => {
    if (e) e.preventDefault()
    if (loading) return
    
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        })
        if (error) throw error
        window.location.reload()
      } else {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { 
            data: { username: form.username } 
          }
        })
        if (error) throw error
        alert("Registration successful! Now you can log in.")
        setMode('login')
      }
    } catch (err) {
      alert(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`p-6 w-full max-w-sm border rounded-3xl shadow-2xl ${isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200 text-black'}`}>
        
        {/* MOD SEÇİCİ */}
        <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-zinc-800 rounded-2xl">
          <button 
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${mode === 'login' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500'}`}
          >
            Log In
          </button>
          <button 
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${mode === 'register' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500'}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-3">
          {mode === 'register' && (
            <input 
              name="username" 
              placeholder="Username" 
              required 
              value={form.username}
              onChange={handleChange} 
              className={`p-4 border rounded-2xl outline-none text-sm ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-50 border-gray-300'}`} 
            />
          )}
          <input 
            name="email" 
            type="email" 
            placeholder="Email" 
            required 
            value={form.email}
            onChange={handleChange} 
            className={`p-4 border rounded-2xl outline-none text-sm ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-50 border-gray-300'}`} 
          />
          <input 
            name="password" 
            type="password" 
            placeholder="Password" 
            required 
            value={form.password}
            onChange={handleChange} 
            className={`p-4 border rounded-2xl outline-none text-sm ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-50 border-gray-300'}`} 
          />
          
          <button 
            type="submit" 
            disabled={loading} 
            className="p-4 mt-2 bg-blue-600 text-white rounded-2xl font-bold disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20"
          >
            {loading ? 'Processing...' : (mode === 'login' ? 'Continue' : 'Create Account')}
          </button>
        </form>

        <button 
          type="button"
          onClick={onClose} 
          className="mt-6 w-full text-center text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest"
        >
          Dismiss
        </button>
        
      </div>
    </div>
  )
}
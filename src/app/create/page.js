"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/context/AppContext'
import Login from '@/components/Login'

export default function CreatePoll() {
  const { user, isDark, loading: authLoading } = useApp()
  const router = useRouter()
  
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [options, setOptions] = useState([
    { content: '', image: null, preview: null },
    { content: '', image: null, preview: null }
  ])

  useEffect(() => {
    if (!authLoading && !user) {
      setIsLoginOpen(true)
    }
  }, [user, authLoading])

  const handleFileChange = (index, e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large (Max 5MB)")
      return
    }

    const newOptions = [...options]
    newOptions[index].image = file
    newOptions[index].preview = URL.createObjectURL(file)
    setOptions(newOptions)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return setIsLoginOpen(true)

    const imagesCount = options.filter(opt => opt.image !== null).length
    if (imagesCount > 0 && imagesCount < options.length) {
      alert("Please provide images for all options or none at all.")
      return
    }

    setLoading(true)
    try {
      const { data: poll, error: pollErr } = await supabase
        .from('polls')
        .insert([{ title, user_id: user.id }])
        .select()
        .single()

      if (pollErr) throw pollErr

      for (let i = 0; i < options.length; i++) {
        let imageUrl = null
        if (options[i].image) {
          const fileName = `${poll.id}/${Date.now()}-${i}`
          const { error: uploadErr } = await supabase.storage
            .from('poll-images')
            .upload(fileName, options[i].image)
          
          if (uploadErr) throw uploadErr
          const { data } = supabase.storage.from('poll-images').getPublicUrl(fileName)
          imageUrl = data.publicUrl
        }

        await supabase.from('poll_options').insert([{ 
          poll_id: poll.id, 
          content: options[i].content, 
          image_url: imageUrl 
        }])
      }
      router.push('/')
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="max-w-xl mx-auto p-4 mt-10">
        <form onSubmit={handleSubmit} className={`p-6 border rounded-2xl ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}>
          <h1 className="text-2xl font-bold mb-6 text-center italic opacity-80">New Poll</h1>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Question</label>
            <input 
              required 
              placeholder="What do you want to ask?" 
              className={`w-full p-4 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-50 border-gray-300'}`} 
              onChange={e => setTitle(e.target.value)} 
            />
          </div>

          <div className="flex flex-col gap-4 mb-6">
            <label className="block text-sm font-medium">Options</label>
            {options.map((opt, i) => (
              <div key={i} className={`flex flex-col gap-3 p-4 border rounded-xl ${isDark ? 'border-zinc-800 bg-zinc-900' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <input 
                    required 
                    placeholder={`Option ${i+1}`} 
                    className="flex-1 bg-transparent outline-none p-1 font-medium" 
                    onChange={e => {
                      const newOptions = [...options]
                      newOptions[i].content = e.target.value
                      setOptions(newOptions)
                    }} 
                  />
                  <label className="px-3 py-2 bg-blue-600 text-white rounded-lg cursor-pointer text-xs font-bold uppercase hover:bg-blue-700 transition-colors">
                    Upload
                    <input type="file" className="hidden" accept="image/*" onChange={e => handleFileChange(i, e)} />
                  </label>
                </div>
                {opt.preview && (
                  <div className="relative w-full h-32 mt-2 rounded-lg overflow-hidden border border-gray-400">
                    <img src={opt.preview} className="w-full h-full object-cover" alt="Preview" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full p-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg"
          >
            {loading ? 'Posting...' : 'Share Poll'}
          </button>
        </form>
      </div>

      <Login 
        isOpen={isLoginOpen} 
        onClose={() => {
          setIsLoginOpen(false)
          if (!user) router.push('/')
        }} 
        isDark={isDark} 
      />
    </div>
  )
}
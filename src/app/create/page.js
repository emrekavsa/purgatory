"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useApp } from "@/context/AppContext"
import { createPollAction } from "@/lib/actions"

const CATEGORIES = ["General", "Tech", "Sports", "Gaming", "Movies & TV Shows"]

export default function CreatePoll() {
  const { user, isDark, loading: authLoading, requireLogin } = useApp()
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("General")
  const [loading, setLoading] = useState(false)

  const [options, setOptions] = useState([
    { content: "", image: null, preview: null },
    { content: "", image: null, preview: null },
  ])

  useEffect(() => {
    if (!authLoading && !user) requireLogin()
  }, [user, authLoading])

  const handleFileChange = (index, e) => {
    const file = e.target.files[0]
    if (file) {
      const newOptions = [...options]
      newOptions[index].image = file
      newOptions[index].preview = URL.createObjectURL(file)
      setOptions(newOptions)
    }
  }

  const addOption = () =>
    options.length < 4 &&
    setOptions([...options, { content: "", image: null, preview: null }])

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return requireLogin()

    const imagesCount = options.filter((opt) => opt.image !== null).length
    if (imagesCount > 0 && imagesCount < options.length) {
      alert("Please either add images to all options or none of them.")
      return
    }

    setLoading(true)
    try {
      // 1. Resimleri Supabase Storage'a Yükle (Promise.all ile paralel ve hızlı)
      const optionsData = await Promise.all(options.map(async (opt, i) => {
        let imageUrl = null
        if (opt.image) {
          const folderName = `${user.id}-${Date.now()}`
          const fileName = `${folderName}/${i}.jpg`
          const { error: uploadErr } = await supabase.storage
            .from("poll-images")
            .upload(fileName, opt.image)
          
          if (uploadErr) throw uploadErr

          const { data } = supabase.storage
            .from("poll-images")
            .getPublicUrl(fileName)
          imageUrl = data.publicUrl
        }

        return { content: opt.content, image_url: imageUrl }
      }))

      // 2. Veritabanına Yazma İşlemini Sunucuya (Server Action) Devret
      const result = await createPollAction(
        { title, category, user_id: user.id }, 
        optionsData
      )

      if (!result.success) throw new Error(result.error)

      router.push("/")
    } catch (err) {
      alert(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4 mt-10">
      <form
        onSubmit={handleSubmit}
        className={`p-6 border rounded-[32px] shadow-xl ${isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-gray-100 text-black"}`}
      >
        <input
          required
          placeholder="The Question?"
          className={`w-full p-4 mb-4 rounded-2xl border outline-none font-bold ${isDark ? "bg-zinc-800 border-zinc-700 text-white" : "bg-gray-50 border-gray-200 text-black"}`}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="mb-6 px-1">
          <label className="text-[10px] font-black uppercase opacity-40 mb-2 block tracking-widest ml-1">📂 Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`w-full p-3.5 rounded-2xl border outline-none font-bold cursor-pointer transition-all appearance-none ${
              isDark 
                ? "bg-zinc-800 border-zinc-700 text-white hover:border-zinc-500" 
                : "bg-gray-50 border-gray-200 text-black hover:border-gray-300"
            }`}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className={isDark ? "bg-zinc-900" : "bg-white"}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-4 mb-6">
          <label className="text-[10px] font-black uppercase opacity-40 px-1 tracking-widest">Options</label>
          {options.map((opt, i) => (
            <div
              key={i}
              className={`p-4 border rounded-2xl flex flex-col gap-3 ${isDark ? "border-zinc-800 bg-zinc-800/30" : "border-gray-200 bg-gray-50"}`}
            >
              <div className="flex items-center gap-3">
                <input
                  required
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 bg-transparent outline-none font-bold"
                  value={opt.content}
                  onChange={(e) => {
                    const n = [...options]
                    n[i].content = e.target.value
                    setOptions(n)
                  }}
                />

                <div className="flex items-center gap-2">
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      ✕
                    </button>
                  )}
                  <label className="px-4 py-2 bg-blue-600 text-white rounded-xl cursor-pointer text-[10px] font-black uppercase hover:bg-blue-700 transition-colors shadow-sm">
                    Image
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleFileChange(i, e)}
                    />
                  </label>
                </div>
              </div>

              {opt.preview && (
                <div className="relative w-full h-32 rounded-xl overflow-hidden bg-black">
                  <img src={opt.preview} className="w-full h-full object-contain" alt="" />
                </div>
              )}
            </div>
          ))}

          {options.length < 4 && (
            <button
              type="button"
              onClick={addOption}
              className="py-3 border-2 border-dashed border-zinc-500/20 rounded-xl text-xs font-bold opacity-50 hover:opacity-100 transition-opacity"
            >
              + Add Option
            </button>
          )}
        </div>

        <button
          disabled={loading}
          className="w-full p-4 bg-blue-600 text-white rounded-2xl font-black uppercase shadow-lg disabled:opacity-50 hover:bg-blue-700 transition-all transform active:scale-[0.98]"
        >
          {loading ? "Posting..." : "Share Poll"}
        </button>
      </form>
    </div>
  )
}
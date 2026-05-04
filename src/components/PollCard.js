"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatRelativeTime } from '@/lib/utils'

export default function PollCard({ poll, user, onVote, isDark }) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  if (!poll || !poll.poll_options) return null

  const authorName = poll.profiles?.username || 'Anonymous'
  const commentCount = poll.comments?.length || 0
  const options = poll.poll_options
  const hasImages = options.some(opt => opt.image_url)
  
  const totalVotes = options.reduce((acc, opt) => acc + (opt.votes?.length || 0), 0)
  const userVote = user 
    ? options.find(opt => opt.votes?.some(v => v.user_id === user.id))
    : null
  const hasVoted = !!userVote

  const handleShare = (e) => {
    e.stopPropagation()
    const url = `${window.location.origin}/poll/${poll.id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 700)
  }

  // 3 seçenek varsa md ekranlarda 3 sütun, aksi halde 2 sütun (veya metinli için flex-col)
  const gridClass = hasImages 
    ? `grid grid-cols-1 ${options.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"} gap-4`
    : "flex flex-col gap-3";

  return (
    <div className={`p-5 border rounded-3xl transition-all ${
      isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-black'
    }`}>
      
      {/* Kullanıcı Bilgisi */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        <div onClick={() => router.push(`/profile/${authorName}`)} className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
            {authorName[0].toUpperCase()}
          </div>
          <span className="font-semibold hover:underline">@{authorName}</span>
        </div>
        <span className="opacity-30 text-[12px]">• {formatRelativeTime(poll.created_at)}</span>
      </div>

      <h3 className="text-xl font-bold mb-5 leading-tight">{poll.title}</h3>

      {/* Seçenekler Alanı */}
      <div className={gridClass}>
        {options.map((opt) => {
          const voteCount = opt.votes?.length || 0
          const percent = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0
          const isMyChoice = opt.id === userVote?.id

          return (
            <button 
              key={opt.id} 
              onClick={(e) => {
                e.preventDefault();
                onVote(poll.id, opt.id);
              }}
              disabled={hasVoted}
              className={`group relative flex flex-col border rounded-2xl transition-all overflow-hidden w-full
                ${isDark ? 'border-zinc-800' : 'border-gray-100'}
                ${!hasVoted ? (isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-50') : 'cursor-default'}
                ${isMyChoice ? 'ring-2 ring-blue-500' : ''}
              `}
            >
              {/* Fotoğraflı Seçenek Görünümü */}
              {hasImages && (
                <div className="relative w-full aspect-[4/3] bg-zinc-100 dark:bg-black overflow-hidden border-b border-inherit pointer-events-none">
                  {opt.image_url ? (
                    <>
                      <img 
                        src={opt.image_url} 
                        className="absolute inset-0 w-full h-full object-cover blur-xl opacity-30 scale-125" 
                        alt="" 
                      />
                      <img 
                        src={opt.image_url} 
                        className="relative z-10 w-full h-full object-contain p-1" 
                        alt={opt.content} 
                      />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-20 text-xs italic">No Image</div>
                  )}
                </div>
              )}

              {/* Metin ve Oy Barı Alanı */}
              <div className="relative p-4 w-full flex items-center justify-between min-h-[56px] pointer-events-none">
                {hasVoted && (
                  <div 
                    className={`absolute left-0 top-0 bottom-0 transition-all duration-1000 ease-out z-0
                      ${isMyChoice ? 'bg-blue-500/10' : (isDark ? 'bg-zinc-800' : 'bg-gray-100')}
                    `}
                    style={{ width: `${percent}%` }}
                  />
                )}

                <div className="relative z-10 flex items-center gap-2">
                  <span className="font-medium text-[13px] md:text-sm">{opt.content}</span>
                  {isMyChoice && <span className="text-blue-500 font-bold">✓</span>}
                </div>
                
                {hasVoted && (
                  <div className="relative z-10 flex flex-col items-end">
                    <span className="font-bold text-sm">{percent}%</span>
                    <span className="text-[9px] opacity-40">{voteCount} votes</span>
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
      
      {/* Footer */}
      <div className={`mt-5 flex items-center justify-between border-t pt-4 ${isDark ? 'border-zinc-800' : 'border-gray-100'}`}>
        <div className="flex gap-2">
          <button onClick={() => router.push(`/poll/${poll.id}`)} className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-100 text-gray-600'}`}>
            <img src={isDark ? "/whitecomment.svg" : "/darkcomment.svg"} alt="" className="w-4 h-4 opacity-70" />
            <span>{commentCount}</span>
          </button>
          <button onClick={handleShare} className={`flex items-center justify-center w-11 h-9 rounded-full ${copied ? 'bg-green-600' : (isDark ? 'bg-zinc-800' : 'bg-gray-100')}`}>
            <img src="/share.svg" alt="" className={`w-4 h-4 ${isDark || copied ? 'invert' : ''}`} />
          </button>
        </div>
        {hasVoted && <div className="text-[10px] opacity-40 font-black uppercase tracking-tighter">{totalVotes} total votes</div>}
      </div>
    </div>
  )
}
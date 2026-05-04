"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatRelativeTime } from '@/lib/utils'

export default function PollCard({ poll, user, onVote, isDark }) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  if (!poll || !poll.poll_options) return null

  const authorName = poll.profiles?.username || 'Anonymous'
  const hasImages = poll.poll_options.some(opt => opt.image_url)
  const commentCount = poll.comments?.length || 0
  
  let totalVotes = 0
  poll.poll_options.forEach(opt => {
    totalVotes += (opt.votes?.length || 0)
  })

  const userVote = user 
    ? poll.poll_options.find(opt => opt.votes?.some(v => v.user_id === user.id))
    : null

  const hasVoted = !!userVote

  const handleShare = (e) => {
    e.stopPropagation()
    const url = `${window.location.origin}/poll/${poll.id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 700)
  }

  // Fotoğraflıysa 3'lü anketlerde md:grid-cols-3 yapar, metinliyse alt alta liste kalır.
  const containerClass = hasImages 
    ? `grid grid-cols-1 ${poll.poll_options.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"} gap-4`
    : "flex flex-col gap-2"

  return (
    <div className={`p-5 border rounded-3xl transition-all ${
      isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200 text-black'
    }`}>
      
      {/* User Info */}
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

      {/* Options */}
      <div className={containerClass}>
        {poll.poll_options.map((opt) => {
          const voteCount = opt.votes?.length || 0
          const percent = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0
          const isMyChoice = opt.id === userVote?.id

          return (
            <button 
              key={opt.id} 
              onClick={() => onVote(poll.id, opt.id)}
              disabled={hasVoted}
              className={`group relative flex overflow-hidden border rounded-2xl min-h-[56px] transition-all
                ${hasImages ? 'flex-col' : 'flex-row items-center p-4'} 
                ${isDark ? 'border-zinc-800' : 'border-gray-100'}
                ${!hasVoted ? (isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-50') : 'cursor-default'}
                ${isMyChoice ? 'ring-2 ring-blue-500' : ''}
              `}
            >
              {hasVoted && (
                <div 
                  className={`absolute left-0 top-0 bottom-0 transition-all duration-1000 ease-out z-0
                    ${isMyChoice ? 'bg-blue-500/10' : (isDark ? 'bg-zinc-800' : 'bg-gray-100')}
                  `}
                  style={{ width: `${percent}%` }}
                />
              )}

              {hasImages && (
                <div className={`relative w-full aspect-[4/3] overflow-hidden border-b border-inherit z-10 ${isDark ? 'bg-black' : 'bg-zinc-100'}`}>
                  {opt.image_url ? (
                    <img 
                      src={opt.image_url} 
                      className="w-full h-full object-contain p-1" 
                      alt={opt.content} 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-20 text-xs italic">no image</div>
                  )}
                </div>
              )}
              
              <div className={`relative z-10 flex w-full items-center justify-between ${hasImages ? 'p-4' : 'flex-1 text-left'}`}>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm md:text-base">{opt.content}</span>
                  {isMyChoice && <span className="text-blue-500 font-bold">✓</span>}
                </div>
                
                {hasVoted && (
                  <div className="flex flex-col items-end">
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
          <button 
            onClick={() => router.push(`/poll/${poll.id}`)}
            className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-100 text-gray-600'}`}
          >
            <img src={isDark ? "/whitecomment.svg" : "/darkcomment.svg"} alt="" className="w-4 h-4 opacity-70" />
            <span>{commentCount}</span>
          </button>
          <button 
            onClick={handleShare}
            className={`flex items-center justify-center w-11 h-9 rounded-full ${copied ? 'bg-green-600' : (isDark ? 'bg-zinc-800' : 'bg-gray-100')}`}
          >
            <img src="/share.svg" alt="" className={`w-4 h-4 ${isDark || copied ? 'invert' : ''}`} />
          </button>
        </div>
        {hasVoted && <div className="text-[10px] opacity-40 font-black uppercase tracking-tighter">{totalVotes} total votes</div>}
      </div>
    </div>
  )
}
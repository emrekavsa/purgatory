"use client"
import { useState } from 'react'
import { formatRelativeTime } from '@/lib/utils'
import { useApp } from '@/context/AppContext'

export default function Comment({ comment, allComments, depth = 0, user, onDelete, onUpdate, onReply }) {
  const { isDark } = useApp()
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState(`@${comment.profiles?.username} `)

  const replies = allComments.filter(r => r.parent_id === comment.id)
  const isEdited = comment.updated_at && (new Date(comment.updated_at) - new Date(comment.created_at) > 1000)

  const handleSave = () => {
    if (!editContent.trim()) return
    onUpdate(comment.id, editContent.trim())
    setIsEditing(false)
  }

  const handleReply = () => {
    onReply(comment.id, replyContent.trim())
    setIsReplying(false)
    setReplyContent(`@${comment.profiles?.username} `)
  }

  return (
    <div className={`relative ${depth > 0 ? 'ml-6 md:ml-10' : ''}`}>
      {replies.length > 0 && depth < 6 && (
        <div className={`absolute left-[15px] top-[48px] bottom-0 w-[2px] ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`} />
      )}

      <div className="group/comment flex gap-3 py-3">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-white font-bold text-[10px] overflow-hidden">
          {comment.profiles?.avatar_url ? (
            <img src={comment.profiles.avatar_url} alt={comment.profiles?.username} className="w-full h-full object-cover" />
          ) : (
            comment.profiles?.username?.[0]?.toUpperCase()
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <div className="text-xs space-x-1">
              <span className="font-bold">@{comment.profiles?.username}</span>
              <span className="opacity-40">• {formatRelativeTime(comment.created_at)}</span>
              {isEdited && <span className="opacity-30 italic">(edited)</span>}
            </div>

            <div className="flex gap-2 opacity-0 group-hover/comment:opacity-100 transition-opacity items-center">
              {user && user.id !== comment.user_id && (
                <button
                  onClick={() => onReply(comment.id, null, true)}
                  className="p-1 opacity-40 hover:opacity-100 hover:bg-red-500/10 rounded-full transition-all"
                >
                  <img src="/report.svg" alt="Report" className={`w-3.5 h-3.5 ${isDark ? 'invert' : ''}`} />
                </button>
              )}
              {user?.id === comment.user_id && !isEditing && (
                <>
                  <button onClick={() => setIsEditing(true)} className="w-3.5 h-3.5 opacity-40 hover:opacity-100 dark:invert">
                    <img src="/edit-icon.svg" alt="Edit" />
                  </button>
                  <button onClick={() => onDelete(comment.id)} className="w-3.5 h-3.5 opacity-40 hover:opacity-100">
                    <img src="/delete-icon.svg" alt="Delete" />
                  </button>
                </>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="mt-1 flex flex-col gap-2">
              <textarea
                className={`w-full p-3 text-sm rounded-xl border outline-none resize-none ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-100 text-black'}`}
                rows="2"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-2 text-[10px] font-bold">
                <button onClick={() => setIsEditing(false)} className="opacity-50">Cancel</button>
                <button onClick={handleSave} className="bg-blue-600 text-white px-3 py-1 rounded-full">Save</button>
              </div>
            </div>
          ) : (
            <p className="text-sm opacity-90 leading-relaxed">{comment.content}</p>
          )}

          <button
            onClick={() => setIsReplying(!isReplying)}
            className="text-[10px] font-bold opacity-40 mt-2 hover:opacity-100"
          >
            REPLY
          </button>

          {isReplying && (
            <div className="mt-3 flex gap-2 items-stretch">
              <textarea
                className={`flex-1 p-3 text-sm rounded-xl border outline-none resize-none ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-100 text-black'}`}
                rows="2"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                autoFocus
              />
              <button
                onClick={handleReply}
                className="px-5 min-h-[48px] h-auto bg-blue-600 text-white text-xs font-bold rounded-xl transition-all"
              >
                Post
              </button>
            </div>
          )}
        </div>
      </div>

      {replies.map(reply => (
        <Comment
          key={reply.id}
          comment={reply}
          allComments={allComments}
          depth={depth + 1}
          user={user}
          onDelete={onDelete}
          onUpdate={onUpdate}
          onReply={onReply}
        />
      ))}
    </div>
  )
}
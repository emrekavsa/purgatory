"use client"
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/context/AppContext'
import PollCard from '@/components/PollCard'
import { formatRelativeTime } from '@/lib/utils'
import { createCommentAction, deleteCommentAction, updateCommentAction, voteAction } from '@/lib/actions'

const POLL_SELECT = '*, profiles(username, id, avatar_url), poll_options(id, content, image_url, votes(user_id)), comments(id)'

export default function PollDetailPage() {
  const { id } = useParams()
  const { user, isDark, requireLogin } = useApp()

  const [poll, setPoll] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyContent, setReplyContent] = useState('')

  const commentInputRef = useRef(null)

  const fetchData = async () => {
    try {
      const { data: p } = await supabase
        .from('polls')
        .select(POLL_SELECT)
        .eq('id', id)
        .single()
      const { data: c } = await supabase
        .from('comments')
        .select('*, profiles(username, id, avatar_url)')
        .eq('poll_id', id)
        .order('created_at', { ascending: true })

      if (p) setPoll(p)
      setComments(c || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchData()
  }, [id])

  const onVote = async (pollId, optionId) => {
    if (!user) return requireLogin()
    
    const result = await voteAction({ poll_id: pollId, option_id: optionId, user_id: user.id })

    if (result.success) {
      fetchData()
    } else {
      if (result.error.includes('duplicate key') || result.error.includes('unique constraint')) {
        alert('You have already voted!')
      } else {
        alert(result.error)
      }
    }
  }

  const handleCommentSubmit = async (e, parentId = null) => {
    if (e) e.preventDefault()
    const content = parentId ? replyContent : newComment
    if (!user || !content.trim() || submitting) return

    setSubmitting(true)
    
    const result = await createCommentAction({
      poll_id: id,
      user_id: user.id,
      content: content.trim(),
      parent_id: parentId
    })

    if (result.success) {
      setNewComment('')
      setReplyContent('')
      setReplyingTo(null)
      fetchData()
    } else {
      alert(result.error)
    }
    setSubmitting(false)
  }

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return
    
    const result = await deleteCommentAction({ comment_id: commentId, user_id: user.id })
    if (result.success) fetchData()
    else alert(result.error)
  }

  const handleUpdateComment = async (commentId) => {
    const updatedText = editContent.trim()
    if (!updatedText) return
    
    const result = await updateCommentAction({
      comment_id: commentId,
      user_id: user.id,
      content: updatedText
    })

    if (result.success) {
      setEditingId(null)
      fetchData()
    } else {
      alert(result.error)
    }
  }

  const renderComment = (comment, allComments, depth = 0) => {
    const replies = allComments.filter(r => r.parent_id === comment.id)
    const isEdited = comment.updated_at && (new Date(comment.updated_at) - new Date(comment.created_at) > 1000)

    return (
      <div key={comment.id} className={`relative ${depth > 0 ? 'ml-6 md:ml-10' : ''}`}>
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

              {user?.id === comment.user_id && editingId !== comment.id && (
                <div className="flex gap-2 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingId(comment.id); setEditContent(comment.content) }} className="w-3.5 h-3.5 opacity-40 hover:opacity-100 dark:invert">
                    <img src="/edit-icon.svg" alt="Edit" />
                  </button>
                  <button onClick={() => handleDeleteComment(comment.id)} className="w-3.5 h-3.5 opacity-40 hover:opacity-100">
                    <img src="/delete-icon.svg" alt="Delete" />
                  </button>
                </div>
              )}
            </div>

            {editingId === comment.id ? (
              <div className="mt-1 flex flex-col gap-2">
                <textarea
                  className={`w-full p-3 text-sm rounded-xl border outline-none resize-none ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-100 text-black'}`}
                  rows="2"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  autoFocus
                />
                <div className="flex justify-end gap-2 text-[10px] font-bold">
                  <button onClick={() => setEditingId(null)} className="opacity-50">Cancel</button>
                  <button onClick={() => handleUpdateComment(comment.id)} className="bg-blue-600 text-white px-3 py-1 rounded-full">Save</button>
                </div>
              </div>
            ) : (
              <p className="text-sm opacity-90 leading-relaxed">{comment.content}</p>
            )}

            <button
              onClick={() => {
                setReplyingTo(replyingTo === comment.id ? null : comment.id)
                setReplyContent(`@${comment.profiles?.username} `)
              }}
              className="text-[10px] font-bold opacity-40 mt-2 hover:opacity-100"
            >
              REPLY
            </button>

            {replyingTo === comment.id && (
              <div className="mt-3 flex gap-2 items-stretch">
                <textarea
                  className={`flex-1 p-3 text-sm rounded-xl border outline-none resize-none ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-100 text-black'}`}
                  rows="2"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  autoFocus
                />
                <button
                  onClick={(e) => handleCommentSubmit(e, comment.id)}
                  className="px-5 min-h-[48px] h-auto bg-blue-600 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Post
                </button>
              </div>
            )}
          </div>
        </div>
        {replies.map(r => renderComment(r, allComments, depth + 1))}
      </div>
    )
  }

  if (loading) return (
    <div className={`p-10 text-center font-bold ${isDark ? 'text-white' : 'text-black'}`}>
      Loading...
    </div>
  )

  return (
    <div className="w-full">
      <div className="max-w-xl mx-auto p-4 mt-6">
        <PollCard
          poll={poll}
          user={user}
          onVote={onVote}
          onCommentClick={() => commentInputRef.current?.focus()}
        />

        <div className={`mt-8 p-6 rounded-3xl border shadow-sm ${isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-black'}`}>
          <div className="mb-8 font-bold text-lg tracking-tight">Discussion ({comments.length})</div>

          <form onSubmit={handleCommentSubmit} className="mb-10 flex gap-3 items-stretch">
            <textarea
              ref={commentInputRef}
              placeholder="Share your thoughts..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className={`flex-1 p-4 rounded-2xl border outline-none resize-none ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-200 text-black'}`}
              rows="2"
            />
            <button
              disabled={submitting}
              type="submit"
              className="px-6 min-h-[56px] h-auto bg-blue-600 text-white font-bold rounded-2xl disabled:opacity-50 transition-all"
            >
              {submitting ? '...' : 'Post'}
            </button>
          </form>

          <div className="space-y-4">
            {comments.filter(c => !c.parent_id).map(main => (
              <div key={main.id} className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-800/30 border-zinc-800' : 'bg-gray-50/50 border-gray-100'}`}>
                {renderComment(main, comments)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
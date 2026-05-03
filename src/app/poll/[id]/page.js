"use client"
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/context/AppContext'
import PollCard from '@/components/PollCard'

function formatTime(dateString) {
  if (!dateString) return ''
  const diff = Math.floor((new Date() - new Date(dateString)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function PollDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, isDark } = useApp()
  
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
    const { data: p } = await supabase.from('polls').select('*, profiles(username, id), poll_options(*, votes(*)), comments(id)').eq('id', id).single()
    const { data: c } = await supabase.from('comments').select('*, profiles(username, id)').eq('poll_id', id).order('created_at', { ascending: true })
    
    setPoll(p)
    setComments(c || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [id])

  const handleCommentSubmit = async (e, parentId = null) => {
    if (e) e.preventDefault()
    const content = parentId ? replyContent : newComment
    if (!user || !content.trim() || submitting) return
    
    setSubmitting(true)
    const { error } = await supabase.from('comments').insert([{ poll_id: id, user_id: user.id, content: content.trim(), parent_id: parentId }])
    
    if (!error) {
      setNewComment(''); setReplyContent(''); setReplyingTo(null)
      fetchData()
      router.refresh()
    }
    setSubmitting(false)
  }

  const handleDeleteComment = async (commentId) => {
    if (!confirm("Delete?")) return
    setComments(prev => prev.filter(c => c.id !== commentId))
    const { error } = await supabase.from('comments').delete().eq('id', commentId).eq('user_id', user.id)
    if (error) fetchData()
    else router.refresh()
  }


  const handleUpdateComment = async (commentId) => {
    const updatedText = editContent.trim()
    if (!updatedText) return
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: updatedText } : c))
    setEditingId(null)
    const { error } = await supabase.from('comments').update({ content: updatedText, updated_at: new Date().toISOString() }).eq('id', commentId)
    if (error) fetchData()
    else router.refresh()
  }

  const renderComment = (comment, allComments, depth = 0) => {
    const replies = allComments.filter(r => r.parent_id === comment.id)
    const isEdited = comment.updated_at && (new Date(comment.updated_at) - new Date(comment.created_at) > 1000)

    return (
      <div key={comment.id} className={`relative ${depth > 0 ? 'ml-6 md:ml-10' : ''}`}>
        {replies.length > 0 && depth < 6 && (
          <div className={`absolute left-[15px] top-[40px] bottom-0 w-[2px] ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`} />
        )}
        
        <div className="group/comment flex gap-3 py-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-white font-bold text-[10px]">
            {comment.profiles?.username?.[0]?.toUpperCase()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <div className="text-xs space-x-1">
                <span className="font-bold">@{comment.profiles?.username}</span>
                <span className="opacity-40">• {formatTime(comment.created_at)}</span>
                {isEdited && <span className="opacity-30 italic">(edited)</span>}
              </div>
              
              {user?.id === comment.user_id && editingId !== comment.id && (
                <div className="flex gap-2 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }} className="w-3.5 h-3.5 invert opacity-40 hover:opacity-100"><img src="/edit-icon.svg" alt="E" /></button>
                  <button onClick={() => handleDeleteComment(comment.id)} className="w-3.5 h-3.5 opacity-40 hover:opacity-100"><img src="/delete-icon.svg" alt="D" /></button>
                </div>
              )}
            </div>
            
            {editingId === comment.id ? (
              <div className="mt-1 flex flex-col gap-2">
                <textarea className={`w-full p-3 text-sm rounded-xl border outline-none resize-none ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-100'}`} rows="2" value={editContent} onChange={(e) => setEditContent(e.target.value)} autoFocus />
                <div className="flex justify-end gap-2 text-[10px] font-bold">
                  <button onClick={() => setEditingId(null)} className="opacity-50">Cancel</button>
                  <button onClick={() => handleUpdateComment(comment.id)} className="bg-blue-600 text-white px-3 py-1 rounded-full">Save</button>
                </div>
              </div>
            ) : <p className="text-sm opacity-90 leading-relaxed">{comment.content}</p>}
            
            <button onClick={() => { setReplyingTo(replyingTo === comment.id ? null : comment.id); setReplyContent(`@${comment.profiles?.username} `); }} className="text-[10px] font-bold opacity-40 mt-2 hover:opacity-100">REPLY</button>
            
            {replyingTo === comment.id && (
              <div className="mt-3 flex gap-2">
                <textarea className={`flex-1 p-3 text-sm rounded-xl border outline-none resize-none ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`} rows="2" value={replyContent} onChange={(e) => setReplyContent(e.target.value)} autoFocus />
                <button onClick={(e) => handleCommentSubmit(e, comment.id)} className="px-4 bg-blue-600 text-white text-xs font-bold rounded-full">Post</button>
              </div>
            )}
          </div>
        </div>
        {replies.map(r => renderComment(r, allComments, depth + 1))}
      </div>
    )
  }

  if (loading) return <div className="p-10 text-center font-bold">Loading...</div>

  return (
    <div className="w-full">
      <div className="max-w-xl mx-auto p-4 mt-6">
        <PollCard poll={poll} user={user} onVote={fetchData} isDark={isDark} onCommentClick={() => commentInputRef.current?.focus()} />
        
        <div className={`mt-8 p-6 rounded-3xl border shadow-sm ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-100'}`}>
          <div className="mb-8 font-bold text-lg tracking-tight">Discussion ({comments.length})</div>
          
          <form onSubmit={handleCommentSubmit} className="mb-10 flex gap-3 items-start">
            <textarea ref={commentInputRef} placeholder="Share your thoughts..." value={newComment} onChange={(e) => setNewComment(e.target.value)} className={`flex-1 p-4 rounded-2xl border outline-none resize-none ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-200 text-black'}`} rows="2" />
            <button disabled={submitting} type="submit" className="px-6 h-[56px] bg-blue-600 text-white font-bold rounded-2xl disabled:opacity-50 transition-all">{submitting ? "..." : "Post"}</button>
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
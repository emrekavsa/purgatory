"use client"
import { useState } from 'react'
import { reportAction } from '@/lib/actions' // DİKKAT: reportPollAction yerine reportAction kullanıyoruz

export default function ReportModal({ isOpen, onClose, targetId, targetType, userId }) {
  const [reason, setReason] = useState('Spam')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const reasons = ["Spam", "Inappropriate", "Harassment", "Hate Speech", "Other"]

  const handleSubmit = async () => {
    if (!userId) {
      alert("You must be logged in to report.");
      return;
    }

    setLoading(true)
    
    // Anket mi Yorum mu? Ona göre doğru ID alanını dolduruyoruz
    const payload = {
      reported_by: userId,
      reason: reason,
      ...(targetType === "Comment" ? { comment_id: targetId } : { poll_id: targetId })
    }

    // Ortak Action'ı çağır
    const res = await reportAction(payload)
    
    if (res.success) {
      alert("Reported successfully")
      onClose()
    } else {
      alert(res.error || "Something went wrong")
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm p-6 rounded-3xl bg-zinc-900 border border-zinc-800 text-white shadow-2xl">
        <h4 className="text-xl font-bold mb-4 tracking-tight">Report {targetType}</h4>
        
        <div className="space-y-3 mb-6">
          {reasons.map(r => (
            <label 
              key={r} 
              className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                reason === r ? 'bg-blue-600/10 border-blue-600/50 border' : 'bg-zinc-800/50 border border-transparent'
              }`}
            >
              <input 
                type="radio" 
                name="reason" 
                checked={reason === r} 
                onChange={() => setReason(r)} 
                className="w-4 h-4 accent-blue-600" 
              />
              <span className={`text-sm font-medium ${reason === r ? 'text-blue-400' : 'opacity-60'}`}>
                {r}
              </span>
            </label>
          ))}
        </div>

        <div className="flex gap-2">
          <button 
            onClick={onClose} 
            className="flex-1 py-3 text-sm font-bold opacity-50 hover:opacity-100 transition-opacity"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={loading} 
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-2xl font-bold transition-all disabled:opacity-50 active:scale-95"
          >
            {loading ? 'Sending...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  )
}
"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/context/AppContext'
import { banUserAction, resolveReportAction } from '@/lib/actions'
import PollCard from '@/components/PollCard'

export default function AdminPage() {
  const { user, isDark } = useApp()
  const [activeTab, setActiveTab] = useState('polls') 
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchReports = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('reports')
      .select(`
        id,
        status,
        reason,
        created_at,
        poll_id,
        comment_id,
        polls (*, profiles(*), poll_options(*, votes(*)), comments(*)),
        comments (*, profiles(username, avatar_url)),
        profiles!reported_by ( username )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Sorgu Hatası:", error.message)
    } else {
      const filtered = data.filter(item => {
        if (activeTab === 'polls') return item.poll_id !== null && item.polls !== null
        if (activeTab === 'comments') return item.comment_id !== null && item.comments !== null
        return true
      })
      setReports(filtered)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (user?.is_admin) fetchReports()
  }, [user, activeTab])

  const handleAction = async (reportId) => {
    // GÜVENLİK FİX: İşlemi yapanın (user.id) kimliği de gönderiliyor.
    const res = await resolveReportAction(user.id, reportId)
    if (res.success) fetchReports()
    else alert(res.error) // Hata varsa admin görsün
  }

  if (!user?.is_admin) return <div className="p-20 text-center">UNAUTHORIZED</div>

  return (
    <div className={`max-w-4xl mx-auto p-4 md:p-6 min-h-screen ${isDark ? 'text-white' : 'text-black'}`}>

      <div className="flex justify-center mb-8">
        <div className={`flex p-1 rounded-2xl w-full max-w-[320px] ${isDark ? 'bg-zinc-800/50' : 'bg-gray-100'}`}>
          <button 
            onClick={() => setActiveTab('polls')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'polls' ? 'bg-blue-600 text-white shadow-md' : 'opacity-50 hover:opacity-100'}`}
          >
            Polls
          </button>
          <button 
            onClick={() => setActiveTab('comments')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'comments' ? 'bg-blue-600 text-white shadow-md' : 'opacity-50 hover:opacity-100'}`}
          >
            Comments
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {loading ? (
          <p className="text-center">loading..</p>
        ) : (
          reports.map((report) => (
            <div key={report.id} className={`p-5 rounded-3xl border shadow-sm transition-all ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-gray-50 border-gray-200'}`}>
              
              {/* HEADER (Reported By + Reason + Butonlar Yan Yana) */}
              <div className="flex items-start md:items-center justify-between mb-4 flex-col md:flex-row gap-4">
                
                {/* SOL TARAF: Kim raporladı & Neden raporladı */}
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-[0.1em] text-blue-500 mb-0.5">Reported By</span>
                    <span className="text-sm font-bold">@{report.profiles?.username}</span>
                  </div>

                  {/* Dikey Ayraç Çizgisi */}
                  <div className={`w-px h-6 opacity-30 ${isDark ? 'bg-white' : 'bg-black'}`}></div>

                  {/* Sebep */}
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase tracking-[0.1em] opacity-40 mb-0.5">Reason</span>
                    <div className="flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]"></div>
                       <span className="font-bold text-[11px] text-red-500 uppercase tracking-widest">
                          {report.reason || "General Violation"}
                       </span>
                    </div>
                  </div>
                </div>

                {/* SAĞ TARAF: Aksiyon Butonları */}
                <div className="flex gap-2">
                  <button onClick={() => handleAction(report.id)} className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all ${isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-white border hover:bg-gray-100'}`}>
                    Dismiss
                  </button>
                  <button 
                    onClick={async () => {
                       if(confirm("Ban this user?")) {
                          const targetUserId = activeTab === 'polls' ? report.polls?.user_id : report.comments?.user_id;
                          if (targetUserId) {
                             // GÜVENLİK FİX: Admin'in kimliği (user.id) de server'a gönderiliyor.
                             const res = await banUserAction(user.id, targetUserId);
                             if(res.success) {
                               handleAction(report.id);
                             } else {
                               alert(res.error); // Hata varsa göster
                             }
                          }
                       }
                    }}
                    className="px-4 py-1.5 bg-red-600 text-white rounded-full text-[11px] font-bold hover:bg-red-700 transition-all shadow-sm shadow-red-600/20"
                  >
                    Ban Author
                  </button>
                </div>
              </div>

              {/* CONTENT PREVIEW (Artık en alt eleman bu, temiz bir çizgiyle ayrıldı) */}
              <div className="pointer-events-none opacity-90 scale-[0.95] origin-top border-t border-dashed pt-4 border-zinc-500/20">
                {activeTab === 'polls' && report.polls && (
                  <div className="-mx-4 md:mx-0">
                    <PollCard poll={report.polls} user={user} onVote={() => {}} />
                  </div>
                )}
                {activeTab === 'comments' && report.comments && (
                  <div className={`p-4 rounded-2xl ${isDark ? 'bg-zinc-800/40' : 'bg-gray-100'}`}>
                    <p className="font-bold text-xs mb-1 text-blue-500">@{report.comments.profiles?.username}</p>
                    <p className="text-sm font-medium italic opacity-90">"{report.comments.content}"</p>
                  </div>
                )}
              </div>

            </div>
          ))
        )}

        {reports.length === 0 && !loading && (
          <div className="py-20 text-center opacity-20">
             <p className="text-xs font-bold uppercase tracking-widest">No Reports</p>
          </div>
        )}
      </div>
    </div>
  )
}
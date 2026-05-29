"use client"
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useApp } from '@/context/AppContext'

export default function Sidebar() {
  const searchParams = useSearchParams()
  const activeCat = searchParams.get('c')
  const { isDark } = useApp()

  const getLinkClass = (catName) => {
    const isActive = activeCat === catName
    return `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm ${
      isActive
        ? `text-blue-600 ${isDark ? 'bg-zinc-900' : 'bg-blue-50'}`
        : `opacity-60 hover:opacity-100 ${isDark ? 'text-gray-300 hover:bg-zinc-900' : 'text-gray-600 hover:bg-gray-50'}`
    }`
  }

  return (
    <aside className={`hidden lg:flex flex-col w-64 fixed left-0 top-14 h-[calc(100vh-56px)] border-r z-40 ${isDark ? 'bg-black border-zinc-800' : 'bg-white border-gray-200'}`}>
      <div className="w-full h-full overflow-y-auto p-4 space-y-1">
        <Link href="/" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
          !activeCat
            ? `text-blue-600 ${isDark ? 'bg-zinc-900' : 'bg-blue-50'}`
            : `opacity-70 hover:opacity-100 ${isDark ? 'hover:bg-zinc-900' : 'hover:bg-gray-50'}`
        }`}>
          <img src="/home.svg" alt="home" className={`w-5 h-5 ${isDark ? 'invert' : ''}`} />
          <span className="text-sm tracking-wider">Home</span>
        </Link>
        <Link href="/?c=Tech" className={getLinkClass('Tech')}>
          <span className="flex items-center justify-center w-6 h-6">
            <img src="/tech.svg" alt="tech" className={`w-5 h-5 object-contain ${isDark ? 'invert' : ''}`} />
          </span>
          <span>Tech</span>
        </Link>
        <Link href="/?c=Sports" className={getLinkClass('Sports')}>
          <span className="flex items-center justify-center w-6 h-6">
            <img src="/sports.svg" alt="sports" className={`w-5 h-5 object-contain ${isDark ? 'invert' : ''}`} />
          </span>
          <span>Sports</span>
        </Link>
        <Link href="/?c=Gaming" className={getLinkClass('Gaming')}>
          <span className="flex items-center justify-center w-6 h-6">
            <img src="/gaming.svg" alt="gaming" className={`w-5 h-5 object-contain ${isDark ? 'invert' : ''}`} />
          </span>
          <span>Gaming</span>
        </Link>
         <Link href="/?c=Movies & TV Shows" className={getLinkClass('Movies & TV Shows')}>
          <span className="flex items-center justify-center w-6 h-6">
            <img src="/movie.svg" alt="movies & tv shows" className={`w-5 h-5 object-contain ${isDark ? 'invert' : ''}`} />
          </span>
          <span>Movies & TV Shows</span>
        </Link>
      </div>
    </aside>
  )
}
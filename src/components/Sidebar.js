"use client"
import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function SidebarContent() {
  const searchParams = useSearchParams()
  const activeCat = searchParams.get('c')

  const getLinkClass = (catName) => {
    const isActive = activeCat === catName
    return `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm ${
      isActive
        ? 'text-blue-600 dark:text-blue-500 bg-blue-50 dark:bg-zinc-900'
        : 'hover:bg-gray-50 dark:hover:bg-zinc-900 opacity-60 hover:opacity-100 text-gray-600 dark:text-gray-300'
    }`
  }

  return (
    <aside className="hidden md:flex flex-col w-64 fixed left-0 top-[64px] h-[calc(100vh-64px)] border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-black z-40">
      <div className="w-full h-full overflow-y-auto p-4 space-y-1">
        <Link href="/" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all mb-2 ${!activeCat ? 'text-blue-600 dark:text-blue-500 bg-blue-50 dark:bg-zinc-900' : 'hover:bg-gray-50 dark:hover:bg-zinc-900 opacity-70 hover:opacity-100'}`}>
          <img src="/home.svg" alt="home" className="w-5 h-5 dark:invert" />
          <span className="text-sm tracking-wider">Home</span>
        </Link>
        <Link href="/?c=Tech" className={getLinkClass('Tech')}>
          <span className="text-lg flex items-center justify-center w-6 h-6">
            <img src="/tech.svg" alt="tech" className="w-5 h-5 dark:invert object-contain" />
          </span>
          <span>Tech</span>
        </Link>
        <Link href="/?c=Sports" className={getLinkClass('Sports')}>
          <span className="text-lg flex items-center justify-center w-6 h-6">
            <img src="/sports.svg" alt="sports" className="w-5 h-5 dark:invert object-contain" />
          </span>
          <span>Sports</span>
        </Link>
        <Link href="/?c=Gaming" className={getLinkClass('Gaming')}>
          <span className="text-lg flex items-center justify-center w-6 h-6">
            <img src="/gaming.svg" alt="gaming" className="w-5 h-5 dark:invert object-contain" />
          </span>
          <span>Gaming</span>
        </Link>
        <Link href="/?c=Movies & TV Shows" className={getLinkClass('Movies & TV Shows')}>
          <span className="text-lg flex items-center justify-center w-6 h-6">
            <img src="/movie.svg" alt="movies & tv shows" className="w-5 h-5 dark:invert object-contain" />
          </span>
          <span>Movies & TV Shows</span>
        </Link>
      </div>
    </aside>
  )
}

export default function Sidebar() {
  return (
    <Suspense>
      <SidebarContent />
    </Suspense>
  )
}
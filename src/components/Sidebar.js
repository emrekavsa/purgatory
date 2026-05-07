"use client"
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const CATEGORIES = [
  { name: 'Tech', icon: '💻' },
  { name: 'Sports', icon: '⚽' },
  { name: 'Gaming', icon: '🎮' },
  { name: 'Politics', icon: '⚖️' },
  { name: 'Entertainment', icon: '🎬' },
]

export default function Sidebar() {
  const searchParams = useSearchParams()
  const activeCat = searchParams.get('c')

  return (
    <aside className="hidden md:flex flex-col w-64 fixed left-0 top-[64px] h-[calc(100vh-64px)] border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-black z-40">
      <div className="w-full h-full overflow-y-auto p-4 space-y-1">
        
        <Link
          href="/"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all mb-4 ${
            !activeCat 
              ? 'text-blue-600 dark:text-blue-500 bg-blue-50 dark:bg-zinc-900' 
              : 'hover:bg-gray-50 dark:hover:bg-zinc-900 opacity-70 hover:opacity-100'
          }`}
        >
          <img 
            src="/home.svg" 
            alt="Home" 
            className="w-5 h-5 dark:invert" 
          />
          <span className="text-sm uppercase tracking-wider">Feed</span>
        </Link>

        <div className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
          Categories
        </div>

        {CATEGORIES.map((cat) => {
          const isActive = activeCat === cat.name
          return (
            <Link
              key={cat.name}
              href={`/?c=${cat.name}`}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm ${
                isActive
                  ? 'text-blue-600 dark:text-blue-500 bg-blue-50 dark:bg-zinc-900'
                  : 'hover:bg-gray-50 dark:hover:bg-zinc-900 opacity-60 hover:opacity-100 text-gray-600 dark:text-gray-300'
              }`}
            >
              <span className="text-lg">{cat.icon}</span>
              <span>{cat.name}</span>
            </Link>
          )
        })}

      </div>
    </aside>
  )
}
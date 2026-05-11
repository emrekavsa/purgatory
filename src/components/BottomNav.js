"use client"
import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'

function BottomNavContent() {
  const searchParams = useSearchParams()
  const activeCat = searchParams.get('c')
  const { user, requireLogin } = useApp()
  const router = useRouter()

  const categories = [
    { label: 'Home', href: '/', icon: '/home.svg', cat: null },
    { label: 'Tech', href: '/?c=Tech', icon: '/tech.svg', cat: 'Tech' },
    { label: 'Sports', href: '/?c=Sports', icon: '/sports.svg', cat: 'Sports' },
    { label: 'Gaming', href: '/?c=Gaming', icon: '/gaming.svg', cat: 'Gaming' },
    { label: 'Movies', href: '/?c=Movies & TV Shows', icon: '/movie.svg', cat: 'Movies & TV Shows' },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-black border-t border-gray-200 dark:border-zinc-800">
      <div className="flex items-center justify-around px-2 py-2">
        {categories.map((item) => {
          const isActive = item.cat === null ? !activeCat : activeCat === item.cat
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-400 dark:text-zinc-500'
              }`}
            >
              <img
                src={item.icon}
                alt={item.label}
                className={`w-5 h-5 ${isActive ? '' : 'opacity-40'} dark:invert`}
              />
              <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
            </Link>
          )
        })}

        <button
          onClick={() => user ? router.push('/create') : requireLogin()}
          className="flex flex-col items-center gap-1 px-3 py-1"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-black text-lg leading-none">+</span>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600">Create</span>
        </button>
      </div>
    </nav>
  )
}

export default function BottomNav() {
  return (
    <Suspense>
      <BottomNavContent />
    </Suspense>
  )
}
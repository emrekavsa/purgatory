import Link from 'next/link'

export default function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-64 fixed left-0 top-[64px] h-[calc(100vh-64px)] border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-black z-40">
      <div className="w-full h-full overflow-y-auto p-4 space-y-2">
        
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-blue-600 dark:text-blue-500 bg-blue-50 dark:bg-zinc-900 hover:bg-blue-100 dark:hover:bg-zinc-800"
        >
          <img 
            src="/home.svg" 
            alt="Home" 
            className="w-6 h-6 dark:invert opacity-80" 
          />
          <span className="text-sm">Home</span>
        </Link>

      </div>
    </aside>
  )
}
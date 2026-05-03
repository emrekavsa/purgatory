import { AppProvider } from '@/context/AppContext'
import "../styles/globals.css"
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: "poll App",
  description: "poll app",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <div className="flex flex-col min-h-screen relative">
            <Navbar />

            <div className="flex flex-1 relative">
              <Sidebar />
              
              <main className="flex-1 w-full min-w-0 bg-gray-50 dark:bg-black">
                {children}
              </main>
            </div>

          </div>
        </AppProvider>
      </body>
    </html>
  )
}
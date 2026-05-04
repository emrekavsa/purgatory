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
      {/* 
        text-black dark:text-white -> Yazıları otomatik renklendirir.
        bg-white dark:bg-black -> Sayfanın en alt katman rengini belirler.
      */}
      <body className="text-black dark:text-white bg-white dark:bg-black transition-colors">
        <AppProvider>
          <div className="flex flex-col min-h-screen relative">
            <Navbar />

            <div className="flex flex-1 relative">
              <Sidebar />
              
              {/* main içindeki renkleri body'ye taşıdığımız için burayı sadeleştirdik */}
              <main className="flex-1 w-full min-w-0">
                {children}
              </main>
            </div>

          </div>
        </AppProvider>
      </body>
    </html>
  )
}
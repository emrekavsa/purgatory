import { AppProvider } from '@/context/AppContext'
import "../styles/globals.css"
import ClientShell from '@/components/ClientShell'
import localFont from 'next/font/local'

const aktura = localFont({
  src: '../../public/fonts/Aktura-Regular.woff2',
  variable: '--font-aktura',
})

export const metadata = {
  title: 'Purgatory',
  description: 'Join the discussion and cast your vote.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={aktura.variable}>
      <body>
        <AppProvider>
          <ClientShell>
            {children}
          </ClientShell>
        </AppProvider>
      </body>
    </html>
  )
}
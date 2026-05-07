import { AppProvider } from '@/context/AppContext'
import "../styles/globals.css"
import ClientShell from '@/components/ClientShell'

export const metadata = {
  title: 'Polls',
  description: 'Join the discussion and cast your vote.',
}

export default function RootLayout({ children }) {
  return (
    <AppProvider>
      <html lang="en">
        <body>
          <ClientShell>
            {children}
          </ClientShell>
        </body>
      </html>
    </AppProvider>
  )
}
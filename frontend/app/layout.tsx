import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import Providers from '@/components/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fight Data Arena — SF6 Frame Data',
  description: 'Quiz et base de données de frame data Street Fighter 6. Startup, active, recovery pour tous les personnages.',
  keywords: 'Street Fighter 6, frame data, quiz, startup, SF6, fighting game',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="sf6-bg" />
        <div className="sf6-grid" />
        <Providers>
          <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh' }}>
            {children}
          </div>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import Providers from '@/components/Providers'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://fightdata.app'),
  title: 'Fight Data Arena — SF6 Frame Data',
  description: 'Street Fighter 6 frame data quiz. Guess startup, damage, and on-block values for every character.',
  keywords: 'Street Fighter 6, frame data, quiz, startup, SF6, fighting game',
  manifest: '/manifest.json',
  openGraph: {
    title: 'Fight Data Arena — SF6 Frame Data Quiz',
    description: 'Street Fighter 6 frame data quiz. Guess startup, damage, and on-block values.',
    type: 'website',
    siteName: 'Fight Data Arena',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fight Data Arena — SF6 Frame Data Quiz',
    description: 'Street Fighter 6 frame data quiz. Guess startup, damage, and on-block values.',
  },
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

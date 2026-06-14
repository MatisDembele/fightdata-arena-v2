import type { Metadata } from 'next'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/react'
import Providers from '@/components/Providers'
import FrameGuide from '@/components/FrameGuide'
import PageBackground from '@/components/PageBackground'
import './globals.css'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

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
      <head>
        {process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost') && (
          <>
            <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL} />
          </>
        )}
      </head>
      <body>
        <div className="sf6-bg" />
        <PageBackground />
        <div className="sf6-grid" />
        <Providers>
          <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh' }}>
            {children}
          </div>
          <FrameGuide />
        </Providers>
        <Analytics />
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { page_path: window.location.pathname });
            `}</Script>
          </>
        )}
      </body>
    </html>
  )
}

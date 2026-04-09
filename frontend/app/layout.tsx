import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fight Data Arena',
  description: 'Frame data Street Fighter 6 — Quiz & Database',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="sf6-bg" />
        <div className="sf6-grid" />
        <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh' }}>
          {children}
        </div>
      </body>
    </html>
  )
}

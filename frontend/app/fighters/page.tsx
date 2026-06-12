'use client'
import Navbar from '@/components/Navbar'
import { useLanguage } from '@/lib/i18n'

export default function FightersPage() {
  const { t } = useLanguage()

  return (
    <>
      <Navbar />
      <main style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: 'calc(100vh - 64px)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 className="font-bebas" style={{
            fontSize: '3rem', letterSpacing: '6px',
            color: 'rgba(255,255,255,0.2)',
          }}>{t('fighters.title')}</h1>
          <p className="font-mono" style={{
            color: 'rgba(255,255,255,0.2)', letterSpacing: '3px', fontSize: '0.7rem',
            marginTop: '12px',
          }}>{t('fighters.coming_soon')}</p>
        </div>
      </main>
    </>
  )
}

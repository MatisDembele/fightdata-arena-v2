'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/lib/i18n'

export default function Navbar() {
  const path = usePathname()
  const { lang, setLang, t } = useLanguage()

  const links = [
    { href: '/',         label: t('nav.home') },
    { href: '/quiz',     label: 'QUIZ' },
    { href: '/fighters', label: 'DATABASE' },
    { href: '/multi',    label: 'MULTI' },
  ]

  return (
    <nav className="navbar" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: '60px',
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent, var(--purple), var(--pink), var(--orange), var(--yellow), transparent)',
      }} />

      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
        <span style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(1rem, 3.5vw, 1.4rem)', letterSpacing: 'clamp(2px, 1vw, 5px)',
          color: '#fff',
          textShadow: '0 0 10px #fff, 0 0 24px rgba(255,255,255,0.6), 0 0 48px rgba(255,255,255,0.3)',
          WebkitTextStroke: '1px rgba(255,255,255,0.3)',
        }}>FIGHT DATA ARENA</span>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: '0' }}>
        {links.map(link => {
          const isActive = path === link.href || (link.href !== '/' && path.startsWith(link.href))
          return (
            <Link key={link.href} href={link.href} className="nav-link" style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '0.85rem', letterSpacing: '3px',
              color: isActive ? 'var(--yellow)' : 'rgba(255,255,255,0.45)',
              borderBottom: isActive ? '2px solid var(--yellow)' : '2px solid transparent',
              transition: 'all 0.2s',
              textShadow: isActive ? '0 0 12px rgba(255,224,0,0.5)' : 'none',
            }}>
              {link.label}
            </Link>
          )
        })}
      </div>

      {/* Lang toggle */}
      <div style={{ display: 'flex', gap: '0', flexShrink: 0 }}>
        {(['en', 'fr'] as const).map(l => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className="nav-link"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '0.85rem', letterSpacing: '3px',
              color: lang === l ? 'var(--yellow)' : 'rgba(255,255,255,0.35)',
              borderBottom: lang === l ? '2px solid var(--yellow)' : '2px solid transparent',
              textShadow: lang === l ? '0 0 12px rgba(255,224,0,0.5)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>
    </nav>
  )
}

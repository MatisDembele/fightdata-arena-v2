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

      {/* Navigation */}
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

      {/* Right side: lang toggle + badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '0.6rem', letterSpacing: '2px',
          display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          {(['en', 'fr'] as const).map((l, i) => (
            <span key={l}>
              {i > 0 && <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>}
              <button
                onClick={() => setLang(l)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '0.6rem', letterSpacing: '2px',
                  color: lang === l ? 'var(--yellow)' : 'rgba(255,255,255,0.3)',
                  textShadow: lang === l ? '0 0 8px rgba(255,224,0,0.5)' : 'none',
                  padding: '0 4px',
                  transition: 'all 0.2s',
                }}
              >
                {l.toUpperCase()}
              </button>
            </span>
          ))}
        </div>

        <div className="navbar-badge" style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '0.6rem', letterSpacing: '2px',
          color: 'rgba(255,255,255,0.25)',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '4px 10px',
        }}>SF6 // 2026</div>
      </div>
    </nav>
  )
}

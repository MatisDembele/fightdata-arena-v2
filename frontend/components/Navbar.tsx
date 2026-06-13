'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/lib/i18n'

export default function Navbar() {
  const path = usePathname()
  const { lang, setLang, t } = useLanguage()

  const links: { href: string; label: string; external?: boolean }[] = [
    { href: '/',           label: t('nav.home') },
    { href: '/quiz',       label: 'QUIZ' },
    { href: '/quiz/daily', label: 'DAILY' },
    { href: '/multi',      label: 'MULTI' },
  ]

  return (
    <nav className="navbar" style={{
      display: 'flex', alignItems: 'stretch',
      height: '60px',
      background: 'rgba(4,0,12,0.97)',
      backdropFilter: 'blur(16px)',
      position: 'sticky', top: 0, zIndex: 100,
      overflow: 'hidden',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>

      {/* Top gold line — SF6 signature */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px', zIndex: 1,
        background: 'var(--yellow)',
        opacity: 0.28,
        boxShadow: '0 0 10px rgba(255,224,0,0.35)',
        pointerEvents: 'none',
      }} />

      {/* Logo zone */}
      <Link href="/" style={{
        textDecoration: 'none', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: '10px',
        paddingRight: '24px',
        position: 'relative', zIndex: 2,
        borderRight: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{
          width: '3px', height: '28px', flexShrink: 0,
          background: 'linear-gradient(180deg, var(--pink), var(--purple))',
          boxShadow: '0 0 10px var(--pink)',
        }} />
        <span style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(0.9rem, 2.5vw, 1.15rem)',
          letterSpacing: 'clamp(2px, 0.8vw, 4px)',
          color: '#fff',
          textShadow: '0 0 6px rgba(255,255,255,0.15)',
        }}>FIGHT DATA ARENA</span>
      </Link>

      {/* Nav links — full-height cells */}
      <div style={{
        display: 'flex', alignItems: 'stretch', flex: 1,
        position: 'relative', zIndex: 2,
        paddingLeft: '8px',
      }}>
        {links.map(link => {
          const isActive = !link.external && (
            path === link.href ||
            (link.href !== '/' && path.startsWith(link.href) &&
             !links.some(other => other.href !== link.href && path.startsWith(other.href) && other.href.length > link.href.length))
          )
          const Tag = link.external ? 'a' : Link
          const extraProps = link.external
            ? { href: link.href, target: '_blank', rel: 'noopener noreferrer' }
            : { href: link.href }
          return (
            <Tag
              key={link.href}
              {...extraProps}
              className={`nav-item${isActive ? ' active' : ''}`}
            >
              {/* Active background */}
              {isActive && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(180deg, rgba(255,224,0,0.1) 0%, rgba(255,224,0,0.03) 100%)',
                }} />
              )}
              {/* Active bottom bar */}
              {isActive && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
                  background: 'var(--yellow)',
                  boxShadow: '0 0 10px var(--yellow), 0 0 20px rgba(255,224,0,0.4)',
                }} />
              )}
              <span style={{
                position: 'relative', zIndex: 1,
                textShadow: isActive ? '0 0 12px rgba(255,224,0,0.6)' : 'none',
              }}>{link.label}</span>
            </Tag>
          )
        })}
      </div>

      {/* Lang toggle — full-height cells */}
      <div style={{
        display: 'flex', alignItems: 'stretch',
        position: 'relative', zIndex: 2,
      }}>
        {(['en', 'fr'] as const).map(l => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`nav-lang-btn${lang === l ? ' active' : ''}`}
          >
            {lang === l && (
              <>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(255,224,0,0.08)',
                }} />
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
                  background: 'var(--yellow)',
                  boxShadow: '0 0 8px var(--yellow)',
                }} />
              </>
            )}
            <span style={{
              position: 'relative', zIndex: 1,
              textShadow: lang === l ? '0 0 10px rgba(255,224,0,0.5)' : 'none',
            }}>{l.toUpperCase()}</span>
          </button>
        ))}
      </div>

    </nav>
  )
}

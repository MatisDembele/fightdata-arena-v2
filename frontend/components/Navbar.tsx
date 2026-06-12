'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/lib/i18n'

export default function Navbar() {
  const path = usePathname()
  const { lang, setLang, t } = useLanguage()

  const links: { href: string; label: string; external?: boolean }[] = [
    { href: '/',                                  label: t('nav.home') },
    { href: '/quiz',                              label: 'QUIZ' },
    { href: 'https://ultimateframedata.com',      label: 'DATABASE', external: true },
    { href: '/multi',                             label: 'MULTI' },
  ]

  return (
    <nav className="navbar" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: '56px',
      background: 'rgba(6,0,16,0.94)',
      backdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      position: 'sticky', top: 0, zIndex: 100,
      overflow: 'hidden',
    }}>

      {/* Diagonal stripe texture — same as page bande centrale */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'repeating-linear-gradient(-55deg, transparent, transparent 18px, rgba(255,255,255,0.018) 18px, rgba(255,255,255,0.018) 19px)',
      }} />

      {/* Bottom chromatic line */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', zIndex: 1,
        background: 'linear-gradient(90deg, transparent, var(--purple) 15%, var(--pink) 40%, var(--orange) 65%, var(--yellow) 85%, transparent)',
        opacity: 0.85,
      }} />

      {/* Logo */}
      <Link href="/" style={{
        textDecoration: 'none', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: '10px',
        position: 'relative', zIndex: 2,
      }}>
        <div style={{
          width: '3px', height: '30px',
          background: 'linear-gradient(180deg, var(--pink), var(--purple))',
          boxShadow: '0 0 10px var(--pink), 0 0 20px rgba(255,45,120,0.3)',
          flexShrink: 0,
        }} />
        <span style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(0.9rem, 2.5vw, 1.15rem)',
          letterSpacing: 'clamp(2px, 0.8vw, 4px)',
          color: '#fff',
          textShadow: '0 0 8px rgba(255,255,255,0.2)',
        }}>FIGHT DATA ARENA</span>
      </Link>

      {/* Nav links */}
      <div style={{
        display: 'flex', alignItems: 'stretch',
        height: '100%', gap: '2px',
        position: 'relative', zIndex: 2,
      }}>
        {links.map(link => {
          const isActive = !link.external && (path === link.href || (link.href !== '/' && path.startsWith(link.href)))
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
              {/* Parallelogram fill on active */}
              {isActive && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(180deg, rgba(255,224,0,0.13) 0%, rgba(255,224,0,0.05) 100%)',
                  clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
                }} />
              )}
              {/* Bottom yellow glow bar */}
              {isActive && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
                  background: 'linear-gradient(90deg, transparent 8px, var(--yellow) 8px, var(--yellow) calc(100% - 8px), transparent)',
                  boxShadow: '0 0 12px var(--yellow), 0 0 24px rgba(255,224,0,0.3)',
                }} />
              )}
              <span style={{
                position: 'relative', zIndex: 1,
                textShadow: isActive ? '0 0 14px rgba(255,224,0,0.7)' : 'none',
              }}>{link.label}</span>
            </Tag>
          )
        })}
      </div>

      {/* Lang toggle */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '2px',
        flexShrink: 0, position: 'relative', zIndex: 2,
      }}>
        <div style={{
          width: '1px', height: '22px', marginRight: '8px',
          background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.14), transparent)',
        }} />
        {(['en', 'fr'] as const).map(l => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`nav-lang-btn${lang === l ? ' active' : ''}`}
          >
            {lang === l && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(255,224,0,0.1)',
                clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)',
              }} />
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

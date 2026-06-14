'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/lib/i18n'

export default function Navbar() {
  const path = usePathname()
  const { lang, setLang, t } = useLanguage()

  useEffect(() => {
    const CURRENT_V = 1
    const stored = parseInt(localStorage.getItem('_fda_v') || '0', 10)
    if (stored < CURRENT_V) {
      localStorage.setItem('_fda_v', String(CURRENT_V))
    }
  }, [])

  const links: { href: string; label: string; color: string; colorAlt: string; external?: boolean }[] = [
    { href: '/',           label: t('nav.home'),    color: '#ffe000', colorAlt: '#ff6a00' },
    { href: '/quiz',       label: 'QUIZ',           color: '#ff2d78', colorAlt: '#9b1fff' },
    { href: '/challenges', label: 'CHALLENGE',      color: '#00ff88', colorAlt: '#00b894' },
    { href: '/multi',      label: 'MULTI',          color: '#ffe000', colorAlt: '#ff6a00' },
    { href: '/profile',    label: t('nav.profile'), color: '#c084fc', colorAlt: '#7c3aed' },
  ]

  return (
    <nav className="navbar" style={{
      display: 'flex', alignItems: 'stretch',
      height: '60px',
      background: 'rgba(4,0,12,0.97)',
      backdropFilter: 'blur(16px)',
      position: 'sticky', top: 0, zIndex: 100,
      overflow: 'visible',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>

      {/* Top gold line */}
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

      {/* Nav links */}
      <div style={{
        display: 'flex', alignItems: 'stretch', flex: 1,
        position: 'relative', zIndex: 2,
        paddingLeft: '8px',
        overflow: 'visible',
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
          const { color: c, colorAlt: cAlt } = link
          return (
            <Tag
              key={link.href}
              {...extraProps}
              className={`nav-item${isActive ? ' active' : ''}`}
            >
              {/* Fond card — même gradient que les cards de l'accueil */}
              {isActive && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(180deg, ${c}18, ${cAlt}28)`,
                  transition: 'all 0.3s',
                }} />
              )}
              {/* Ligne haute — même style que le bord supérieur des cards */}
              {isActive && (
                <div style={{
                  position: 'absolute', top: 0, left: '15%', right: '15%', height: '2px',
                  background: `linear-gradient(90deg, transparent, ${c}, transparent)`,
                  boxShadow: `0 0 10px ${c}`,
                }} />
              )}
              {/* Triangle bas — indicateur pointant vers le contenu */}
              {isActive && (
                <div style={{
                  position: 'absolute', bottom: '-7px', left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0, height: 0,
                  borderLeft: '7px solid transparent',
                  borderRight: '7px solid transparent',
                  borderTop: `7px solid ${c}`,
                  filter: `drop-shadow(0 0 5px ${c})`,
                  zIndex: 3,
                }} />
              )}
              <span style={{
                position: 'relative', zIndex: 1,
                color: isActive ? '#fff' : undefined,
                textShadow: isActive ? `0 0 20px ${c}, 0 0 40px ${c}55` : 'none',
              }}>{link.label}</span>
            </Tag>
          )
        })}
      </div>

      {/* Lang toggle */}
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

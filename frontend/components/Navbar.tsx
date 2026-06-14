'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/lib/i18n'
import { useAuth } from '@/components/AuthProvider'
import DiscordIcon from '@/components/DiscordIcon'
import { getDiscordOAuthUrl } from '@/lib/auth'

export default function Navbar() {
  const path = usePathname()
  const { lang, setLang, t } = useLanguage()
  const { user, logout, isLoading } = useAuth()
  const [showConsent, setShowConsent] = useState(false)
  const consentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showConsent) return
    function handleClick(e: MouseEvent) {
      if (consentRef.current && !consentRef.current.contains(e.target as Node)) {
        setShowConsent(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showConsent])

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

  const activeLink = links.find(link =>
    !link.external && (
      path === link.href ||
      (link.href !== '/' && path.startsWith(link.href))
    )
  ) ?? links[0]
  const { color: logoColor, colorAlt: logoColorAlt } = activeLink

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
          background: `linear-gradient(180deg, ${logoColor}, ${logoColorAlt})`,
          boxShadow: `0 0 10px ${logoColor}`,
          transition: 'all 0.5s',
        }} />
        <span style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(0.9rem, 2.5vw, 1.15rem)',
          letterSpacing: 'clamp(2px, 0.8vw, 4px)',
          color: '#fff',
          textShadow: `0 0 10px ${logoColor}, 0 0 24px ${logoColor}88, 0 0 40px ${logoColorAlt}44`,
          WebkitTextStroke: `1px ${logoColor}33`,
          transition: 'text-shadow 0.5s',
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

      {/* Auth button */}
      {!isLoading && (
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '0 12px',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          position: 'relative', zIndex: 2,
          gap: '8px',
        }}>
          {user ? (
            <>
              <DiscordIcon size={13} />
              <span style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.6rem', letterSpacing: '2px',
                color: 'rgba(255,255,255,0.7)',
                maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{user.username}</span>
              <button
                onClick={logout}
                style={{
                  background: 'none', border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '0.45rem', letterSpacing: '2px',
                  padding: '3px 7px',
                  transition: 'all 0.15s',
                }}
              >✕</button>
            </>
          ) : (
            <div ref={consentRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowConsent(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  background: '#5865F2', color: '#fff',
                  padding: '5px 11px', border: 'none', cursor: 'pointer',
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '0.55rem', letterSpacing: '2px',
                  transition: 'opacity 0.15s',
                  opacity: showConsent ? '0.85' : '1',
                }}
              >
                <DiscordIcon size={13} />
                CONNECT
              </button>
              {showConsent && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  width: '260px', background: 'rgba(10,0,20,0.97)',
                  border: '1px solid rgba(88,101,242,0.4)',
                  padding: '14px', zIndex: 999,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                }}>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.45rem', letterSpacing: '3px', color: '#5865F2', marginBottom: '8px' }}>DONNÉES COLLECTÉES</div>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.42rem', letterSpacing: '1px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: '12px' }}>
                    Votre identifiant Discord et pseudo sont sauvegardés pour conserver votre progression. Aucune donnée sensible (email, avatar) n'est collectée.{' '}
                    <Link href="/privacy" style={{ color: '#5865F2' }} onClick={() => setShowConsent(false)}>Politique de confidentialité</Link>
                  </div>
                  <a
                    href={getDiscordOAuthUrl()}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                      background: '#5865F2', color: '#fff', padding: '8px',
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: '0.52rem', letterSpacing: '2px',
                      textDecoration: 'none',
                    }}
                  >
                    <DiscordIcon size={12} />
                    CONTINUER AVEC DISCORD
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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

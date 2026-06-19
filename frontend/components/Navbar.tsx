'use client'
import { useEffect, useState, useRef, useCallback, type CSSProperties } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/lib/i18n'
import { useAuth } from '@/components/AuthProvider'
import DiscordIcon from '@/components/DiscordIcon'
import { getDiscordOAuthUrl } from '@/lib/auth'

const LANGS = [
  { code: 'en' as const, cc: 'gb', name: 'English' },
  { code: 'fr' as const, cc: 'fr', name: 'Français' },
  { code: 'es' as const, cc: 'es', name: 'Español' },
  { code: 'ja' as const, cc: 'jp', name: '日本語' },
]

function HamburgerIcon({ open }: { open: boolean }) {
  const bar = (top: string, rotate: string, opacity: string) => (
    <div style={{
      position: 'absolute', left: 0, right: 0, height: '2px',
      background: '#fff', top,
      transition: 'transform 0.25s, opacity 0.2s',
      transformOrigin: 'center',
      transform: rotate, opacity,
    }} />
  )
  return (
    <div style={{ width: '20px', height: '14px', position: 'relative' }}>
      {bar('0px',   open ? 'translateY(6px) rotate(45deg)'  : 'none', '1')}
      {bar('6px',   'none',                                             open ? '0' : '1')}
      {bar('12px',  open ? 'translateY(-6px) rotate(-45deg)' : 'none', '1')}
    </div>
  )
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function Navbar() {
  const path = usePathname()
  const { lang, setLang, t } = useLanguage()
  const { user, logout, isLoading } = useAuth()
  const [showConsent, setShowConsent] = useState(false)
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [isMobile,    setIsMobile]    = useState(false)
  const [langOpen,    setLangOpen]    = useState(false)
  const [warming,     setWarming]     = useState(false)
  const consentRef = useRef<HTMLDivElement>(null)
  const langRef    = useRef<HTMLDivElement>(null)

  async function handleDiscordConnect(closeMenu = false) {
    if (closeMenu) setMenuOpen(false)
    setWarming(true)
    const controller = new AbortController()
    const tid = setTimeout(() => controller.abort(), 25000)
    try {
      await fetch(`${API_URL}/`, { cache: 'no-store', signal: controller.signal })
    } catch { /* backend may still be starting — proceed anyway */ } finally {
      clearTimeout(tid)
    }
    window.location.href = getDiscordOAuthUrl()
  }

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Close menu on route change
  useEffect(() => { setMenuOpen(false) }, [path])

  // Close lang dropdown on outside click
  useEffect(() => {
    if (!langOpen) return
    function handleClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [langOpen])

  // Close consent popup on outside click
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

// Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (!isMobile) return
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen, isMobile])

  useEffect(() => {
    const CURRENT_V = 1
    const stored = parseInt(localStorage.getItem('_fda_v') || '0', 10)
    if (stored < CURRENT_V) localStorage.setItem('_fda_v', String(CURRENT_V))
  }, [])

  // Navbar mirrors the home carousel exactly: same destinations, same order.
  const links: { href: string; label: string; color: string; colorAlt: string; external?: boolean }[] = [
    { href: '/quiz',                             label: t('home.mode_quiz'),      color: '#ff2d78', colorAlt: '#9b1fff' },
    { href: 'https://ultimateframedata.com/sf6', label: t('home.mode_db'),        color: '#00f0ff', colorAlt: '#0050ff', external: true },
    { href: '/multi',                            label: t('home.mode_multi'),     color: '#ffe000', colorAlt: '#ff6a00' },
    { href: '/challenges',                       label: t('home.mode_challenge'), color: '#00ff88', colorAlt: '#00b894' },
    { href: '/frame-data',                       label: t('home.mode_learn'),     color: '#c084fc', colorAlt: '#7c3aed' },
  ]

  const activeLink = links.find(link =>
    path === link.href || (link.href !== '/' && path.startsWith(link.href))
  ) ?? links[0]
  const { color: logoColor, colorAlt: logoColorAlt } = activeLink

  const isActive = useCallback((href: string) =>
    path === href || (href !== '/' && path.startsWith(href) &&
      !links.some(o => o.href !== href && path.startsWith(o.href) && o.href.length > href.length))
  , [path, links])

  // ── Auth section (shared between desktop + mobile drawer) ──────────────────
  const AuthSection = ({ inDrawer = false }: { inDrawer?: boolean }) => (
    !isLoading ? (
      user ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          ...(inDrawer ? { padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.07)' } : {
            padding: '0 12px',
            borderRight: '1px solid rgba(255,255,255,0.07)',
          }),
        }}>
          <DiscordIcon size={13} />
          <span style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: inDrawer ? '0.65rem' : '0.6rem', letterSpacing: '2px',
            color: 'rgba(255,255,255,0.7)',
            flex: inDrawer ? 1 : undefined,
            maxWidth: inDrawer ? undefined : '120px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{user.username}</span>
          <button
            onClick={() => { logout(); setMenuOpen(false) }}
            style={{
              background: 'none', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)',
              padding: inDrawer ? '4px 10px' : '3px 7px',
              transition: 'all 0.15s',
            }}
          >✕</button>
        </div>
      ) : (
        <div ref={inDrawer ? undefined : consentRef}
          style={{
            position: 'relative',
            ...(inDrawer ? { padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.07)' } : {
              padding: '0 12px',
              borderRight: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center',
            }),
          }}
        >
          {inDrawer ? (
            <button
              onClick={() => handleDiscordConnect(true)}
              disabled={warming}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                background: warming ? '#3a4299' : '#5865F2', color: '#fff', padding: '10px',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)',
                border: 'none', cursor: warming ? 'wait' : 'pointer', width: '100%',
                opacity: warming ? 0.8 : 1, transition: 'all 0.2s',
              }}
            >
              <DiscordIcon size={13} />
              {warming ? 'DÉMARRAGE...' : 'CONNECT DISCORD'}
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowConsent(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  background: '#5865F2', color: '#fff',
                  padding: '5px 11px', border: 'none', cursor: 'pointer',
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)',
                  transition: 'opacity 0.15s', opacity: showConsent ? '0.85' : '1',
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
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-3)', color: '#5865F2', marginBottom: '8px' }}>DONNÉES COLLECTÉES</div>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-1)', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: '12px' }}>
                    Votre identifiant Discord et pseudo sont sauvegardés pour conserver votre progression. Aucune donnée sensible n'est collectée.{' '}
                    <Link href="/privacy" style={{ color: '#5865F2' }} onClick={() => setShowConsent(false)}>Politique de confidentialité</Link>
                  </div>
                  <button
                    onClick={() => handleDiscordConnect()}
                    disabled={warming}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                      background: warming ? '#3a4299' : '#5865F2', color: '#fff', padding: '8px',
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)',
                      border: 'none', cursor: warming ? 'wait' : 'pointer', width: '100%',
                      opacity: warming ? 0.8 : 1, transition: 'all 0.2s',
                    }}
                  >
                    <DiscordIcon size={12} />
                    {warming ? 'DÉMARRAGE...' : 'CONTINUER AVEC DISCORD'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )
    ) : null
  )

  // ── Lang toggle (shared) ────────────────────────────────────────────────────
  const currentLang = LANGS.find(l => l.code === lang) ?? LANGS[0]

  const LangToggle = ({ inDrawer = false }: { inDrawer?: boolean }) => {
    if (inDrawer) {
      return (
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setMenuOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 10px',
                border: `1px solid ${lang === l.code ? '#ffe000' : 'rgba(255,255,255,0.1)'}`,
                background: lang === l.code ? 'rgba(255,224,0,0.1)' : 'transparent',
                cursor: 'pointer',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)',
                color: lang === l.code ? '#ffe000' : 'rgba(255,255,255,0.4)',
              }}
            >
              <span className={`fi fi-${l.cc}`} style={{ width: '20px', height: '15px', display: 'inline-block', borderRadius: '2px', flexShrink: 0 }} />
              {l.name}
            </button>
          ))}
        </div>
      )
    }

    return (
      <div ref={langRef} style={{ position: 'relative', display: 'flex', alignItems: 'stretch', borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
        <button
          onClick={() => setLangOpen(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '0 14px',
            background: langOpen ? 'rgba(255,224,0,0.06)' : 'none',
            border: 'none', cursor: 'pointer',
            transition: 'background 0.15s', whiteSpace: 'nowrap',
          }}
        >
          <span className={`fi fi-${currentLang.cc}`} style={{ width: '20px', height: '15px', display: 'inline-block', borderRadius: '2px' }} />
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)', color: 'rgba(255,255,255,0.8)' }}>
            {currentLang.name}
          </span>
          <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.4)', display: 'inline-block', transition: 'transform 0.2s', transform: langOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
        </button>
        {langOpen && (
          <div style={{ position: 'absolute', top: '100%', right: 0, background: 'rgba(4,0,12,0.98)', border: '1px solid rgba(255,255,255,0.1)', minWidth: '160px', zIndex: 999, boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}>
            {LANGS.map(l => (
              <button
                key={l.code}
                onClick={() => { setLang(l.code); setLangOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%', padding: '10px 14px',
                  background: lang === l.code ? 'rgba(255,224,0,0.08)' : 'transparent',
                  border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer', transition: 'background 0.15s',
                }}
              >
                <span className={`fi fi-${l.cc}`} style={{ width: '20px', height: '15px', display: 'inline-block', borderRadius: '2px', flexShrink: 0 }} />
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)', color: lang === l.code ? '#ffe000' : 'rgba(255,255,255,0.6)' }}>
                  {l.name}
                </span>
                {lang === l.code && <span style={{ marginLeft: 'auto', color: '#ffe000', fontSize: '0.6rem' }}>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <nav className="navbar" style={{
        display: 'flex', alignItems: 'stretch',
        height: '60px',
        background: 'rgba(4,0,12,0.97)',
        backdropFilter: 'blur(16px)',
        position: 'sticky', top: 0, zIndex: 100,
        overflow: 'visible',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>

        {/* Top accent line — follows the active page colour */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px', zIndex: 1,
          background: `linear-gradient(90deg, transparent, ${logoColor}, ${logoColorAlt}, transparent)`,
          opacity: 0.7, boxShadow: `0 0 12px ${logoColor}55`,
          transition: 'all 0.5s', pointerEvents: 'none',
        }} />

        {/* Logo */}
        <Link href="/" style={{
          textDecoration: 'none', flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: '10px',
          paddingLeft: isMobile ? '16px' : '0',
          paddingRight: '24px',
          position: 'relative', zIndex: 2,
          borderRight: '1px solid rgba(255,255,255,0.07)',
        }}>
          <span style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: isMobile ? '1rem' : 'clamp(0.9rem, 2.5vw, 1.15rem)',
            letterSpacing: isMobile ? '2px' : 'clamp(2px, 0.8vw, 4px)',
            color: '#fff',
            textShadow: `0 0 10px ${logoColor}, 0 0 24px ${logoColor}88, 0 0 40px ${logoColorAlt}44`,
            WebkitTextStroke: `1px ${logoColor}33`, transition: 'text-shadow 0.5s',
          }}>
            {isMobile ? 'FDA' : 'FIGHT DATA ARENA'}
          </span>
        </Link>

        {/* Desktop nav links */}
        {!isMobile && (
          <div style={{
            display: 'flex', alignItems: 'stretch', flex: 1,
            position: 'relative', zIndex: 2, paddingLeft: '8px', overflow: 'visible',
          }}>
            {links.map(link => {
              const active = isActive(link.href)
              const { color: c, colorAlt: cAlt } = link
              const inner = (
                <>
                  {active && <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${c}14, ${cAlt}22)`, transition: 'all 0.3s' }} />}
                  {active && <div style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: '2px', background: `linear-gradient(90deg, transparent, ${c}, transparent)`, boxShadow: `0 0 12px ${c}` }} />}
                  {active && <div style={{ position: 'absolute', bottom: '-7px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: `7px solid ${c}`, filter: `drop-shadow(0 0 5px ${c})`, zIndex: 3 }} />}
                  <span style={{ position: 'relative', zIndex: 1, color: active ? '#fff' : undefined, textShadow: active ? `0 0 20px ${c}, 0 0 40px ${c}55` : 'none' }}>{link.label}{link.external ? ' ↗' : ''}</span>
                </>
              )
              return link.external ? (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="nav-item">{inner}</a>
              ) : (
                <Link key={link.href} href={link.href} className={`nav-item${active ? ' active' : ''}`}>{inner}</Link>
              )
            })}
          </div>
        )}

        {/* Spacer on mobile */}
        {isMobile && <div style={{ flex: 1 }} />}

        {/* Desktop: auth + lang */}
        {!isMobile && (
          <>
            <AuthSection />
            <LangToggle />
          </>
        )}

        {/* Mobile: hamburger button */}
        {isMobile && (
          <button
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Menu"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '60px', height: '60px', flexShrink: 0,
              background: 'none', border: 'none', cursor: 'pointer',
              position: 'relative', zIndex: 2,
            }}
          >
            <HamburgerIcon open={menuOpen} />
          </button>
        )}
      </nav>

      {/* Mobile drawer backdrop */}
      {isMobile && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            opacity: menuOpen ? 1 : 0,
            pointerEvents: menuOpen ? 'auto' : 'none',
            transition: 'opacity 0.25s',
          }}
        />
      )}

      {/* Mobile drawer */}
      {isMobile && (
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: '280px', zIndex: 201,
          background: 'rgba(4,0,12,0.99)',
          borderLeft: '1px solid rgba(255,255,255,0.07)',
          transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
        }}>
          {/* Drawer header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 20px', height: '60px', flexShrink: 0,
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}>
            <span style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-4)', color: 'rgba(255,255,255,0.3)',
            }}>NAVIGATION</span>
            <button
              onClick={() => setMenuOpen(false)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem', lineHeight: 1,
              }}
            >✕</button>
          </div>

          {/* Nav links */}
          <div style={{ flex: 1 }}>
            {links.map(link => {
              const active = isActive(link.href)
              const { color: c, colorAlt: cAlt } = link
              const rowStyle: CSSProperties = {
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '18px 20px', textDecoration: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: active ? `linear-gradient(90deg, ${c}15, transparent)` : 'transparent',
                position: 'relative', transition: 'background 0.2s',
              }
              const inner = (
                <>
                  <div style={{ width: '3px', height: '20px', flexShrink: 0, background: active ? `linear-gradient(180deg, ${c}, ${cAlt})` : 'rgba(255,255,255,0.1)', boxShadow: active ? `0 0 8px ${c}` : 'none', transition: 'all 0.2s' }} />
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', letterSpacing: '4px', color: active ? '#fff' : 'rgba(255,255,255,0.45)', textShadow: active ? `0 0 16px ${c}` : 'none', transition: 'all 0.2s' }}>{link.label}{link.external ? ' ↗' : ''}</span>
                </>
              )
              return link.external ? (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)} style={rowStyle}>{inner}</a>
              ) : (
                <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} style={rowStyle}>{inner}</Link>
              )
            })}
          </div>

          {/* Auth + Lang at the bottom */}
          <AuthSection inDrawer />
          <LangToggle inDrawer />
        </div>
      )}
    </>
  )
}

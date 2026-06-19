'use client'
export const dynamic = 'force-static'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '@/lib/i18n'
import Footer from '@/components/Footer'
import { useAuth } from '@/components/AuthProvider'
import { getDiscordOAuthUrl, getDiscordAvatarUrl } from '@/lib/auth'
import DiscordIcon from '@/components/DiscordIcon'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const LANGS = [
  { code: 'en' as const, cc: 'gb', name: 'English' },
  { code: 'fr' as const, cc: 'fr', name: 'Français' },
  { code: 'es' as const, cc: 'es', name: 'Español' },
  { code: 'ja' as const, cc: 'jp', name: '日本語' },
]

export default function Home() {
  const [active, setActive] = useState(0)
  const [langOpen, setLangOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [authError, setAuthError] = useState<'error' | 'cancelled' | null>(() => {
    if (typeof window === 'undefined') return null
    const auth = new URLSearchParams(window.location.search).get('auth')
    return auth === 'error' ? 'error' : auth === 'cancelled' ? 'cancelled' : null
  })
  const langRef = useRef<HTMLDivElement>(null)
  const { t, lang, setLang } = useLanguage()
  const { user, logout, isLoading } = useAuth()
  const [showConsent, setShowConsent] = useState(false)
  const [warming, setWarming] = useState(false)
  const consentRef = useRef<HTMLDivElement>(null)

  async function handleConnect() {
    setWarming(true)
    const controller = new AbortController()
    const tid = setTimeout(() => controller.abort(), 25000)
    try {
      await fetch(`${API_URL}/`, { cache: 'no-store', signal: controller.signal })
    } catch { /* backend may be cold-starting — proceed anyway */ } finally {
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

  const currentLang = LANGS.find(l => l.code === lang) ?? LANGS[0]

  const MODES = [
    {
      id: 'quiz', label: t('home.mode_quiz'), sub: t('home.quiz_sub'),
      href: '/quiz', external: false,
      color: '#ff2d78', colorAlt: '#9b1fff',
      desc: t('home.quiz_desc'),
    },
    {
      id: 'database', label: t('home.mode_db'), sub: t('home.db_sub'),
      href: 'https://ultimateframedata.com/sf6', external: true,
      color: '#00f0ff', colorAlt: '#0050ff',
      desc: t('home.db_desc'),
    },
    {
      id: 'multi', label: t('home.mode_multi'), sub: t('home.multi_sub'),
      href: '/multi', external: false,
      color: '#ffe000', colorAlt: '#ff6a00',
      desc: t('home.multi_desc'),
    },
    {
      id: 'challenges', label: t('home.mode_challenge'), sub: t('home.challenges_sub'),
      href: '/challenges', external: false,
      color: '#00ff88', colorAlt: '#00b894',
      desc: t('home.challenges_desc'),
    },
    {
      id: 'profile', label: t('nav.profile'), sub: t('home.profile_sub'),
      href: '/profile', external: false,
      color: '#c084fc', colorAlt: '#7c3aed',
      desc: t('home.profile_desc'),
    },
  ]

  const STATS = [
    { val: '30',   label: t('home.stat_chars') },
    { val: '1562', label: t('home.stat_moves') },
    { val: '14',   label: t('home.stat_modes') },
  ]

  const current = MODES[active]

  return (
    <>
    {authError && (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        background: authError === 'error' ? 'rgba(220,38,38,0.95)' : 'rgba(100,100,100,0.92)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
        padding: '10px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.72rem', letterSpacing: '2px', color: '#fff' }}>
          {authError === 'error'
            ? '⚠ Connexion Discord échouée — le serveur est peut-être en train de démarrer, réessaie dans 30 secondes.'
            : '— Connexion Discord annulée.'}
        </span>
        <button onClick={() => setAuthError(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, flexShrink: 0 }}>✕</button>
      </div>
    )}
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>

      {/* Discord auth (top-left) */}
      {!isLoading && (
        <div ref={consentRef} style={{ position: 'fixed', top: '16px', left: '20px', zIndex: 100 }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px 5px 6px', background: 'rgba(4,0,12,0.85)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
              {getDiscordAvatarUrl(user, 32)
                ? <img src={getDiscordAvatarUrl(user, 32)!} alt={user.username} style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                : <DiscordIcon size={14} />}
              {!isMobile && (
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.8)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.username}</span>
              )}
              <button onClick={logout} title="Déconnexion" style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '2px 7px', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '1px', flexShrink: 0 }}>✕</button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowConsent(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: '7px', background: '#5865F2', color: '#fff', border: 'none', cursor: 'pointer', padding: '7px 12px', backdropFilter: 'blur(8px)', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', letterSpacing: '2px', transition: 'opacity 0.15s', opacity: showConsent ? 0.85 : 1 }}
              >
                <DiscordIcon size={14} />
                {isMobile ? 'CONNECT' : t('nav.connect')}
              </button>
              {showConsent && (
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, width: '262px', background: 'rgba(10,0,20,0.97)', border: '1px solid rgba(88,101,242,0.4)', padding: '14px', zIndex: 101, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-3)', color: '#5865F2', marginBottom: '8px' }}>{t('nav.consent_title')}</div>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-1)', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: '12px' }}>
                    {t('nav.consent_body')}{' '}
                    <Link href="/privacy" style={{ color: '#5865F2' }} onClick={() => setShowConsent(false)}>{t('nav.privacy_link')}</Link>
                  </div>
                  <button
                    onClick={handleConnect}
                    disabled={warming}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', background: warming ? '#3a4299' : '#5865F2', color: '#fff', padding: '8px', border: 'none', cursor: warming ? 'wait' : 'pointer', width: '100%', opacity: warming ? 0.8 : 1, fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)', transition: 'all 0.2s' }}
                  >
                    <DiscordIcon size={12} />
                    {warming ? t('nav.connect_warming') : t('nav.connect_continue')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Lang dropdown */}
      <div ref={langRef} style={{ position: 'fixed', top: '16px', right: '20px', zIndex: 100 }}>
        <button
          onClick={() => setLangOpen(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '6px 12px',
            background: 'rgba(4,0,12,0.85)',
            border: '1px solid rgba(255,255,255,0.15)',
            cursor: 'pointer', backdropFilter: 'blur(8px)',
          }}
        >
          <span className={`fi fi-${currentLang.cc}`} style={{ width: '20px', height: '15px', display: 'inline-block', borderRadius: '2px' }} />
          {!isMobile && (
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.8)' }}>
              {currentLang.name}
            </span>
          )}
          <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.4)', display: 'inline-block', transition: 'transform 0.2s', transform: langOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
        </button>
        {langOpen && (
          <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, background: 'rgba(4,0,12,0.97)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', minWidth: '160px', zIndex: 101, boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}>
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
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', letterSpacing: '2px', color: lang === l.code ? '#ffe000' : 'rgba(255,255,255,0.6)' }}>
                  {l.name}
                </span>
                {lang === l.code && <span style={{ marginLeft: 'auto', color: '#ffe000', fontSize: '0.6rem' }}>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* BG dynamique */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        transition: 'all 0.6s ease',
        background: `
          radial-gradient(ellipse 100% 80% at 50% 100%, ${current.color}20 0%, transparent 60%),
          radial-gradient(ellipse 80% 60% at 15% 50%, ${current.colorAlt}30 0%, transparent 55%),
          radial-gradient(ellipse 70% 70% at 85% 30%, ${current.color}20 0%, transparent 55%),
          linear-gradient(160deg, #0d0010 0%, #1a0030 50%, #0d0015 100%)
        `,
      }} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Bande centrale */}
      <div style={{
        position: 'absolute', top: '50%', left: 0, right: 0,
        transform: 'translateY(-50%)', height: '50vh', zIndex: 2,
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(90deg, ${current.colorAlt}30, ${current.color}20, ${current.colorAlt}30)`,
          transition: 'all 0.5s',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'repeating-linear-gradient(-55deg, transparent, transparent 20px, rgba(255,255,255,0.015) 20px, rgba(255,255,255,0.015) 21px)',
        }} />
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: `linear-gradient(90deg, transparent, ${current.color}, ${current.colorAlt}, transparent)`,
          boxShadow: `0 0 16px ${current.color}`,
          transition: 'all 0.5s',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
          background: `linear-gradient(90deg, transparent, ${current.colorAlt}, ${current.color}, transparent)`,
          boxShadow: `0 0 16px ${current.colorAlt}`,
          transition: 'all 0.5s',
        }} />
      </div>

      {/* Contenu */}
      <div style={{
        position: 'relative', zIndex: 10,
        height: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '40px 0 48px',
      }}>

        {/* Titre */}
        <div style={{ textAlign: 'center' }} className="animate-fadeInUp">
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
            letterSpacing: '10px', lineHeight: 1,
            color: '#fff',
            textShadow: `0 0 12px ${current.color}, 0 0 30px ${current.color}88, 0 0 60px ${current.colorAlt}44`,
            WebkitTextStroke: `1px ${current.color}55`,
            transition: 'text-shadow 0.5s',
          }}>FIGHT DATA ARENA</h1>
          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 'var(--fs-sm)', letterSpacing: 'var(--ls-4)',
            color: 'rgba(255,255,255,0.25)', marginTop: '8px',
          }}>{t('home.subtitle')}</div>
        </div>

        {/* Description — fixed height (reserves 3 lines) so switching modes
            never changes its height and the carousel below stays put. */}
        <div style={{
          textAlign: 'center', maxWidth: '480px', padding: '0 24px',
          minHeight: '4.8em', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <p style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '1rem', fontWeight: 500, lineHeight: 1.6,
            color: 'rgba(255,255,255,0.45)', letterSpacing: '0.5px',
            transition: 'all 0.3s',
          }}>{current.desc}</p>
        </div>

        {/* Modes */}
        <div className="home-modes-row">
          <button
            className="home-arrow-btn"
            onClick={() => setActive(a => (a - 1 + MODES.length) % MODES.length)}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
          >«</button>

          <div className="home-modes-inner">
            {MODES.map((mode, i) => {
              const isActive = i === active
              const handleClick = (e: React.MouseEvent) => { if (i !== active) { e.preventDefault(); setActive(i) } }
              const className = `home-mode-card ${isActive ? 'home-mode-active' : 'home-mode-inactive'}`
              const inner = (
                <>
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: isActive ? `linear-gradient(180deg, ${mode.color}18, ${mode.colorAlt}28)` : 'rgba(0,0,0,0.15)',
                    transition: 'all 0.3s',
                  }} />
                  {isActive && (
                    <>
                      <div style={{
                        position: 'absolute', top: 0, left: '15%', right: '15%', height: '2px',
                        background: `linear-gradient(90deg, transparent, ${mode.color}, transparent)`,
                        boxShadow: `0 0 10px ${mode.color}`,
                      }} />
                      <div style={{
                        position: 'absolute', top: '-8px', left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0, height: 0,
                        borderLeft: '7px solid transparent',
                        borderRight: '7px solid transparent',
                        borderBottom: `7px solid ${mode.color}`,
                        filter: `drop-shadow(0 0 5px ${mode.color})`,
                      }} />
                    </>
                  )}
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: isActive ? 'clamp(1.8rem, 3.6vw, 2.6rem)' : 'clamp(1.2rem, 2.5vw, 1.8rem)',
                      letterSpacing: isActive ? '5px' : '4px',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.3)',
                      textShadow: isActive ? `0 0 20px ${mode.color}, 0 0 40px ${mode.color}55` : 'none',
                      transition: 'all 0.3s', lineHeight: 1, whiteSpace: 'nowrap',
                    }}>{mode.label}</div>
                    <div style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: isActive ? 'var(--fs-sm)' : 'var(--fs-xs)',
                      letterSpacing: 'var(--ls-3)',
                      color: isActive ? mode.color : 'rgba(255,255,255,0.18)',
                      marginTop: '6px',
                      lineHeight: 1.3,
                      minHeight: '2.6em',   /* reserve 2 lines so 1- and 2-line subs give equal-height cards */
                      textShadow: isActive ? `0 0 8px ${mode.color}` : 'none',
                      transition: 'all 0.3s',
                    }}>{mode.sub}</div>
                  </div>
                </>
              )
              if (mode.external) {
                return (
                  <a key={mode.id} href={mode.href} target="_blank" rel="noopener noreferrer"
                    className={className} onMouseEnter={() => setActive(i)} onClick={handleClick}>
                    {inner}
                  </a>
                )
              }
              return (
                <Link key={mode.id} href={mode.href}
                  className={className} onMouseEnter={() => setActive(i)} onClick={handleClick}>
                  {inner}
                </Link>
              )
            })}
          </div>

          <button
            className="home-arrow-btn"
            onClick={() => setActive(a => (a + 1) % MODES.length)}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
          >»</button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 'clamp(16px, 4vw, 48px)', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', padding: '0 16px' }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '2rem', letterSpacing: '2px',
                color: current.color,
                textShadow: `0 0 12px ${current.color}`,
                transition: 'all 0.3s',
              }}>{s.val}</div>
              <div style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)',
                color: 'rgba(255,255,255,0.25)',
              }}>{s.label}</div>
            </div>
          ))}
          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)',
            color: 'rgba(255,255,255,0.15)',
          }}>{t('home.patch')}</div>
        </div>

      </div>

      {/* Fondu bas vers le footer */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px',
        background: 'linear-gradient(to bottom, transparent, rgba(4,0,12,0.97))',
        zIndex: 5, pointerEvents: 'none',
      }} />
    </div>
    <Footer />
    </>
  )
}

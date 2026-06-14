'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useLanguage } from '@/lib/i18n'
import Footer from '@/components/Footer'

export default function Home() {
  const [active, setActive] = useState(0)
  const { t, lang, setLang } = useLanguage()

  const MODES = [
    {
      id: 'quiz', label: 'QUIZ', sub: t('home.quiz_sub'),
      href: '/quiz', external: false,
      color: '#ff2d78', colorAlt: '#9b1fff',
      desc: t('home.quiz_desc'),
    },
    {
      id: 'database', label: 'DATABASE', sub: t('home.db_sub'),
      href: 'https://ultimateframedata.com/sf6', external: true,
      color: '#00f0ff', colorAlt: '#0050ff',
      desc: t('home.db_desc'),
    },
    {
      id: 'multi', label: 'MULTI', sub: t('home.multi_sub'),
      href: '/multi', external: false,
      color: '#ffe000', colorAlt: '#ff6a00',
      desc: t('home.multi_desc'),
    },
    {
      id: 'challenges', label: 'CHALLENGE', sub: t('home.challenges_sub'),
      href: '/challenges', external: false,
      color: '#00ff88', colorAlt: '#00b894',
      desc: t('home.challenges_desc'),
    },
    {
      id: 'profile', label: 'PROFILE', sub: t('home.profile_sub'),
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
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>

      {/* Lang toggle */}
      <div style={{ position: 'fixed', top: '16px', right: '20px', zIndex: 100, display: 'flex', gap: '0' }}>
        {(['en', 'fr'] as const).map(l => (
          <button
            key={l}
            onClick={() => setLang(l)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '0.85rem', letterSpacing: '3px',
              color: lang === l ? 'var(--yellow)' : 'rgba(255,255,255,0.35)',
              borderBottom: lang === l ? '2px solid var(--yellow)' : '2px solid transparent',
              textShadow: lang === l ? '0 0 12px rgba(255,224,0,0.5)' : 'none',
              padding: '4px 8px',
              transition: 'all 0.2s',
            }}
          >
            {l.toUpperCase()}
          </button>
        ))}
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

        {/* Description */}
        <div style={{ textAlign: 'center', maxWidth: '480px', padding: '0 24px' }}>
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
                      fontSize: isActive ? 'clamp(2rem, 4vw, 3rem)' : 'clamp(1.2rem, 2.5vw, 1.8rem)',
                      letterSpacing: isActive ? '6px' : '4px',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.3)',
                      textShadow: isActive ? `0 0 20px ${mode.color}, 0 0 40px ${mode.color}55` : 'none',
                      transition: 'all 0.3s', lineHeight: 1,
                    }}>{mode.label}</div>
                    <div style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: isActive ? 'var(--fs-sm)' : 'var(--fs-xs)',
                      letterSpacing: 'var(--ls-3)',
                      color: isActive ? mode.color : 'rgba(255,255,255,0.18)',
                      marginTop: '6px',
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

'use client'
import Link from 'next/link'
import { useState } from 'react'

const MODES = [
  {
    id: 'quiz',
    label: 'QUIZ',
    sub: 'Teste tes connaissances',
    href: '/quiz',
    color: '#ff2d78',
    colorAlt: '#9b1fff',
    desc: 'Devine le startup, le damage ou le on-block de chaque move depuis son hitbox GIF.',
  },
  {
    id: 'database',
    label: 'DATABASE',
    sub: 'Frame data complète',
    href: '/fighters',
    color: '#00f0ff',
    colorAlt: '#0050ff',
    desc: 'Accède aux données de frame de tous les personnages SF6. Startup, active, recovery et plus.',
  },
  {
    id: 'compare',
    label: 'COMPARE',
    sub: 'Comparaison de persos',
    href: '/compare',
    color: '#ffe000',
    colorAlt: '#ff6a00',
    desc: 'Compare les statistiques et les moves de deux personnages côte à côte.',
  },
]

export default function Home() {
  const [active, setActive] = useState(1) // DATABASE sélectionné par défaut (centre)

  const current = MODES[active]

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden', fontFamily: "'Rajdhani', sans-serif" }}>

      {/* ── BG dynamique selon le mode ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        transition: 'all 0.6s ease',
        background: `
          radial-gradient(ellipse 100% 80% at 50% 100%, ${current.color}22 0%, transparent 60%),
          radial-gradient(ellipse 80% 60% at 20% 50%, ${current.colorAlt}33 0%, transparent 55%),
          radial-gradient(ellipse 70% 70% at 80% 30%, ${current.color}22 0%, transparent 55%),
          linear-gradient(160deg, #0d0010 0%, #1a0030 50%, #0d0015 100%)
        `,
      }} />

      {/* Grille */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Diagonales SF6 */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2,
        background: `repeating-linear-gradient(-45deg, transparent, transparent 80px, rgba(255,255,255,0.008) 80px, rgba(255,255,255,0.008) 81px)`,
      }} />

      {/* ── Bande horizontale centrale (artwork) ── */}
      <div style={{
        position: 'absolute', top: '50%', left: 0, right: 0,
        transform: 'translateY(-50%)',
        height: '55vh', zIndex: 3,
        overflow: 'hidden',
      }}>
        {/* Fond de la bande avec texture */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(90deg, ${current.colorAlt}44, ${current.color}33, ${current.colorAlt}44)`,
          transition: 'all 0.5s ease',
        }} />
        {/* Motif diagonal SF6 */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `repeating-linear-gradient(
            -55deg,
            transparent,
            transparent 20px,
            rgba(255,255,255,0.025) 20px,
            rgba(255,255,255,0.025) 21px
          )`,
        }} />
        {/* Bordures haut/bas lumineuses */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: `linear-gradient(90deg, transparent, ${current.color}, ${current.colorAlt}, ${current.color}, transparent)`,
          boxShadow: `0 0 20px ${current.color}`,
          transition: 'all 0.5s',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
          background: `linear-gradient(90deg, transparent, ${current.colorAlt}, ${current.color}, ${current.colorAlt}, transparent)`,
          boxShadow: `0 0 20px ${current.colorAlt}`,
          transition: 'all 0.5s',
        }} />
      </div>

      {/* ── Contenu principal ── */}
      <div style={{
        position: 'relative', zIndex: 10,
        height: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '32px 0 48px',
      }}>

        {/* ── TITRE NEON ── */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(2.5rem, 6vw, 5rem)',
            letterSpacing: '10px',
            color: '#fff',
            textShadow: `
              0 0 10px ${current.color},
              0 0 20px ${current.color},
              0 0 40px ${current.color}88,
              0 0 80px ${current.colorAlt}44
            `,
            transition: 'text-shadow 0.5s',
            WebkitTextStroke: `1px ${current.color}88`,
          }}>
            FIGHT DATA ARENA
          </h1>
          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '0.7rem', letterSpacing: '6px',
            color: 'rgba(255,255,255,0.3)',
            marginTop: '6px',
          }}>
            STREET FIGHTER 6 // FRAME DATA ENCYCLOPEDIA
          </div>
        </div>

        {/* ── DESCRIPTION DU MODE ACTIF ── */}
        <div style={{
          textAlign: 'center', padding: '0 40px',
          maxWidth: '500px',
          transition: 'all 0.3s',
        }}>
          <p style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '1rem', fontWeight: 500,
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: '1px', lineHeight: 1.6,
          }}>
            {current.desc}
          </p>
        </div>

        {/* ── MENU MODES style Fighting Ground ── */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: '0', width: '100%',
          position: 'relative',
        }}>

          {/* Flèche gauche */}
          <button
            onClick={() => setActive(a => (a - 1 + MODES.length) % MODES.length)}
            style={{
              width: '60px', height: '60px', flexShrink: 0,
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '1.5rem', color: 'rgba(255,255,255,0.4)',
              marginLeft: '40px',
            }}
          >«</button>

          {/* Modes */}
          <div style={{
            flex: 1, display: 'flex', alignItems: 'flex-end',
            justifyContent: 'center', gap: '0',
          }}>
            {MODES.map((mode, i) => {
              const isActive = i === active
              const diff = Math.abs(i - active)
              return (
                <Link
                  key={mode.id}
                  href={mode.href}
                  onMouseEnter={() => setActive(i)}
                  style={{
                    textDecoration: 'none',
                    flex: isActive ? '0 0 340px' : '0 0 220px',
                    textAlign: 'center',
                    padding: isActive ? '20px 32px 28px' : '16px 24px 24px',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Fond du bouton */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: isActive
                      ? `linear-gradient(180deg, ${mode.color}22, ${mode.colorAlt}33)`
                      : 'rgba(0,0,0,0.2)',
                    transition: 'all 0.3s',
                  }} />

                  {/* Ligne du haut */}
                  {isActive && (
                    <div style={{
                      position: 'absolute', top: 0, left: '10%', right: '10%', height: '3px',
                      background: `linear-gradient(90deg, transparent, ${mode.color}, transparent)`,
                      boxShadow: `0 0 12px ${mode.color}`,
                    }} />
                  )}

                  {/* Indicateur triangle */}
                  {isActive && (
                    <div style={{
                      position: 'absolute', top: '-8px', left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0, height: 0,
                      borderLeft: '8px solid transparent',
                      borderRight: '8px solid transparent',
                      borderBottom: `8px solid ${mode.color}`,
                      filter: `drop-shadow(0 0 6px ${mode.color})`,
                    }} />
                  )}

                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: isActive ? 'clamp(2rem, 4vw, 3.2rem)' : 'clamp(1.2rem, 2.5vw, 1.8rem)',
                      letterSpacing: isActive ? '6px' : '4px',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.35)',
                      textShadow: isActive ? `0 0 20px ${mode.color}, 0 0 40px ${mode.color}66` : 'none',
                      transition: 'all 0.3s',
                      lineHeight: 1,
                    }}>
                      {mode.label}
                    </div>
                    <div style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: isActive ? '0.65rem' : '0.55rem',
                      letterSpacing: '3px',
                      color: isActive ? mode.color : 'rgba(255,255,255,0.2)',
                      marginTop: '6px',
                      textShadow: isActive ? `0 0 10px ${mode.color}` : 'none',
                      transition: 'all 0.3s',
                    }}>
                      {mode.sub}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Flèche droite */}
          <button
            onClick={() => setActive(a => (a + 1) % MODES.length)}
            style={{
              width: '60px', height: '60px', flexShrink: 0,
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '1.5rem', color: 'rgba(255,255,255,0.4)',
              marginRight: '40px',
            }}
          >»</button>
        </div>

        {/* ── Barre bas ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '0 48px',
        }}>
          <div style={{
            display: 'flex', gap: '32px',
          }}>
            {[
              { val: '29', label: 'PERSOS' },
              { val: '1418', label: 'MOVES' },
              { val: '100%', label: 'ROSTER' },
            ].map(s => (
              <div key={s.label}>
                <span style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '1.4rem', letterSpacing: '2px',
                  color: current.color,
                  textShadow: `0 0 12px ${current.color}`,
                  transition: 'all 0.3s',
                }}>{s.val} </span>
                <span style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '0.6rem', letterSpacing: '3px',
                  color: 'rgba(255,255,255,0.3)',
                }}>{s.label}</span>
              </div>
            ))}
          </div>

          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '0.6rem', letterSpacing: '3px',
            color: 'rgba(255,255,255,0.2)',
          }}>
            SF6 PATCH MARCH 2026
          </div>
        </div>

      </div>
    </div>
  )
}

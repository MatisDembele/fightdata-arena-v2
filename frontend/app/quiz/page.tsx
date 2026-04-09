'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getFighters } from '@/lib/api'
import type { Fighter } from '@/types'

const QUIZ_MODES = [
  {
    id: 'random',
    label: 'RANDOM',
    sub: 'Tous les persos',
    desc: 'Questions aléatoires sur tout le roster SF6. Le mode parfait pour s\'entraîner.',
    color: '#ff2d78',
    colorAlt: '#9b1fff',
    href: '/quiz/play?mode=random',
    icon: '🎲',
  },
  {
    id: 'fighter',
    label: 'FIGHTER',
    sub: 'Focus un perso',
    desc: 'Choisis un personnage et maîtrise ses frames en profondeur.',
    color: '#00f0ff',
    colorAlt: '#0050ff',
    href: null, // ouvre le sélecteur de perso
    icon: '🥊',
  },
  {
    id: 'hardcore',
    label: 'HARDCORE',
    sub: 'Timer activé',
    desc: 'Réponds en moins de 5 secondes. Pas de passe. Pour les vrais.',
    color: '#ffe000',
    colorAlt: '#ff6a00',
    href: '/quiz/play?mode=hardcore',
    icon: '⚡',
  },
]

export default function QuizSelectPage() {
  const [active, setActive]           = useState(0)
  const [showFighters, setShowFighters] = useState(false)
  const [fighters, setFighters]       = useState<Fighter[]>([])
  const [search, setSearch]           = useState('')
  const [loadingF, setLoadingF]       = useState(false)

  const current = QUIZ_MODES[active]

  const handleModeClick = async (mode: typeof QUIZ_MODES[0]) => {
    if (mode.id === 'fighter') {
      setShowFighters(true)
      if (fighters.length === 0) {
        setLoadingF(true)
        try {
          const data = await getFighters()
          setFighters(data)
        } finally {
          setLoadingF(false)
        }
      }
    }
  }

  const filtered = fighters.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <Navbar />
      <div style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px',
      }}>

        {!showFighters ? (
          <>
            {/* Titre */}
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h1 style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                letterSpacing: '8px',
                color: '#fff',
                textShadow: `0 0 20px ${current.color}, 0 0 40px ${current.color}66`,
                transition: 'text-shadow 0.4s',
              }}>CHOISIR UN MODE</h1>
              <p style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.65rem', letterSpacing: '4px',
                color: 'rgba(255,255,255,0.3)', marginTop: '8px',
              }}>STREET FIGHTER 6 // QUIZ</p>
            </div>

            {/* Description mode actif */}
            <div style={{
              textAlign: 'center', marginBottom: '40px',
              minHeight: '48px',
              transition: 'all 0.3s',
            }}>
              <p style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '1rem', fontWeight: 500,
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: '1px',
              }}>{current.desc}</p>
            </div>

            {/* Modes */}
            <div style={{
              display: 'flex', gap: '16px',
              flexWrap: 'wrap', justifyContent: 'center',
              width: '100%', maxWidth: '900px',
            }}>
              {QUIZ_MODES.map((mode, i) => {
                const isActive = i === active
                return (
                  <div
                    key={mode.id}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => mode.href
                      ? window.location.href = mode.href
                      : handleModeClick(mode)
                    }
                    style={{
                      flex: isActive ? '0 0 340px' : '0 0 220px',
                      cursor: 'pointer',
                      padding: isActive ? '32px 28px' : '24px 20px',
                      background: isActive
                        ? `linear-gradient(160deg, ${mode.color}18, ${mode.colorAlt}25)`
                        : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isActive ? mode.color + '60' : 'rgba(255,255,255,0.08)'}`,
                      transition: 'all 0.3s ease',
                      position: 'relative', overflow: 'hidden',
                      boxShadow: isActive ? `0 0 30px ${mode.color}22` : 'none',
                    }}
                  >
                    {/* Ligne du haut */}
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                      background: isActive
                        ? `linear-gradient(90deg, transparent, ${mode.color}, transparent)`
                        : 'transparent',
                      boxShadow: isActive ? `0 0 10px ${mode.color}` : 'none',
                      transition: 'all 0.3s',
                    }} />

                    <div style={{ fontSize: isActive ? '2.5rem' : '1.8rem', marginBottom: '12px', transition: 'all 0.3s' }}>
                      {mode.icon}
                    </div>

                    <div style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: isActive ? '2rem' : '1.4rem',
                      letterSpacing: '4px',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.35)',
                      textShadow: isActive ? `0 0 16px ${mode.color}` : 'none',
                      transition: 'all 0.3s',
                    }}>{mode.label}</div>

                    <div style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: '0.6rem', letterSpacing: '3px',
                      color: isActive ? mode.color : 'rgba(255,255,255,0.2)',
                      marginTop: '6px',
                      textShadow: isActive ? `0 0 8px ${mode.color}` : 'none',
                      transition: 'all 0.3s',
                    }}>{mode.sub}</div>

                    {isActive && (
                      <div style={{
                        marginTop: '16px',
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: '0.85rem', fontWeight: 500,
                        color: 'rgba(255,255,255,0.6)',
                        lineHeight: 1.5,
                      }}>
                        APPUYER POUR JOUER →
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          /* ── Sélecteur de perso ── */
          <div style={{ width: '100%', maxWidth: '800px' }}>

            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              marginBottom: '24px',
            }}>
              <button onClick={() => setShowFighters(false)} style={{
                background: 'none', border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                padding: '8px 16px',
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '0.9rem', letterSpacing: '2px',
              }}>← RETOUR</button>

              <div>
                <h2 style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '2rem', letterSpacing: '6px',
                  color: '#fff',
                  textShadow: '0 0 20px #00f0ff, 0 0 40px #00f0ff66',
                }}>CHOISIR UN PERSONNAGE</h2>
              </div>
            </div>

            {/* Search */}
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="RECHERCHER..."
              style={{
                width: '100%', padding: '12px 20px',
                marginBottom: '24px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff', outline: 'none',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.85rem', letterSpacing: '2px',
              }}
            />

            {/* Grille de persos */}
            {loadingF ? (
              <div style={{
                textAlign: 'center', padding: '40px',
                fontFamily: "'Share Tech Mono', monospace",
                color: 'rgba(255,255,255,0.3)', letterSpacing: '4px',
              }}>CHARGEMENT...</div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '8px',
              }}>
                {filtered.map(fighter => (
                  <Link
                    key={fighter.slug}
                    href={`/quiz/play?mode=fighter&slug=${fighter.slug}`}
                    style={{
                      textDecoration: 'none',
                      padding: '16px 12px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: '8px',
                      transition: 'all 0.15s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.background = 'rgba(0,240,255,0.08)'
                      el.style.borderColor = 'rgba(0,240,255,0.3)'
                      el.style.boxShadow = '0 0 16px rgba(0,240,255,0.1)'
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.background = 'rgba(255,255,255,0.04)'
                      el.style.borderColor = 'rgba(255,255,255,0.08)'
                      el.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{ fontSize: '1.8rem' }}>🥊</div>
                    <div style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: '0.8rem', fontWeight: 700,
                      letterSpacing: '1px', textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.8)',
                      textAlign: 'center',
                    }}>{fighter.name}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </>
  )
}

'use client'
import { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getFighters } from '@/lib/api'
import { getFighterPortrait, getFighterColor } from '@/lib/portraits'
import type { Fighter } from '@/types'

const QUIZ_MODES = [
  {
    id: 'random',
    label: 'RANDOM',
    sub: 'QCM — Tous les persos',
    desc: 'Questions à choix multiples sur tout le roster SF6. Le mode parfait pour débuter.',
    color: '#ff2d78', colorAlt: '#9b1fff',
    href: '/quiz/play?mode=random',
    icon: '🎲',
  },
  {
    id: 'fighter',
    label: 'FIGHTER',
    sub: 'QCM — Focus un perso',
    desc: 'Choisis un personnage et maîtrise ses frames en profondeur.',
    color: '#00f0ff', colorAlt: '#0050ff',
    href: null,
    icon: '🥊',
  },
  {
    id: 'input',
    label: 'INPUT',
    sub: 'Frappe la valeur exacte',
    desc: 'Pas de choix multiples — tu dois taper toi-même la valeur exacte du startup. Mode exigeant.',
    color: '#9b1fff', colorAlt: '#ff2d78',
    href: '/quiz/play?mode=input',
    icon: '⌨️',
  },
  {
    id: 'punish',
    label: 'PUNISH FINDER',
    sub: 'Punissable ou safe on block ?',
    desc: 'Le move le plus rapide en SF6 est 4 frames. Un move à -4 ou pire est punissable. Entraîne-toi à reconnaître les moves qui se punissent.',
    color: '#ffe000', colorAlt: '#ff6a00',
    href: '/quiz/play?mode=punish',
    icon: '💀',
  },
  {
    id: 'hardcore',
    label: 'HARDCORE',
    sub: 'Timer 5s — Tous les persos',
    desc: 'Réponds en moins de 5 secondes. Pas de passe. Pour les vrais lab monsters.',
    color: '#ff6a00', colorAlt: '#ff2d78',
    href: '/quiz/play?mode=hardcore',
    icon: '⚡',
  },
]

export default function QuizSelectPage() {
  const [active, setActive]             = useState(0)
  const [showFighters, setShowFighters] = useState(false)
  const [fighters, setFighters]         = useState<Fighter[]>([])
  const [search, setSearch]             = useState('')
  const [loadingF, setLoadingF]         = useState(false)

  const current = QUIZ_MODES[active]

  const handleModeClick = async (mode: typeof QUIZ_MODES[0]) => {
    if (mode.id === 'fighter') {
      setShowFighters(true)
      if (fighters.length === 0) {
        setLoadingF(true)
        try { setFighters(await getFighters()) }
        finally { setLoadingF(false) }
      }
    } else if (mode.href) {
      window.location.href = mode.href
    }
  }

  const filtered = fighters.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <Navbar />
      <div style={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-start',
        padding: '40px 20px 60px',
        overflowY: 'auto',
      }}>

        {!showFighters ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h1 style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(2rem, 5vw, 3rem)',
                letterSpacing: '8px', color: '#fff',
                textShadow: `0 0 20px ${current.color}`,
                transition: 'text-shadow 0.4s',
              }}>CHOISIR UN MODE</h1>
              <p style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.6rem', letterSpacing: '4px',
                color: 'rgba(255,255,255,0.25)', marginTop: '6px',
              }}>STREET FIGHTER 6 // QUIZ — {QUIZ_MODES.length} MODES</p>
            </div>

            <div style={{
              textAlign: 'center', marginBottom: '28px', minHeight: '44px',
              maxWidth: '480px',
            }}>
              <p style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '0.95rem', fontWeight: 500,
                color: 'rgba(255,255,255,0.45)', letterSpacing: '0.5px',
                transition: 'all 0.3s',
              }}>{current.desc}</p>
            </div>

            {/* Grille de modes — 5 colonnes fixes */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '10px',
              width: '100%', maxWidth: '960px',
            }}>
              {QUIZ_MODES.map((mode, i) => {
                const isActive = i === active
                return (
                  <div
                    key={mode.id}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => handleModeClick(mode)}
                    style={{
                      cursor: 'pointer',
                      padding: '20px 14px',
                      background: isActive
                        ? `linear-gradient(160deg, ${mode.color}15, ${mode.colorAlt}22)`
                        : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isActive ? mode.color + '55' : 'rgba(255,255,255,0.07)'}`,
                      transition: 'all 0.25s ease',
                      position: 'relative', overflow: 'hidden',
                      boxShadow: isActive ? `0 0 24px ${mode.color}18` : 'none',
                      transform: isActive ? 'translateY(-2px)' : 'none',
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                      background: isActive
                        ? `linear-gradient(90deg, transparent, ${mode.color}, transparent)`
                        : 'transparent',
                      transition: 'all 0.25s',
                    }} />

                    <div style={{ fontSize: '1.6rem', marginBottom: '10px' }}>{mode.icon}</div>

                    <div style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: '1.1rem', letterSpacing: '2px',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                      textShadow: isActive ? `0 0 12px ${mode.color}` : 'none',
                      transition: 'all 0.25s',
                    }}>{mode.label}</div>

                    <div style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: '0.5rem', letterSpacing: '1px',
                      color: isActive ? mode.color : 'rgba(255,255,255,0.2)',
                      marginTop: '4px', lineHeight: 1.4,
                      transition: 'all 0.25s',
                    }}>{mode.sub}</div>

                    {isActive && (
                      <div style={{
                        marginTop: '10px',
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: '0.72rem', fontWeight: 700,
                        color: 'rgba(255,255,255,0.5)',
                        letterSpacing: '1px',
                      }}>JOUER →</div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          /* Sélecteur de perso */
          <div style={{ width: '100%', maxWidth: '900px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <button onClick={() => setShowFighters(false)} style={{
                background: 'none', border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                padding: '8px 16px', fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '0.85rem', letterSpacing: '2px',
              }}>← RETOUR</button>
              <h2 style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '1.8rem', letterSpacing: '5px', color: '#fff',
                textShadow: '0 0 16px #00f0ff',
              }}>CHOISIR UN PERSONNAGE</h2>
            </div>

            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="RECHERCHER..."
              style={{
                width: '100%', padding: '11px 18px', marginBottom: '20px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', outline: 'none',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.8rem', letterSpacing: '2px',
              }}
            />

            {loadingF ? (
              <div style={{
                textAlign: 'center', padding: '40px',
                fontFamily: "'Share Tech Mono', monospace",
                color: 'rgba(255,255,255,0.3)', letterSpacing: '4px',
              }}>CHARGEMENT...</div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                gap: '6px',
              }}>
                {filtered.map(fighter => {
                  const portrait = getFighterPortrait(fighter.slug)
                  const color    = getFighterColor(fighter.slug)
                  return (
                    <Link
                      key={fighter.slug}
                      href={`/quiz/play?mode=fighter&slug=${fighter.slug}`}
                      style={{
                        textDecoration: 'none',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        overflow: 'hidden', transition: 'all 0.15s', cursor: 'pointer',
                      }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLElement
                        el.style.borderColor = color
                        el.style.boxShadow   = `0 0 12px ${color}33`
                        el.style.background  = `${color}12`
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement
                        el.style.borderColor = 'rgba(255,255,255,0.07)'
                        el.style.boxShadow   = 'none'
                        el.style.background  = 'rgba(255,255,255,0.03)'
                      }}
                    >
                      <div style={{
                        width: '100%', height: '90px',
                        background: `linear-gradient(180deg, ${color}28, ${color}0d)`,
                        overflow: 'hidden',
                      }}>
                        {portrait && (
                          <img
                            src={portrait} alt={fighter.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        )}
                      </div>
                      <div style={{
                        padding: '6px 4px',
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: '0.7rem', fontWeight: 700,
                        letterSpacing: '0.5px', textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.75)', textAlign: 'center',
                      }}>{fighter.name}</div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

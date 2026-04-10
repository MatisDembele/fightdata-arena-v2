"""
Fight Data Arena — Nouveaux modes quiz
Lance depuis C:\\Users\\matis\\OneDrive\\Bureau\\FDA\\
"""
from pathlib import Path

FILES = {

"frontend/app/quiz/page.tsx": """
'use client'
import { useState, useEffect } from 'react'
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
    id: 'safecheck',
    label: 'SAFE CHECK',
    sub: 'Positif ou négatif on block ?',
    desc: 'Un move apparaît — est-il safe (positif/neutre) ou unsafe (négatif) on block ? Réfléchis vite.',
    color: '#ffe000', colorAlt: '#ff6a00',
    href: '/quiz/play?mode=safecheck',
    icon: '🛡️',
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
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px',
      }}>

        {!showFighters ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
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
              textAlign: 'center', marginBottom: '32px', minHeight: '44px',
              maxWidth: '480px',
            }}>
              <p style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '0.95rem', fontWeight: 500,
                color: 'rgba(255,255,255,0.45)', letterSpacing: '0.5px',
                transition: 'all 0.3s',
              }}>{current.desc}</p>
            </div>

            {/* Grille de modes */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '12px',
              width: '100%', maxWidth: '900px',
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
                      padding: '24px 20px',
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

                    <div style={{ fontSize: '1.8rem', marginBottom: '10px' }}>{mode.icon}</div>

                    <div style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: '1.3rem', letterSpacing: '3px',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                      textShadow: isActive ? `0 0 12px ${mode.color}` : 'none',
                      transition: 'all 0.25s',
                    }}>{mode.label}</div>

                    <div style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: '0.55rem', letterSpacing: '2px',
                      color: isActive ? mode.color : 'rgba(255,255,255,0.2)',
                      marginTop: '4px', lineHeight: 1.4,
                      transition: 'all 0.25s',
                    }}>{mode.sub}</div>

                    {isActive && (
                      <div style={{
                        marginTop: '12px',
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: '0.75rem', fontWeight: 700,
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
""",

"frontend/app/quiz/play/page.tsx": """
'use client'
import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getRandomQuiz, getFighterQuiz } from '@/lib/api'
import type { QuizQuestion } from '@/types'

type AnswerState = 'idle' | 'correct' | 'wrong'

// ── Helpers ──────────────────────────────────────────────────────────────────

const parseOnBlock = (val: string | undefined): number | null => {
  if (!val) return null
  const match = val.match(/^([+-]?\\d+)/)
  if (!match) return null
  return parseInt(match[1])
}

const isSafe = (val: string | undefined): boolean | null => {
  const n = parseOnBlock(val)
  if (n === null) return null
  return n >= 0
}

// ── Composant principal ───────────────────────────────────────────────────────

function QuizPlay() {
  const params = useSearchParams()
  const mode   = params.get('mode') || 'random'
  const slug   = params.get('slug') || ''

  const [question, setQuestion] = useState<QuizQuestion | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [state, setState]       = useState<AnswerState>('idle')
  const [score, setScore]       = useState(0)
  const [combo, setCombo]       = useState(0)
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [timeLeft, setTimeLeft] = useState(5)
  const [inputVal, setInputVal] = useState('')
  const timerRef                = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef                = useRef<HTMLInputElement>(null)

  const isHardcore  = mode === 'hardcore'
  const isInput     = mode === 'input'
  const isSafeCheck = mode === 'safecheck'

  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0

  const modeColor = {
    random:    '#ff2d78',
    fighter:   '#00f0ff',
    input:     '#9b1fff',
    safecheck: '#ffe000',
    hardcore:  '#ff6a00',
  }[mode] ?? '#ff2d78'

  const modeColorAlt = {
    random:    '#9b1fff',
    fighter:   '#0050ff',
    input:     '#ff2d78',
    safecheck: '#ff6a00',
    hardcore:  '#ff2d78',
  }[mode] ?? '#9b1fff'

  const loadQuestion = useCallback(async () => {
    setLoading(true)
    setSelected(null)
    setState('idle')
    setInputVal('')
    setTimeLeft(5)
    if (timerRef.current) clearInterval(timerRef.current)
    try {
      const q = (mode === 'fighter' && slug)
        ? await getFighterQuiz(slug)
        : await getRandomQuiz()
      setQuestion(q)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [mode, slug])

  useEffect(() => { loadQuestion() }, [loadQuestion])

  // Focus input en mode INPUT
  useEffect(() => {
    if (isInput && !loading && state === 'idle') {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isInput, loading, state, question])

  // Timer hardcore
  useEffect(() => {
    if (!isHardcore || state !== 'idle' || loading || !question) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          setState('wrong')
          setCombo(0)
          setTotal(n => n + 1)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isHardcore, state, loading, question])

  const handleCorrect = () => {
    setState('correct')
    setScore(s => s + 1)
    setCombo(s => s + 1)
    setTotal(t => t + 1)
  }

  const handleWrong = () => {
    setState('wrong')
    setCombo(0)
    setTotal(t => t + 1)
  }

  // Mode QCM classique
  const handleChoice = (choice: string) => {
    if (state !== 'idle') return
    if (timerRef.current) clearInterval(timerRef.current)
    setSelected(choice)
    choice === question?.answer ? handleCorrect() : handleWrong()
  }

  // Mode INPUT — soumission
  const handleInputSubmit = () => {
    if (state !== 'idle' || !inputVal.trim()) return
    const userVal  = inputVal.trim()
    const correct  = question?.answer ?? ''
    userVal === correct ? handleCorrect() : handleWrong()
    setSelected(userVal)
  }

  // Mode SAFE CHECK
  const handleSafeCheck = (userSafe: boolean) => {
    if (state !== 'idle' || !question) return
    const safe = isSafe(question.answer)
    if (safe === null) { loadQuestion(); return }
    setSelected(userSafe ? 'safe' : 'unsafe')
    userSafe === safe ? handleCorrect() : handleWrong()
  }

  // Couleur de choix QCM
  const choiceStyle = (choice: string): React.CSSProperties => {
    const base: React.CSSProperties = {
      padding: '11px 14px',
      display: 'flex', alignItems: 'center', gap: '10px',
      cursor: state === 'idle' ? 'pointer' : 'default',
      border: '1px solid rgba(255,255,255,0.09)',
      background: 'rgba(255,255,255,0.04)',
      transition: 'all 0.15s',
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: '0.88rem', color: 'rgba(255,255,255,0.75)',
      width: '100%', textAlign: 'left',
    }
    if (state === 'idle') return base
    if (choice === question?.answer) return { ...base, background: 'rgba(74,222,128,0.12)', border: '1px solid #4ade80', color: '#4ade80', boxShadow: '0 0 12px rgba(74,222,128,0.2)' }
    if (choice === selected) return { ...base, background: 'rgba(255,45,120,0.12)', border: '1px solid #ff2d78', color: '#ff2d78' }
    return { ...base, opacity: 0.3 }
  }

  const modeLabel = {
    random:    'RANDOM MODE',
    fighter:   `FIGHTER // ${slug.toUpperCase()}`,
    input:     'INPUT MODE',
    safecheck: 'SAFE CHECK',
    hardcore:  'HARDCORE',
  }[mode] ?? 'QUIZ'

  const safeValue = isSafe(question?.answer ?? '')

  return (
    <>
      <Navbar />
      <main style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '28px 20px', minHeight: 'calc(100vh - 60px)',
      }}>

        {/* Score bar */}
        <div style={{
          display: 'flex', gap: '36px', marginBottom: '24px',
          padding: '12px 36px',
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.07)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
            background: `linear-gradient(90deg, transparent, ${modeColor}, transparent)`,
          }} />
          {[
            { val: score,           label: 'SCORE' },
            { val: `${combo}🔥`,   label: 'COMBO' },
            { val: `${accuracy}%`, label: 'PRÉCISION' },
            { val: total,           label: 'JOUÉS' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.7rem', letterSpacing: '2px',
                background: `linear-gradient(180deg, #fff, ${modeColor})`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>{s.val}</div>
              <div style={{
                fontFamily: "'Share Tech Mono', monospace", fontSize: '0.52rem',
                letterSpacing: '3px', color: 'rgba(255,255,255,0.28)',
              }}>{s.label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.3)', letterSpacing: '4px' }}>
            CHARGEMENT...
          </div>
        ) : question && (
          <div style={{
            width: '100%', maxWidth: '500px',
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>

            {/* Header */}
            <div style={{
              padding: '11px 18px',
              background: `rgba(${modeColor === '#ff2d78' ? '255,45,120' : modeColor === '#00f0ff' ? '0,240,255' : modeColor === '#9b1fff' ? '155,31,255' : modeColor === '#ffe000' ? '255,224,0' : '255,106,0'}, 0.07)`,
              borderBottom: `1px solid ${modeColor}28`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{
                fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', letterSpacing: '4px',
                background: `linear-gradient(90deg, ${modeColor}, ${modeColorAlt})`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>{modeLabel}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {isHardcore && state === 'idle' && (
                  <span style={{
                    fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.3rem',
                    color: timeLeft <= 2 ? '#ff2d78' : '#ffe000',
                    textShadow: `0 0 10px ${timeLeft <= 2 ? '#ff2d78' : '#ffe000'}`,
                  }}>{timeLeft}s</span>
                )}
                <span style={{
                  fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem',
                  letterSpacing: '2px', color: modeColor, textTransform: 'uppercase',
                }}>{question.fighter_slug}</span>
              </div>
            </div>

            {/* Timer bar hardcore */}
            {isHardcore && state === 'idle' && (
              <div style={{ height: '2px', background: 'rgba(255,255,255,0.08)' }}>
                <div style={{
                  height: '100%', width: `${(timeLeft / 5) * 100}%`,
                  background: timeLeft <= 2 ? '#ff2d78' : '#ffe000',
                  transition: 'width 1s linear',
                  boxShadow: `0 0 6px ${timeLeft <= 2 ? '#ff2d78' : '#ffe000'}`,
                }} />
              </div>
            )}

            {/* GIF */}
            <div style={{
              height: '180px', background: 'rgba(255,255,255,0.03)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', position: 'relative',
            }}>
              {question.gif_url ? (
                <img src={question.gif_url} alt={question.move_name}
                  style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                />
              ) : (
                <span style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.15)', fontSize: '0.6rem', letterSpacing: '3px' }}>
                  HITBOX PREVIEW
                </span>
              )}
              {/* Coins décoratifs */}
              {[
                { top: '7px', left: '7px', borderTop: `1px solid ${modeColor}`, borderLeft: `1px solid ${modeColor}` },
                { top: '7px', right: '7px', borderTop: `1px solid ${modeColor}`, borderRight: `1px solid ${modeColor}` },
                { bottom: '7px', left: '7px', borderBottom: `1px solid ${modeColor}`, borderLeft: `1px solid ${modeColor}` },
                { bottom: '7px', right: '7px', borderBottom: `1px solid ${modeColor}`, borderRight: `1px solid ${modeColor}` },
              ].map((s, i) => (
                <div key={i} style={{ position: 'absolute', width: '10px', height: '10px', ...s }} />
              ))}
            </div>

            {/* Question */}
            <div style={{ padding: '16px 18px 12px' }}>
              {isSafeCheck ? (
                <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', fontWeight: 600, lineHeight: 1.4, color: 'rgba(255,255,255,0.9)' }}>
                  <strong style={{ color: '#fff' }}>{question.move_name}</strong> est-il{' '}
                  <span style={{ color: modeColor }}>safe ou unsafe</span> on block ?
                  {question.answer && (
                    <span style={{ display: 'block', marginTop: '4px', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>
                      On block : {question.answer}
                    </span>
                  )}
                </p>
              ) : (
                <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', fontWeight: 600, lineHeight: 1.4, color: 'rgba(255,255,255,0.9)' }}>
                  Quel est le <span style={{ color: modeColor }}>startup</span> de{' '}
                  <strong style={{ color: '#fff' }}>{question.move_name}</strong> ?
                </p>
              )}
            </div>

            {/* ── Contenu selon le mode ── */}
            <div style={{ padding: '0 18px' }}>

              {/* Mode QCM (random, fighter, hardcore) */}
              {!isInput && !isSafeCheck && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {question.choices.map((choice, i) => (
                    <button key={choice} onClick={() => handleChoice(choice)} style={choiceStyle(choice)}>
                      <span style={{
                        width: '20px', height: '20px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid rgba(255,255,255,0.18)', fontSize: '0.62rem',
                      }}>{String.fromCharCode(65 + i)}</span>
                      {choice} frames
                    </button>
                  ))}
                </div>
              )}

              {/* Mode INPUT */}
              {isInput && (
                <div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      ref={inputRef}
                      value={inputVal}
                      onChange={e => setInputVal(e.target.value.replace(/[^0-9]/g, ''))}
                      onKeyDown={e => e.key === 'Enter' && handleInputSubmit()}
                      disabled={state !== 'idle'}
                      placeholder="Ex: 4"
                      maxLength={3}
                      style={{
                        flex: 1, padding: '12px 14px',
                        background: state === 'idle' ? 'rgba(155,31,255,0.08)' : state === 'correct' ? 'rgba(74,222,128,0.1)' : 'rgba(255,45,120,0.1)',
                        border: `1px solid ${state === 'idle' ? 'rgba(155,31,255,0.4)' : state === 'correct' ? '#4ade80' : '#ff2d78'}`,
                        color: '#fff', outline: 'none',
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: '1.2rem', letterSpacing: '4px', textAlign: 'center',
                        transition: 'all 0.2s',
                      }}
                    />
                    <button
                      onClick={handleInputSubmit}
                      disabled={state !== 'idle' || !inputVal}
                      style={{
                        padding: '12px 20px',
                        background: state === 'idle' && inputVal ? 'linear-gradient(90deg, #9b1fff, #ff2d78)' : 'rgba(255,255,255,0.08)',
                        border: 'none', cursor: state === 'idle' && inputVal ? 'pointer' : 'default',
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: '0.85rem', letterSpacing: '3px', color: '#fff',
                        transition: 'all 0.2s',
                      }}
                    >OK</button>
                  </div>
                  <p style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)',
                    letterSpacing: '2px', marginTop: '8px',
                  }}>TAPE LA VALEUR EXACTE EN FRAMES → ENTRÉE</p>
                </div>
              )}

              {/* Mode SAFE CHECK */}
              {isSafeCheck && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleSafeCheck(true)}
                    disabled={state !== 'idle'}
                    style={{
                      flex: 1, padding: '20px 12px',
                      background: state === 'idle'
                        ? 'rgba(74,222,128,0.08)'
                        : selected === 'safe' && state === 'correct'
                        ? 'rgba(74,222,128,0.2)'
                        : safeValue === true && state !== 'idle'
                        ? 'rgba(74,222,128,0.2)'
                        : 'rgba(74,222,128,0.04)',
                      border: `1px solid ${
                        state === 'idle' ? 'rgba(74,222,128,0.3)'
                        : safeValue === true ? '#4ade80'
                        : 'rgba(74,222,128,0.1)'
                      }`,
                      cursor: state === 'idle' ? 'pointer' : 'default',
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: '1.4rem', letterSpacing: '4px',
                      color: safeValue === true && state !== 'idle' ? '#4ade80' : 'rgba(74,222,128,0.8)',
                      transition: 'all 0.2s',
                      boxShadow: state === 'idle' ? '0 0 12px rgba(74,222,128,0.1)' : safeValue === true && state !== 'idle' ? '0 0 20px rgba(74,222,128,0.3)' : 'none',
                    }}
                  >
                    ✓ SAFE
                    <div style={{ fontSize: '0.6rem', letterSpacing: '2px', marginTop: '4px', opacity: 0.6 }}>≥ 0 ON BLOCK</div>
                  </button>
                  <button
                    onClick={() => handleSafeCheck(false)}
                    disabled={state !== 'idle'}
                    style={{
                      flex: 1, padding: '20px 12px',
                      background: state === 'idle'
                        ? 'rgba(255,45,120,0.08)'
                        : selected === 'unsafe' && state === 'correct'
                        ? 'rgba(255,45,120,0.2)'
                        : safeValue === false && state !== 'idle'
                        ? 'rgba(255,45,120,0.2)'
                        : 'rgba(255,45,120,0.04)',
                      border: `1px solid ${
                        state === 'idle' ? 'rgba(255,45,120,0.3)'
                        : safeValue === false ? '#ff2d78'
                        : 'rgba(255,45,120,0.1)'
                      }`,
                      cursor: state === 'idle' ? 'pointer' : 'default',
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: '1.4rem', letterSpacing: '4px',
                      color: safeValue === false && state !== 'idle' ? '#ff2d78' : 'rgba(255,45,120,0.8)',
                      transition: 'all 0.2s',
                      boxShadow: state === 'idle' ? '0 0 12px rgba(255,45,120,0.1)' : safeValue === false && state !== 'idle' ? '0 0 20px rgba(255,45,120,0.3)' : 'none',
                    }}
                  >
                    ✗ UNSAFE
                    <div style={{ fontSize: '0.6rem', letterSpacing: '2px', marginTop: '4px', opacity: 0.6 }}>{'< 0 ON BLOCK'}</div>
                  </button>
                </div>
              )}
            </div>

            {/* Feedback + bouton suivant */}
            <div style={{ padding: '12px 18px 18px' }}>
              {state !== 'idle' && (
                <div style={{
                  padding: '9px 14px', marginBottom: '10px',
                  background: state === 'correct' ? 'rgba(74,222,128,0.1)' : 'rgba(255,45,120,0.1)',
                  border: `1px solid ${state === 'correct' ? '#4ade80' : '#ff2d78'}`,
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '0.9rem', fontWeight: 700,
                  color: state === 'correct' ? '#4ade80' : '#ff2d78',
                }}>
                  {isSafeCheck ? (
                    state === 'correct'
                      ? `✓ Correct ! ${question.move_name} est ${safeValue ? 'SAFE' : 'UNSAFE'} (${question.answer} on block)`
                      : `✗ Raté ! ${question.move_name} est ${safeValue ? 'SAFE' : 'UNSAFE'} (${question.answer} on block)`
                  ) : isInput ? (
                    state === 'correct'
                      ? `✓ Exact ! Startup : ${question.answer} frames.`
                      : `✗ Raté ! La réponse était ${question.answer} frames (tu as mis : ${selected}).`
                  ) : (
                    state === 'correct'
                      ? `✓ Correct ! Startup : ${question.answer} frames.`
                      : timeLeft === 0
                      ? `⏱ Temps écoulé ! Réponse : ${question.answer} frames.`
                      : `✗ Raté ! Réponse : ${question.answer} frames.`
                  )}
                </div>
              )}
              <button onClick={loadQuestion} style={{
                width: '100%', padding: '13px',
                background: `linear-gradient(90deg, ${modeColorAlt}, ${modeColor})`,
                border: 'none', cursor: 'pointer',
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '0.95rem', letterSpacing: '4px', color: '#fff',
                boxShadow: `0 0 16px ${modeColor}33`,
                transition: 'all 0.2s',
              }}>
                {state === 'idle' ? 'PASSER →' : 'QUESTION SUIVANTE →'}
              </button>
            </div>

          </div>
        )}

        <Link href="/quiz" style={{
          marginTop: '16px',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '0.6rem', letterSpacing: '3px',
          color: 'rgba(255,255,255,0.2)', textDecoration: 'none',
        }}>← CHANGER DE MODE</Link>

      </main>
    </>
  )
}

export default function QuizPlayPage() {
  return <Suspense><QuizPlay /></Suspense>
}
""",

}

BASE = Path(".")
print("Fight Data Arena — Nouveaux modes quiz\n")
for path, content in FILES.items():
    full = BASE / path
    full.parent.mkdir(parents=True, exist_ok=True)
    full.write_text(content.lstrip('\n'), encoding='utf-8')
    print(f"  ✅ {path}")

print("\n✅ Fait !")
print("  git add -A && git commit -m 'add INPUT and SAFE CHECK quiz modes' && git push")

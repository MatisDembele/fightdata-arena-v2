"""
Fight Data Arena — Setup Frontend Quiz
========================================
Lance depuis C:\\Users\\matis\\OneDrive\\Bureau\\FDA\\
Crée tous les fichiers du frontend pour le quiz.

Usage :
  py setup_frontend.py
"""

from pathlib import Path

FILES = {

# ── Types TypeScript ──────────────────────────────────────────
"frontend/types/index.ts": """
export interface Fighter {
  id: number
  name: string
  slug: string
  created_at: string
  stats: Record<string, string>
}

export interface Move {
  id: number
  fighter_id: number
  section: string
  move_name: string
  input?: string
  startup?: string
  active?: string
  recovery?: string
  total_frames?: string
  on_hit?: string
  on_block?: string
  damage?: string
  guard?: string
  cancel?: string
  notes?: string
  gif_url?: string
  gif_path?: string
}

export interface QuizQuestion {
  move_name: string
  section: string
  gif_url?: string
  gif_path?: string
  question: string
  choices: string[]
  answer: string
  fighter_slug: string
}
""",

# ── API client ────────────────────────────────────────────────
"frontend/lib/api.ts": """
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function getFighters() {
  const res = await fetch(`${API_URL}/api/fighters/`)
  if (!res.ok) throw new Error('Erreur chargement fighters')
  return res.json()
}

export async function getFighter(slug: string) {
  const res = await fetch(`${API_URL}/api/fighters/${slug}`)
  if (!res.ok) throw new Error('Fighter introuvable')
  return res.json()
}

export async function getFighterMoves(slug: string, section?: string) {
  const url = section
    ? `${API_URL}/api/fighters/${slug}/moves?section=${section}`
    : `${API_URL}/api/fighters/${slug}/moves`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Erreur chargement moves')
  return res.json()
}

export async function getRandomQuiz() {
  const res = await fetch(`${API_URL}/api/quiz/random`)
  if (!res.ok) throw new Error('Erreur quiz')
  return res.json()
}

export async function getFighterQuiz(slug: string) {
  const res = await fetch(`${API_URL}/api/quiz/${slug}/startup`)
  if (!res.ok) throw new Error('Erreur quiz fighter')
  return res.json()
}
""",

# ── Variables CSS globales SF6 ────────────────────────────────
"frontend/app/globals.css": """
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap');
@import "tailwindcss";

:root {
  --pink:   #ff2d78;
  --purple: #9b1fff;
  --orange: #ff6a00;
  --yellow: #ffe000;
  --cyan:   #00f0ff;
  --dark:   #0d0010;
  --dark2:  #130020;
  --dark3:  #1a0030;
  --border: rgba(255,255,255,0.08);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--dark);
  color: #fff;
  font-family: 'Rajdhani', sans-serif;
  min-height: 100vh;
}

/* Background SF6 */
.sf6-bg {
  position: fixed; inset: 0; z-index: 0;
  background:
    radial-gradient(ellipse 80% 60% at 20% 50%, rgba(155,31,255,0.4) 0%, transparent 60%),
    radial-gradient(ellipse 70% 70% at 80% 30%, rgba(255,45,120,0.35) 0%, transparent 55%),
    radial-gradient(ellipse 60% 50% at 60% 80%, rgba(255,106,0,0.25) 0%, transparent 50%),
    linear-gradient(135deg, #0d0010 0%, #1a0030 40%, #0d0015 100%);
}

.sf6-grid {
  position: fixed; inset: 0; z-index: 1;
  background-image:
    linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* Utilitaires */
.font-bebas { font-family: 'Bebas Neue', sans-serif; }
.font-mono  { font-family: 'Share Tech Mono', monospace; }
.font-raj   { font-family: 'Rajdhani', sans-serif; }

.text-gradient {
  background: linear-gradient(90deg, #fff 0%, var(--yellow) 50%, var(--pink) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.glow-pink  { filter: drop-shadow(0 0 12px rgba(255,45,120,0.6)); }
.glow-cyan  { filter: drop-shadow(0 0 12px rgba(0,240,255,0.5)); }
.glow-gold  { filter: drop-shadow(0 0 12px rgba(255,224,0,0.5)); }

.border-gradient {
  border: 1px solid transparent;
  background-clip: padding-box;
  position: relative;
}
""",

# ── Layout racine ─────────────────────────────────────────────
"frontend/app/layout.tsx": """
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fight Data Arena',
  description: 'Frame data Street Fighter 6 — Quiz & Database',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="sf6-bg" />
        <div className="sf6-grid" />
        <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh' }}>
          {children}
        </div>
      </body>
    </html>
  )
}
""",

# ── Navbar ────────────────────────────────────────────────────
"frontend/components/Navbar.tsx": """
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/',         label: 'ACCUEIL' },
  { href: '/quiz',     label: 'QUIZ' },
  { href: '/fighters', label: 'DATABASE' },
]

export default function Navbar() {
  const path = usePathname()

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 40px', height: '64px',
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      position: 'relative',
    }}>
      {/* Ligne gradient bas */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
        background: 'linear-gradient(90deg, var(--purple), var(--pink), var(--orange), var(--yellow))',
      }} />

      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none' }}>
        <span className="font-bebas" style={{
          fontSize: '1.6rem', letterSpacing: '6px',
          background: 'linear-gradient(90deg, #fff 0%, var(--yellow) 50%, var(--pink) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          FIGHT DATA ARENA
        </span>
      </Link>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {links.map(link => (
          <Link key={link.href} href={link.href} style={{
            padding: '8px 24px', textDecoration: 'none',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '0.95rem', letterSpacing: '3px',
            color: path === link.href ? 'var(--yellow)' : 'rgba(255,255,255,0.5)',
            borderBottom: path === link.href ? '2px solid var(--yellow)' : '2px solid transparent',
            transition: 'all 0.2s',
          }}>
            {link.label}
          </Link>
        ))}
      </div>

      {/* Badge patch */}
      <span className="font-mono" style={{
        fontSize: '0.65rem', letterSpacing: '2px',
        color: 'rgba(255,255,255,0.35)',
        border: '1px solid rgba(255,255,255,0.12)',
        padding: '4px 12px',
      }}>
        SF6 // 2026
      </span>
    </nav>
  )
}
""",

# ── Page d'accueil ────────────────────────────────────────────
"frontend/app/page.tsx": """
import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function Home() {
  return (
    <>
      <Navbar />
      <main style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: 'calc(100vh - 64px)',
        textAlign: 'center', padding: '40px',
      }}>

        <h1 className="font-bebas" style={{
          fontSize: 'clamp(3rem, 10vw, 7rem)',
          letterSpacing: '8px', lineHeight: '0.9',
          background: 'linear-gradient(180deg, #fff 0%, var(--pink) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 30px rgba(255,45,120,0.4))',
          marginBottom: '16px',
        }}>
          FIGHT DATA<br />ARENA
        </h1>

        <p className="font-raj" style={{
          fontSize: '1.1rem', letterSpacing: '4px', fontWeight: 600,
          color: 'rgba(255,255,255,0.4)', marginBottom: '48px',
        }}>
          STREET FIGHTER 6 // FRAME DATA
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/quiz" style={{
            padding: '16px 40px', textDecoration: 'none',
            background: 'linear-gradient(90deg, var(--purple), var(--pink))',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '1.1rem', letterSpacing: '4px', color: '#fff',
            boxShadow: '0 0 30px rgba(255,45,120,0.4)',
            transition: 'all 0.2s',
          }}>
            JOUER AU QUIZ
          </Link>

          <Link href="/fighters" style={{
            padding: '16px 40px', textDecoration: 'none',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '1.1rem', letterSpacing: '4px', color: '#fff',
            transition: 'all 0.2s',
          }}>
            BASE DE DONNÉES
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '40px', marginTop: '64px' }}>
          {[
            { val: '29', label: 'PERSONNAGES' },
            { val: '1418', label: 'MOVES' },
            { val: 'SF6', label: 'PATCH 2026' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div className="font-bebas" style={{
                fontSize: '2.5rem', letterSpacing: '2px',
                background: 'linear-gradient(180deg, var(--cyan), var(--purple))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>{s.val}</div>
              <div className="font-mono" style={{
                fontSize: '0.6rem', letterSpacing: '3px',
                color: 'rgba(255,255,255,0.3)',
              }}>{s.label}</div>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
""",

# ── Page Quiz ─────────────────────────────────────────────────
"frontend/app/quiz/page.tsx": """
'use client'
import { useState, useEffect, useCallback } from 'react'
import Navbar from '@/components/Navbar'
import { getRandomQuiz } from '@/lib/api'
import type { QuizQuestion } from '@/types'

type AnswerState = 'idle' | 'correct' | 'wrong'

export default function QuizPage() {
  const [question, setQuestion]   = useState<QuizQuestion | null>(null)
  const [selected, setSelected]   = useState<string | null>(null)
  const [state, setState]         = useState<AnswerState>('idle')
  const [score, setScore]         = useState(0)
  const [streak, setStreak]       = useState(0)
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)

  const loadQuestion = useCallback(async () => {
    setLoading(true)
    setSelected(null)
    setState('idle')
    try {
      const q = await getRandomQuiz()
      setQuestion(q)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadQuestion() }, [loadQuestion])

  const handleChoice = (choice: string) => {
    if (state !== 'idle') return
    setSelected(choice)
    setTotal(t => t + 1)
    if (choice === question?.answer) {
      setState('correct')
      setScore(s => s + 1)
      setStreak(s => s + 1)
    } else {
      setState('wrong')
      setStreak(0)
    }
  }

  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0

  const choiceStyle = (choice: string) => {
    const base: React.CSSProperties = {
      padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: '12px',
      cursor: state === 'idle' ? 'pointer' : 'default',
      border: '1px solid rgba(255,255,255,0.1)',
      background: 'rgba(255,255,255,0.04)',
      transition: 'all 0.15s',
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: '0.9rem',
      color: 'rgba(255,255,255,0.8)',
    }
    if (state === 'idle') return base
    if (choice === question?.answer) return {
      ...base, background: 'rgba(74,222,128,0.12)',
      border: '1px solid #4ade80', color: '#4ade80',
      boxShadow: '0 0 16px rgba(74,222,128,0.2)',
    }
    if (choice === selected && choice !== question?.answer) return {
      ...base, background: 'rgba(255,45,120,0.12)',
      border: '1px solid var(--pink)', color: 'var(--pink)',
      boxShadow: '0 0 16px rgba(255,45,120,0.2)',
    }
    return { ...base, opacity: 0.4 }
  }

  return (
    <>
      <Navbar />
      <main style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '40px 20px', minHeight: 'calc(100vh - 64px)',
      }}>

        {/* Score bar */}
        <div style={{
          display: 'flex', gap: '40px', marginBottom: '32px',
          padding: '16px 40px',
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          {[
            { val: score,             label: 'SCORE' },
            { val: `${streak}🔥`,    label: 'STREAK' },
            { val: `${accuracy}%`,   label: 'PRÉCISION' },
            { val: total,             label: 'JOUÉS' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div className="font-bebas" style={{
                fontSize: '1.8rem', letterSpacing: '2px',
                background: 'linear-gradient(180deg, #fff, var(--yellow))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>{s.val}</div>
              <div className="font-mono" style={{
                fontSize: '0.55rem', letterSpacing: '3px',
                color: 'rgba(255,255,255,0.3)',
              }}>{s.label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="font-mono" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '4px' }}>
            CHARGEMENT...
          </div>
        ) : question && (
          <div style={{
            width: '100%', maxWidth: '520px',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}>

            {/* Header perso */}
            <div style={{
              padding: '12px 20px',
              background: 'rgba(255,45,120,0.08)',
              borderBottom: '1px solid rgba(255,45,120,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span className="font-bebas" style={{
                fontSize: '1rem', letterSpacing: '4px',
                background: 'linear-gradient(90deg, var(--pink), var(--orange))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>// QUIZ MODE</span>
              <span className="font-mono" style={{
                fontSize: '0.7rem', letterSpacing: '2px',
                color: 'var(--cyan)', textTransform: 'uppercase',
              }}>{question.fighter_slug}</span>
            </div>

            {/* GIF */}
            <div style={{
              height: '200px', position: 'relative',
              background: 'rgba(255,255,255,0.03)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {question.gif_url ? (
                <img
                  src={question.gif_url}
                  alt={question.move_name}
                  style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                />
              ) : (
                <span className="font-mono" style={{
                  color: 'rgba(255,255,255,0.15)', fontSize: '0.65rem', letterSpacing: '3px',
                }}>HITBOX PREVIEW</span>
              )}
              {/* Coins décoratifs */}
              {['top:8px;left:8px;border-top:1px solid var(--pink);border-left:1px solid var(--pink)',
                'top:8px;right:8px;border-top:1px solid var(--pink);border-right:1px solid var(--pink)',
                'bottom:8px;left:8px;border-bottom:1px solid var(--pink);border-left:1px solid var(--pink)',
                'bottom:8px;right:8px;border-bottom:1px solid var(--pink);border-right:1px solid var(--pink)',
              ].map((s, i) => (
                <div key={i} style={{
                  position: 'absolute', width: '12px', height: '12px',
                  ...Object.fromEntries(s.split(';').map(p => {
                    const [k, v] = p.split(':')
                    return [k.trim().replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase()), v?.trim()]
                  }))
                }} />
              ))}
            </div>

            {/* Question */}
            <div style={{ padding: '20px 20px 16px' }}>
              <p className="font-raj" style={{
                fontSize: '1rem', fontWeight: 600, lineHeight: 1.5,
                color: 'rgba(255,255,255,0.85)',
              }}>
                Quel est le <span style={{ color: 'var(--cyan)' }}>startup</span> de{' '}
                <span style={{ color: '#fff', fontWeight: 700 }}>{question.move_name}</span> ?
              </p>
            </div>

            {/* Choix */}
            <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {question.choices.map((choice, i) => (
                <button
                  key={choice}
                  onClick={() => handleChoice(choice)}
                  style={choiceStyle(choice)}
                >
                  <span style={{
                    width: '22px', height: '22px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.2)',
                    fontSize: '0.65rem',
                  }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {choice} frames
                </button>
              ))}
            </div>

            {/* Feedback + bouton suivant */}
            <div style={{ padding: '16px 20px 20px' }}>
              {state !== 'idle' && (
                <div style={{
                  padding: '10px 16px', marginBottom: '12px',
                  background: state === 'correct'
                    ? 'rgba(74,222,128,0.1)' : 'rgba(255,45,120,0.1)',
                  border: `1px solid ${state === 'correct' ? '#4ade80' : 'var(--pink)'}`,
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '0.95rem', fontWeight: 700,
                  color: state === 'correct' ? '#4ade80' : 'var(--pink)',
                }}>
                  {state === 'correct'
                    ? `✓ Correct ! ${question.move_name} a un startup de ${question.answer} frames.`
                    : `✗ Raté ! La bonne réponse était ${question.answer} frames.`
                  }
                </div>
              )}

              <button
                onClick={loadQuestion}
                style={{
                  width: '100%', padding: '14px',
                  background: 'linear-gradient(90deg, var(--purple), var(--pink))',
                  border: 'none', cursor: 'pointer',
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '1rem', letterSpacing: '4px', color: '#fff',
                  boxShadow: '0 0 20px rgba(255,45,120,0.3)',
                }}
              >
                {state === 'idle' ? 'PASSER →' : 'QUESTION SUIVANTE →'}
              </button>
            </div>

          </div>
        )}
      </main>
    </>
  )
}
""",

# ── Page Fighters (placeholder) ───────────────────────────────
"frontend/app/fighters/page.tsx": """
import Navbar from '@/components/Navbar'

export default function FightersPage() {
  return (
    <>
      <Navbar />
      <main style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: 'calc(100vh - 64px)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 className="font-bebas" style={{
            fontSize: '3rem', letterSpacing: '6px',
            color: 'rgba(255,255,255,0.2)',
          }}>BASE DE DONNÉES</h1>
          <p className="font-mono" style={{
            color: 'rgba(255,255,255,0.2)', letterSpacing: '3px', fontSize: '0.7rem',
            marginTop: '12px',
          }}>COMING SOON</p>
        </div>
      </main>
    </>
  )
}
""",

# ── .env.local ────────────────────────────────────────────────
"frontend/.env.local": """NEXT_PUBLIC_API_URL=http://localhost:8000
""",

}

BASE = Path(".")

print("Fight Data Arena — Création du frontend\n")

for relative_path, content in FILES.items():
  full_path = BASE / relative_path
  full_path.parent.mkdir(parents=True, exist_ok=True)
  full_path.write_text(content.lstrip('\n'), encoding="utf-8")
  print(f"  ✅ {relative_path}")

print("\n✅ Frontend créé !")
print("\nProchaine étape :")
print("  cd frontend && npm run dev")
print("  Ouvre http://localhost:3000/quiz")

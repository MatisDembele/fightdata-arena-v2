'use client'
import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getRandomQuiz, getFighterQuiz } from '@/lib/api'
import type { QuizQuestion } from '@/types'

type AnswerState = 'idle' | 'correct' | 'wrong'

function QuizPlay() {
  const params      = useSearchParams()
  const mode        = params.get('mode') || 'random'
  const slug        = params.get('slug') || ''

  const [question, setQuestion] = useState<QuizQuestion | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [state, setState]       = useState<AnswerState>('idle')
  const [score, setScore]       = useState(0)
  const [combo, setCombo]       = useState(0)
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [timeLeft, setTimeLeft] = useState(5)
  const timerRef                = useRef<NodeJS.Timeout | null>(null)

  const isHardcore = mode === 'hardcore'

  const loadQuestion = useCallback(async () => {
    setLoading(true)
    setSelected(null)
    setState('idle')
    setTimeLeft(5)
    if (timerRef.current) clearInterval(timerRef.current)
    try {
      const q = mode === 'fighter' && slug
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

  const handleChoice = (choice: string) => {
    if (state !== 'idle') return
    if (timerRef.current) clearInterval(timerRef.current)
    setSelected(choice)
    setTotal(t => t + 1)
    if (choice === question?.answer) {
      setState('correct')
      setScore(s => s + 1)
      setCombo(s => s + 1)
    } else {
      setState('wrong')
      setCombo(0)
    }
  }

  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0

  const modeColor = mode === 'hardcore' ? '#ffe000'
    : mode === 'fighter' ? '#00f0ff'
    : '#ff2d78'

  const choiceStyle = (choice: string): React.CSSProperties => {
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
      width: '100%', textAlign: 'left',
    }
    if (state === 'idle') return base
    if (choice === question?.answer) return {
      ...base, background: 'rgba(74,222,128,0.12)',
      border: '1px solid #4ade80', color: '#4ade80',
      boxShadow: '0 0 16px rgba(74,222,128,0.2)',
    }
    if (choice === selected) return {
      ...base, background: 'rgba(255,45,120,0.12)',
      border: '1px solid #ff2d78', color: '#ff2d78',
    }
    return { ...base, opacity: 0.35 }
  }

  const modeLabel = mode === 'fighter' ? `FIGHTER // ${slug.toUpperCase()}`
    : mode === 'hardcore' ? 'HARDCORE MODE'
    : 'RANDOM MODE'

  return (
    <>
      <Navbar />
      <main style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '32px 20px', minHeight: 'calc(100vh - 64px)',
      }}>

        {/* Score bar */}
        <div style={{
          display: 'flex', gap: '40px', marginBottom: '28px',
          padding: '14px 40px',
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.07)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
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
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '1.8rem', letterSpacing: '2px',
                background: `linear-gradient(180deg, #fff, ${modeColor})`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>{s.val}</div>
              <div style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.55rem', letterSpacing: '3px',
                color: 'rgba(255,255,255,0.3)',
              }}>{s.label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            color: 'rgba(255,255,255,0.3)', letterSpacing: '4px',
          }}>CHARGEMENT...</div>
        ) : question && (
          <div style={{
            width: '100%', maxWidth: '520px',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>

            {/* Header */}
            <div style={{
              padding: '12px 20px',
              background: `rgba(${mode === 'hardcore' ? '255,224,0' : mode === 'fighter' ? '0,240,255' : '255,45,120'}, 0.07)`,
              borderBottom: `1px solid rgba(${mode === 'hardcore' ? '255,224,0' : mode === 'fighter' ? '0,240,255' : '255,45,120'}, 0.2)`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '0.95rem', letterSpacing: '4px',
                background: `linear-gradient(90deg, ${modeColor}, ${mode === 'hardcore' ? '#ff6a00' : mode === 'fighter' ? '#0050ff' : '#9b1fff'})`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>{modeLabel}</span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {isHardcore && state === 'idle' && (
                  <span style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: '1.4rem',
                    color: timeLeft <= 2 ? '#ff2d78' : '#ffe000',
                    textShadow: `0 0 12px ${timeLeft <= 2 ? '#ff2d78' : '#ffe000'}`,
                  }}>{timeLeft}s</span>
                )}
                <span style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '0.7rem', letterSpacing: '2px',
                  color: modeColor, textTransform: 'uppercase',
                }}>{question.fighter_slug}</span>
              </div>
            </div>

            {/* Timer bar hardcore */}
            {isHardcore && state === 'idle' && (
              <div style={{ height: '3px', background: 'rgba(255,255,255,0.1)' }}>
                <div style={{
                  height: '100%',
                  width: `${(timeLeft / 5) * 100}%`,
                  background: timeLeft <= 2
                    ? 'linear-gradient(90deg, #ff2d78, #ff2d78)'
                    : 'linear-gradient(90deg, #ffe000, #ff6a00)',
                  transition: 'width 1s linear, background 0.3s',
                  boxShadow: `0 0 8px ${timeLeft <= 2 ? '#ff2d78' : '#ffe000'}`,
                }} />
              </div>
            )}

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
                <span style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  color: 'rgba(255,255,255,0.15)', fontSize: '0.65rem', letterSpacing: '3px',
                }}>HITBOX PREVIEW</span>
              )}
              {/* Coins */}
              {[
                { top: '8px', left: '8px', borderTop: `1px solid ${modeColor}`, borderLeft: `1px solid ${modeColor}` },
                { top: '8px', right: '8px', borderTop: `1px solid ${modeColor}`, borderRight: `1px solid ${modeColor}` },
                { bottom: '8px', left: '8px', borderBottom: `1px solid ${modeColor}`, borderLeft: `1px solid ${modeColor}` },
                { bottom: '8px', right: '8px', borderBottom: `1px solid ${modeColor}`, borderRight: `1px solid ${modeColor}` },
              ].map((s, i) => (
                <div key={i} style={{ position: 'absolute', width: '12px', height: '12px', ...s }} />
              ))}
            </div>

            {/* Question */}
            <div style={{ padding: '18px 20px 14px' }}>
              <p style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '1rem', fontWeight: 600, lineHeight: 1.5,
                color: 'rgba(255,255,255,0.9)',
              }}>
                Quel est le <span style={{ color: modeColor }}>startup</span> de{' '}
                <strong style={{ color: '#fff' }}>{question.move_name}</strong> ?
              </p>
            </div>

            {/* Choix */}
            <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {question.choices.map((choice, i) => (
                <button key={choice} onClick={() => handleChoice(choice)} style={choiceStyle(choice)}>
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

            {/* Feedback + bouton */}
            <div style={{ padding: '14px 20px 20px' }}>
              {state !== 'idle' && (
                <div style={{
                  padding: '10px 16px', marginBottom: '10px',
                  background: state === 'correct' ? 'rgba(74,222,128,0.1)' : 'rgba(255,45,120,0.1)',
                  border: `1px solid ${state === 'correct' ? '#4ade80' : '#ff2d78'}`,
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '0.9rem', fontWeight: 700,
                  color: state === 'correct' ? '#4ade80' : '#ff2d78',
                }}>
                  {state === 'correct'
                    ? `✓ Correct ! Startup : ${question.answer} frames.`
                    : timeLeft === 0
                    ? `⏱ Temps écoulé ! Réponse : ${question.answer} frames.`
                    : `✗ Raté ! Réponse : ${question.answer} frames.`
                  }
                </div>
              )}
              <button onClick={loadQuestion} style={{
                width: '100%', padding: '14px',
                background: `linear-gradient(90deg, ${mode === 'hardcore' ? '#ff6a00, #ffe000' : mode === 'fighter' ? '#0050ff, #00f0ff' : 'var(--purple), var(--pink)'})`,
                border: 'none', cursor: 'pointer',
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '1rem', letterSpacing: '4px', color: '#fff',
                boxShadow: `0 0 20px ${modeColor}44`,
              }}>
                {state === 'idle' ? 'PASSER →' : 'QUESTION SUIVANTE →'}
              </button>
            </div>

          </div>
        )}

        {/* Retour au choix de mode */}
        <Link href="/quiz" style={{
          marginTop: '20px',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '0.65rem', letterSpacing: '3px',
          color: 'rgba(255,255,255,0.25)',
          textDecoration: 'none',
        }}>← CHANGER DE MODE</Link>

      </main>
    </>
  )
}

export default function QuizPlayPage() {
  return (
    <Suspense>
      <QuizPlay />
    </Suspense>
  )
}

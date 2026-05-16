'use client'
import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getRandomQuiz, getFighterQuiz, getRandomPunish } from '@/lib/api'
import type { QuizQuestion } from '@/types'

type AnswerState = 'idle' | 'correct' | 'wrong'

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

  const isHardcore = mode === 'hardcore'
  const isInput    = mode === 'input'
  const isPunish   = mode === 'punish'

  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0

  const modeColor = {
    random:   '#ff2d78',
    fighter:  '#00f0ff',
    input:    '#9b1fff',
    punish:   '#ffe000',
    hardcore: '#ff6a00',
  }[mode] ?? '#ff2d78'

  const modeColorAlt = {
    random:   '#9b1fff',
    fighter:  '#0050ff',
    input:    '#ff2d78',
    punish:   '#ff6a00',
    hardcore: '#ff2d78',
  }[mode] ?? '#9b1fff'

  const loadQuestion = useCallback(async () => {
    setLoading(true)
    setSelected(null)
    setState('idle')
    setInputVal('')
    setTimeLeft(5)
    if (timerRef.current) clearInterval(timerRef.current)
    try {
      const q = isPunish
        ? await getRandomPunish()
        : (mode === 'fighter' && slug)
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

  // Mode PUNISH FINDER
  const handlePunish = (userAnswer: 'punissable' | 'safe') => {
    if (state !== 'idle' || !question) return
    setSelected(userAnswer)
    userAnswer === question.answer ? handleCorrect() : handleWrong()
  }

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
    random:   'RANDOM MODE',
    fighter:  `FIGHTER // ${slug.toUpperCase()}`,
    input:    'INPUT MODE',
    punish:   'PUNISH FINDER',
    hardcore: 'HARDCORE',
  }[mode] ?? 'QUIZ'

  const isPunishable = question?.answer === 'punissable'

  return (
    <>
      <Navbar />
      <main style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '28px 20px', minHeight: 'calc(100vh - 60px)',
      }}>

        {/* Score bar */}
        <div className="score-bar">
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
              {isPunish ? (
                <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', fontWeight: 600, lineHeight: 1.4, color: 'rgba(255,255,255,0.9)' }}>
                  <strong style={{ color: '#fff' }}>{question.move_name}</strong> est-il{' '}
                  <span style={{ color: modeColor }}>punissable on block ?</span>
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
              {!isInput && !isPunish && (
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

              {/* Mode PUNISH FINDER */}
              {isPunish && (
                <div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handlePunish('punissable')}
                      disabled={state !== 'idle'}
                      style={{
                        flex: 1, padding: '20px 12px',
                        background: state === 'idle'
                          ? 'rgba(255,45,120,0.08)'
                          : isPunishable
                          ? 'rgba(255,45,120,0.2)'
                          : 'rgba(255,45,120,0.04)',
                        border: `1px solid ${
                          state === 'idle' ? 'rgba(255,45,120,0.3)'
                          : isPunishable ? '#ff2d78'
                          : 'rgba(255,45,120,0.1)'
                        }`,
                        cursor: state === 'idle' ? 'pointer' : 'default',
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: '1.4rem', letterSpacing: '4px',
                        color: state !== 'idle' && isPunishable ? '#ff2d78' : 'rgba(255,45,120,0.8)',
                        transition: 'all 0.2s',
                        boxShadow: state === 'idle'
                          ? '0 0 12px rgba(255,45,120,0.1)'
                          : isPunishable ? '0 0 20px rgba(255,45,120,0.3)' : 'none',
                      }}
                    >
                      💀 PUNISSABLE
                      <div style={{ fontSize: '0.6rem', letterSpacing: '2px', marginTop: '4px', opacity: 0.6 }}>{'≤ -4 ON BLOCK'}</div>
                    </button>
                    <button
                      onClick={() => handlePunish('safe')}
                      disabled={state !== 'idle'}
                      style={{
                        flex: 1, padding: '20px 12px',
                        background: state === 'idle'
                          ? 'rgba(74,222,128,0.08)'
                          : !isPunishable
                          ? 'rgba(74,222,128,0.2)'
                          : 'rgba(74,222,128,0.04)',
                        border: `1px solid ${
                          state === 'idle' ? 'rgba(74,222,128,0.3)'
                          : !isPunishable ? '#4ade80'
                          : 'rgba(74,222,128,0.1)'
                        }`,
                        cursor: state === 'idle' ? 'pointer' : 'default',
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: '1.4rem', letterSpacing: '4px',
                        color: state !== 'idle' && !isPunishable ? '#4ade80' : 'rgba(74,222,128,0.8)',
                        transition: 'all 0.2s',
                        boxShadow: state === 'idle'
                          ? '0 0 12px rgba(74,222,128,0.1)'
                          : !isPunishable ? '0 0 20px rgba(74,222,128,0.3)' : 'none',
                      }}
                    >
                      ✓ SAFE
                      <div style={{ fontSize: '0.6rem', letterSpacing: '2px', marginTop: '4px', opacity: 0.6 }}>{'-3 à +∞ ON BLOCK'}</div>
                    </button>
                  </div>
                  <p style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: '0.52rem', color: 'rgba(255,255,255,0.18)',
                    letterSpacing: '1.5px', marginTop: '8px', textAlign: 'center',
                  }}>HORS CAS DE PUSHBACK EXTRÊME</p>
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
                  {isPunish ? (
                    state === 'correct'
                      ? `✓ Correct ! ${question.move_name} est ${isPunishable ? 'PUNISSABLE' : 'SAFE'} (on block : ${question.on_block_value})`
                      : `✗ Raté ! ${question.move_name} est ${isPunishable ? 'PUNISSABLE' : 'SAFE'} (on block : ${question.on_block_value})`
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

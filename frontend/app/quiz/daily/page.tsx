'use client'
import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getDailyQuiz } from '@/lib/api'
import type { QuizQuestion } from '@/types'

const COLOR     = '#00ff88'
const COLOR_ALT = '#00b894'

type Phase       = 'intro' | 'playing' | 'finished'
type AnswerState = 'idle' | 'correct' | 'wrong'

interface DailyResult {
  date: string
  answers: boolean[]
  score: number
}

interface DailyStreak {
  streak: number
  last_played: string
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function dayNumber(): number {
  const start = new Date('2026-01-01').getTime()
  const today = new Date().setHours(0, 0, 0, 0)
  return Math.max(1, Math.floor((today - start) / 86400000) + 1)
}

function formatDate(): string {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getStoredResult(): DailyResult | null {
  try {
    const raw = localStorage.getItem('fda_daily_result')
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function getStoredStreak(): DailyStreak {
  try {
    const raw = localStorage.getItem('fda_daily_streak')
    if (!raw) return { streak: 0, last_played: '' }
    return JSON.parse(raw)
  } catch { return { streak: 0, last_played: '' } }
}

function saveResultAndStreak(answers: boolean[], score: number): DailyStreak {
  const today = todayStr()
  localStorage.setItem('fda_daily_result', JSON.stringify({ date: today, answers, score }))

  const stored = getStoredStreak()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  let newStreak = 1
  if (stored.last_played === yesterdayStr) newStreak = stored.streak + 1
  else if (stored.last_played === today)   newStreak = stored.streak

  const streakData: DailyStreak = { streak: newStreak, last_played: today }
  localStorage.setItem('fda_daily_streak', JSON.stringify(streakData))
  return streakData
}

function buildShareText(answers: boolean[], score: number, streak: number): string {
  const emojis = answers.map(a => a ? '✅' : '❌').join('')
  const date   = formatDate()
  const lines  = [
    `FIGHT DATA ARENA — DAILY ${date}`,
    `${emojis}  ${score}/10`,
  ]
  if (streak >= 2) lines.push(`🔥 Streak : ${streak} jours`)
  lines.push('fightdata.app/quiz/daily')
  return lines.join('\n')
}

function DailyPage() {
  const [phase, setPhase]         = useState<Phase>('intro')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [idx, setIdx]             = useState(0)
  const [answers, setAnswers]     = useState<boolean[]>([])
  const [selected, setSelected]   = useState<string | null>(null)
  const [state, setState]         = useState<AnswerState>('idle')
  const [score, setScore]         = useState(0)
  const [streak, setStreak]       = useState(0)
  const [copied, setCopied]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [alreadyPlayed, setAlreadyPlayed] = useState<DailyResult | null>(null)
  const answersRef = useRef<boolean[]>([])

  useEffect(() => {
    const result = getStoredResult()
    if (result?.date === todayStr()) {
      answersRef.current = result.answers
      setAlreadyPlayed(result)
      setAnswers(result.answers)
      setScore(result.score)
      setStreak(getStoredStreak().streak)
      setPhase('finished')
    }
  }, [])

  const loadQuestions = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const qs = await getDailyQuiz()
      setQuestions(qs)
    } catch (e) {
      console.error(e)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  const startPlaying = () => {
    loadQuestions()
    setPhase('playing')
  }

  const handleChoice = (choice: string) => {
    if (state !== 'idle') return
    const correct = choice === questions[idx]?.answer
    setSelected(choice)
    setState(correct ? 'correct' : 'wrong')
    const next = [...answersRef.current, correct]
    answersRef.current = next
    setAnswers(next)
    if (correct) setScore(s => s + 1)
  }

  const handleNext = () => {
    if (idx + 1 >= questions.length) {
      const finalAnswers = answersRef.current
      const finalScore   = finalAnswers.filter(Boolean).length
      const streakData   = saveResultAndStreak(finalAnswers, finalScore)
      setStreak(streakData.streak)
      setScore(finalScore)
      setPhase('finished')
    } else {
      setIdx(i => i + 1)
      setSelected(null)
      setState('idle')
    }
  }

  const copyResult = async () => {
    const text = buildShareText(answers, score, streak)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard not available
    }
  }

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
    const q = questions[idx]
    if (choice === q?.answer) return { ...base, background: 'rgba(74,222,128,0.12)', border: '1px solid #4ade80', color: '#4ade80', boxShadow: '0 0 12px rgba(74,222,128,0.2)' }
    if (choice === selected)  return { ...base, background: 'rgba(255,45,120,0.12)', border: '1px solid #ff2d78', color: '#ff2d78' }
    return { ...base, opacity: 0.3 }
  }

  // ── INTRO ───────────────────────────────────────────────────────────────────
  if (phase === 'intro') return (
    <>
      <Navbar />
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', minHeight: 'calc(100vh - 60px)' }}>
        <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '28px', alignItems: 'center', textAlign: 'center' }}>
          <div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '4px', color: COLOR, marginBottom: '10px' }}>
              #{dayNumber()}
            </div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2.5rem, 8vw, 4rem)', letterSpacing: '8px', color: '#fff', textShadow: `0 0 20px ${COLOR}, 0 0 50px ${COLOR}55`, lineHeight: 1 }}>
              DAILY {formatDate()}
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.25)', marginTop: '10px' }}>
              10 QUESTIONS — UN PAR JOUR
            </div>
          </div>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.9rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '320px' }}>
            Chaque jour, 10 questions identiques pour tous les joueurs. Pas de skip — réponds à tout.
          </div>
          <button onClick={startPlaying} style={{
            width: '100%', maxWidth: '280px', padding: '14px',
            background: `linear-gradient(90deg, ${COLOR_ALT}, ${COLOR})`,
            border: 'none', cursor: 'pointer',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '1.1rem', letterSpacing: '6px', color: '#000',
            boxShadow: `0 0 20px ${COLOR}33`, transition: 'all 0.2s',
          }}>
            COMMENCER →
          </button>
          <Link href="/" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }}>
            ← ACCUEIL
          </Link>
        </div>
      </main>
    </>
  )

  // ── FINISHED ────────────────────────────────────────────────────────────────
  if (phase === 'finished') return (
    <>
      <Navbar />
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', minHeight: 'calc(100vh - 60px)' }}>
        <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '28px', alignItems: 'center', textAlign: 'center' }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2rem, 6vw, 3rem)', letterSpacing: '6px', color: COLOR, textShadow: `0 0 20px ${COLOR}`, lineHeight: 1 }}>
              DAILY {formatDate()}
            </div>
            {alreadyPlayed && (
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>
                DÉJÀ JOUÉ AUJOURD'HUI
              </div>
            )}
          </div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(3rem, 10vw, 5rem)', letterSpacing: '4px', color: '#fff', textShadow: `0 0 30px ${COLOR}88`, lineHeight: 1 }}>
            {score}<span style={{ fontSize: '0.5em', color: COLOR }}>/10</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
            {[answers.slice(0, 5), answers.slice(5, 10)].map((row, ri) => (
              <div key={ri} style={{ display: 'flex', gap: '6px' }}>
                {row.map((correct, ci) => (
                  <div key={ci} style={{
                    width: '36px', height: '36px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem',
                    background: correct ? 'rgba(74,222,128,0.15)' : 'rgba(255,45,120,0.12)',
                    border: `1px solid ${correct ? '#4ade80' : '#ff2d78'}`,
                  }}>
                    {correct ? '✅' : '❌'}
                  </div>
                ))}
              </div>
            ))}
          </div>
          {streak >= 2 && (
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.2rem', letterSpacing: '3px', color: '#ffe000', textShadow: '0 0 12px #ffe000' }}>
              🔥 STREAK : {streak} JOURS
            </div>
          )}
          <button onClick={copyResult} style={{
            width: '100%', maxWidth: '280px', padding: '14px',
            background: copied ? 'rgba(74,222,128,0.2)' : `linear-gradient(90deg, ${COLOR_ALT}, ${COLOR})`,
            border: copied ? '1px solid #4ade80' : 'none',
            cursor: 'pointer',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '1rem', letterSpacing: '4px',
            color: copied ? '#4ade80' : '#000',
            transition: 'all 0.2s',
            boxShadow: copied ? 'none' : `0 0 16px ${COLOR}33`,
          }}>
            {copied ? '✓ COPIÉ !' : 'COPIER LE RÉSULTAT'}
          </button>
          <Link href="/" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }}>
            ← ACCUEIL
          </Link>
        </div>
      </main>
    </>
  )

  // ── PLAYING ─────────────────────────────────────────────────────────────────
  const question = questions[idx]

  return (
    <>
      <Navbar />
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 20px', minHeight: 'calc(100vh - 60px)' }}>
        <div className="score-bar" style={{ marginBottom: '24px' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${COLOR}, transparent)` }} />
          {[
            { val: score,           label: 'SCORE' },
            { val: `${idx + 1}/${questions.length}`, label: 'QUESTION' },
            { val: `${answers.filter(Boolean).length}/${answers.length || 0}`, label: 'CORRECT' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.7rem', letterSpacing: '2px', background: `linear-gradient(180deg, #fff, ${COLOR})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {s.val}
              </div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.52rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.28)' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.3)', letterSpacing: '4px' }}>
            CHARGEMENT...
          </div>
        ) : loadError ? (
          <div style={{ fontFamily: "'Share Tech Mono', monospace", color: '#ff2d78', letterSpacing: '3px', textAlign: 'center' }}>
            ERREUR DE CHARGEMENT<br />
            <button onClick={loadQuestions} style={{ marginTop: '12px', background: 'none', border: '1px solid #ff2d78', color: '#ff2d78', fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', letterSpacing: '3px', padding: '8px 20px', cursor: 'pointer' }}>
              RÉESSAYER
            </button>
          </div>
        ) : !question ? (
          <div style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.3)', letterSpacing: '4px' }}>
            CHARGEMENT...
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: '500px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ padding: '11px 18px', background: 'rgba(0,255,136,0.07)', borderBottom: `1px solid ${COLOR}28`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', letterSpacing: '4px', background: `linear-gradient(90deg, ${COLOR}, ${COLOR_ALT})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                DAILY {formatDate()}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', letterSpacing: '2px', color: COLOR }}>
                  Q{idx + 1}/10
                </span>
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)' }}>
                  {question.fighter_slug}
                </span>
              </div>
            </div>
            <div style={{ height: '180px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
              {question.gif_url ? (
                <img src={question.gif_url} alt={question.move_name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
              ) : (
                <span style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.15)', fontSize: '0.6rem', letterSpacing: '3px' }}>NO GIF</span>
              )}
              {[
                { top: '7px', left: '7px', borderTop: `1px solid ${COLOR}`, borderLeft: `1px solid ${COLOR}` },
                { top: '7px', right: '7px', borderTop: `1px solid ${COLOR}`, borderRight: `1px solid ${COLOR}` },
                { bottom: '7px', left: '7px', borderBottom: `1px solid ${COLOR}`, borderLeft: `1px solid ${COLOR}` },
                { bottom: '7px', right: '7px', borderBottom: `1px solid ${COLOR}`, borderRight: `1px solid ${COLOR}` },
              ].map((s, i) => (
                <div key={i} style={{ position: 'absolute', width: '10px', height: '10px', ...s }} />
              ))}
            </div>
            <div style={{ padding: '16px 18px 12px' }}>
              <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', fontWeight: 600, lineHeight: 1.4, color: 'rgba(255,255,255,0.9)' }}>
                Quel est le <span style={{ color: COLOR }}>startup</span> de{' '}
                <strong style={{ color: '#fff' }}>{question.move_name}</strong> ?
              </p>
            </div>
            <div style={{ padding: '0 18px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {question.choices.map((choice, i) => (
                  <button key={choice} onClick={() => handleChoice(choice)} style={choiceStyle(choice)}>
                    <span style={{ width: '20px', height: '20px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.18)', fontSize: '0.62rem' }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {choice} frames
                  </button>
                ))}
              </div>
            </div>
            <div style={{ padding: '12px 18px 18px' }}>
              {state !== 'idle' && (
                <div style={{ padding: '9px 14px', marginBottom: '10px', background: state === 'correct' ? 'rgba(74,222,128,0.1)' : 'rgba(255,45,120,0.1)', border: `1px solid ${state === 'correct' ? '#4ade80' : '#ff2d78'}`, fontFamily: "'Rajdhani', sans-serif", fontSize: '0.9rem', fontWeight: 700, color: state === 'correct' ? '#4ade80' : '#ff2d78' }}>
                  {state === 'correct'
                    ? `✓ Correct ! Startup : ${question.answer} frames.`
                    : `✗ Raté ! Réponse : ${question.answer} frames.`}
                </div>
              )}
              <button
                onClick={state !== 'idle' ? handleNext : undefined}
                disabled={state === 'idle'}
                style={{
                  width: '100%', padding: '13px',
                  background: state !== 'idle' ? `linear-gradient(90deg, ${COLOR_ALT}, ${COLOR})` : 'rgba(255,255,255,0.05)',
                  border: state === 'idle' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                  cursor: state !== 'idle' ? 'pointer' : 'default',
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '0.95rem', letterSpacing: '4px',
                  color: state !== 'idle' ? '#000' : 'rgba(255,255,255,0.2)',
                  transition: 'all 0.2s',
                }}>
                {idx + 1 >= questions.length && state !== 'idle' ? 'VOIR LES RÉSULTATS →' : 'QUESTION SUIVANTE →'}
              </button>
            </div>
          </div>
        )}
        <Link href="/" style={{ marginTop: '16px', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }}>
          ← ACCUEIL
        </Link>
      </main>
    </>
  )
}

export default function DailyChallengePage() {
  return <Suspense><DailyPage /></Suspense>
}

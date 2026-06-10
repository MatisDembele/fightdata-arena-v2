'use client'
import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getRandomQuiz, getFighterQuiz, getRandomPunish } from '@/lib/api'
import type { QuizQuestion } from '@/types'

type AnswerState = 'idle' | 'correct' | 'wrong'

type Rank = { label: string; color: string; colorAlt: string }

function getRank(acc: number): Rank {
  if (acc === 100) return { label: 'MASTER',   color: '#cc44ff', colorAlt: '#9b1fff' }
  if (acc >= 88)   return { label: 'DIAMOND',  color: '#00ccff', colorAlt: '#0077ff' }
  if (acc >= 75)   return { label: 'PLATINUM', color: '#88bbee', colorAlt: '#4477cc' }
  if (acc >= 62)   return { label: 'GOLD',     color: '#ffd700', colorAlt: '#f0a800' }
  if (acc >= 50)   return { label: 'SILVER',   color: '#d8dde8', colorAlt: '#b0b8c8' }
  if (acc >= 37)   return { label: 'BRONZE',   color: '#cd7f32', colorAlt: '#a05020' }
  if (acc >= 25)   return { label: 'IRON',     color: '#8b7355', colorAlt: '#6b5a45' }
  return                  { label: 'ROOKIE',   color: '#c0c0c0', colorAlt: '#888888' }
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
  const nextQuestionRef  = useRef<QuizQuestion | null>(null)
  const prefetchingRef   = useRef<boolean>(false)
  const prefetchTokenRef = useRef<number>(0)

  const [sessionPhase, setSessionPhase]   = useState<'selector' | 'playing' | 'finished'>('selector')
  const [sessionLength, setSessionLength] = useState<number>(10)
  const [maxCombo, setMaxCombo]           = useState(0)
  const [copied, setCopied]               = useState(false)
  const [isNewRecord, setIsNewRecord]     = useState(false)

  const isHardcore = mode === 'hardcore'
  const isInput    = mode === 'input'
  const isPunish   = mode === 'punish'
  const isSurvival = mode === 'survival'

  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0

  const modeColor = {
    random:   '#ff2d78',
    fighter:  '#00f0ff',
    input:    '#9b1fff',
    punish:   '#ffe000',
    hardcore: '#ff6a00',
    survival: '#4ade80',
  }[mode] ?? '#ff2d78'

  const modeColorAlt = {
    random:   '#9b1fff',
    fighter:  '#0050ff',
    input:    '#ff2d78',
    punish:   '#ff6a00',
    hardcore: '#ff2d78',
    survival: '#00f0ff',
  }[mode] ?? '#9b1fff'

  const loadQuestion = useCallback(async () => {
    nextQuestionRef.current = null
    prefetchingRef.current  = false
    prefetchTokenRef.current++
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
  }, [mode, slug, isPunish])

  const prefetchNext = useCallback(async () => {
    if (prefetchingRef.current) return
    prefetchingRef.current = true
    const myToken = prefetchTokenRef.current
    try {
      const q = isPunish
        ? await getRandomPunish()
        : (mode === 'fighter' && slug)
        ? await getFighterQuiz(slug)
        : await getRandomQuiz()
      if (prefetchTokenRef.current === myToken) {
        nextQuestionRef.current = q
        if (q.gif_url) {
          const img = new Image()
          img.src = q.gif_url
        }
      }
    } catch {
      // silent — handleNextQuestion falls back to loadQuestion
    } finally {
      if (prefetchTokenRef.current === myToken) {
        prefetchingRef.current = false
      }
    }
  }, [mode, slug, isPunish])

  useEffect(() => { if (sessionPhase === 'playing') loadQuestion() }, [loadQuestion, sessionPhase])

  useEffect(() => {
    if (state !== 'idle') prefetchNext()
  }, [state, prefetchNext])

  // Focus input en mode INPUT
  useEffect(() => {
    if (isInput && !loading && state === 'idle') {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isInput, loading, state, question])

  // Records localStorage — s'exécute une fois en entrant dans 'finished'
  useEffect(() => {
    if (sessionPhase !== 'finished') return
    if (isSurvival) {
      const stored = localStorage.getItem('fda_survival_best')
      const prev: { best: number; totalGames: number } = stored
        ? JSON.parse(stored)
        : { best: -1, totalGames: 0 }
      setIsNewRecord(score > prev.best)
      localStorage.setItem('fda_survival_best', JSON.stringify({
        best:       Math.max(score, prev.best),
        totalGames: prev.totalGames + 1,
      }))
    } else {
      const key = `fda_best_${mode}${mode === 'fighter' ? `_${slug}` : ''}`
      const stored = localStorage.getItem(key)
      const prev: { bestScore: number; bestAccuracy: number; totalGames: number } = stored
        ? JSON.parse(stored)
        : { bestScore: -1, bestAccuracy: -1, totalGames: 0 }
      setIsNewRecord(score > prev.bestScore || accuracy > prev.bestAccuracy)
      localStorage.setItem(key, JSON.stringify({
        bestScore:    Math.max(score, prev.bestScore),
        bestAccuracy: Math.max(accuracy, prev.bestAccuracy),
        totalGames:   prev.totalGames + 1,
      }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionPhase])

  // Mode PUNISH FINDER
  const handlePunish = (userAnswer: 'punissable' | 'safe') => {
    if (state !== 'idle' || !question) return
    setSelected(userAnswer)
    if (userAnswer === question.answer) handleCorrect(); else handleWrong()
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
    setCombo(s => { const next = s + 1; setMaxCombo(m => Math.max(m, next)); return next })
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
    if (choice === question?.answer) handleCorrect(); else handleWrong()
  }

  // Mode INPUT — soumission
  const handleInputSubmit = () => {
    if (state !== 'idle' || !inputVal.trim()) return
    const userVal  = inputVal.trim()
    const correct  = question?.answer ?? ''
    if (userVal === correct) handleCorrect(); else handleWrong()
    setSelected(userVal)
  }

  const isSessionOver = (sessionLength !== Infinity && total >= sessionLength) || (isSurvival && state === 'wrong')

  const handleNextQuestion = useCallback(() => {
    if (isSessionOver) { setSessionPhase('finished'); return }
    if (nextQuestionRef.current) {
      const q = nextQuestionRef.current
      nextQuestionRef.current = null
      prefetchingRef.current  = false
      setQuestion(q)
      setSelected(null)
      setState('idle')
      setInputVal('')
      setTimeLeft(5)
      if (timerRef.current) clearInterval(timerRef.current)
    } else {
      loadQuestion()
    }
  }, [isSessionOver, loadQuestion])

  const handleShare = useCallback(async () => {
    let text: string
    if (isSurvival) {
      const stored = localStorage.getItem('fda_survival_best')
      const best = stored ? JSON.parse(stored).best : score
      text = [
        `Fight Data Arena 🥊 — Mode SURVIE`,
        `J'ai survécu ${score} question${score > 1 ? 's' : ''} 💀`,
        `Record : ${best} questions`,
        `fightdata.app`,
      ].join('\n')
    } else {
      const labels: Record<string, string> = {
        random:   'RANDOM',
        fighter:  slug.toUpperCase(),
        input:    'INPUT',
        punish:   'PUNISH FINDER',
        hardcore: 'HARDCORE',
      }
      const label    = labels[mode] ?? mode.toUpperCase()
      const rank     = getRank(accuracy)
      const scoreStr = sessionLength !== Infinity ? `${score}/${sessionLength}` : String(score)
      text = [
        `Fight Data Arena 🥊 — Mode ${label}`,
        `Score : ${scoreStr} (${accuracy}%) — Rang ${rank.label}`,
        `Combo max : ${maxCombo}🔥`,
        `fightdata.app`,
      ].join('\n')
    }
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard non disponible
    }
  }, [mode, slug, score, sessionLength, accuracy, maxCombo, isSurvival])

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

  function startSession() {
    setScore(0); setCombo(0); setMaxCombo(0); setTotal(0)
    setIsNewRecord(false); setLoading(true); setQuestion(null)
    setSessionPhase('playing')
  }

  function restartSession() {
    setScore(0); setCombo(0); setMaxCombo(0); setTotal(0)
    setState('idle'); setSelected(null); setQuestion(null); setLoading(true)
    setIsNewRecord(false)
    setSessionPhase('playing')
  }

  const modeLabel = {
    random:   'RANDOM MODE',
    fighter:  `FIGHTER // ${slug.toUpperCase()}`,
    input:    'INPUT MODE',
    punish:   'PUNISH FINDER',
    hardcore: 'HARDCORE',
    survival: 'MODE SURVIE',
  }[mode] ?? 'QUIZ'

  // Auto-start en mode survie — pas de sélecteur de longueur
  useEffect(() => {
    if (isSurvival && sessionPhase === 'selector') {
      setScore(0); setCombo(0); setMaxCombo(0); setTotal(0)
      setIsNewRecord(false); setLoading(true); setQuestion(null)
      setSessionPhase('playing')
    }
  }, [isSurvival, sessionPhase])

  const isPunishable = question?.answer === 'punissable'

  // ── SELECTOR ────────────────────────────────────────────────────────────────
  if (sessionPhase === 'selector') return (
    <>
      <Navbar />
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', minHeight: 'calc(100vh - 60px)' }}>
        <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '28px', alignItems: 'center' }}>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.85rem', letterSpacing: '4px', background: `linear-gradient(90deg, ${modeColor}, ${modeColorAlt})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '10px' }}>
              {modeLabel}
            </div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', letterSpacing: '6px', color: '#fff' }}>
              LONGUEUR DE SESSION
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.25)', marginTop: '8px' }}>
              NOMBRE DE QUESTIONS PAR PARTIE
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {([10, 20, 30, 40, 50, Infinity] as number[]).map(len => {
              const isSel = sessionLength === len
              return (
                <button key={String(len)} onClick={() => setSessionLength(len)} style={{
                  width: '76px', height: '76px',
                  background: isSel ? `${modeColor}18` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isSel ? modeColor : 'rgba(255,255,255,0.1)'}`,
                  color: isSel ? modeColor : 'rgba(255,255,255,0.4)',
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: len === Infinity ? '2rem' : '1.7rem',
                  letterSpacing: '1px', cursor: 'pointer',
                  transition: 'all 0.2s',
                  textShadow: isSel ? `0 0 12px ${modeColor}88` : 'none',
                  boxShadow: isSel ? `0 0 18px ${modeColor}22` : 'none',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
                }}>
                  <span>{len === Infinity ? '∞' : len}</span>
                  <span style={{ fontSize: '0.4rem', letterSpacing: '1px', opacity: 0.6 }}>
                    {len === Infinity ? 'INFINI' : 'Q'}
                  </span>
                </button>
              )
            })}
          </div>

          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.62rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', minHeight: '1.2em' }}>
            {sessionLength === Infinity ? 'MODE INFINI — AUCUNE LIMITE' : `${sessionLength} QUESTIONS PAR SESSION`}
          </div>

          <button onClick={startSession} style={{
            width: '100%', maxWidth: '280px', padding: '14px',
            background: `linear-gradient(90deg, ${modeColorAlt}, ${modeColor})`,
            border: 'none', cursor: 'pointer',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '1.1rem', letterSpacing: '6px', color: '#fff',
            boxShadow: `0 0 20px ${modeColor}33`, transition: 'all 0.2s',
          }}>
            COMMENCER →
          </button>

          <Link href="/quiz" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }}>
            ← CHANGER DE MODE
          </Link>
        </div>
      </main>
    </>
  )

  // ── FINISHED ────────────────────────────────────────────────────────────────
  if (sessionPhase === 'finished') {
    const buttons = (
      <div style={{ display: 'flex', gap: '10px', width: '100%', flexWrap: 'wrap' }}>
        <button onClick={restartSession} style={{
          flex: '1 1 0', padding: '13px 12px',
          background: `linear-gradient(90deg, ${modeColorAlt}, ${modeColor})`,
          border: 'none', cursor: 'pointer',
          fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.95rem', letterSpacing: '3px', color: '#fff',
          boxShadow: `0 0 16px ${modeColor}33`, transition: 'all 0.2s',
        }}>REJOUER</button>
        <Link href="/quiz" style={{
          flex: '1 1 0', padding: '13px 12px',
          background: 'none', border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.45)',
          fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.95rem', letterSpacing: '3px',
          textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>MODES</Link>
        <button onClick={handleShare} style={{
          flex: '1 1 0', padding: '13px 12px',
          background: 'none',
          border: `1px solid ${copied ? '#4ade80' : 'rgba(255,255,255,0.12)'}`,
          color: copied ? '#4ade80' : 'rgba(255,255,255,0.45)',
          fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.95rem', letterSpacing: '3px',
          cursor: 'pointer', transition: 'all 0.3s',
        }}>{copied ? '✓ COPIÉ !' : 'PARTAGER'}</button>
      </div>
    )

    // ── Écran survie ──
    if (isSurvival) {
      const stored   = typeof window !== 'undefined' ? localStorage.getItem('fda_survival_best') : null
      const bestEver = stored ? (JSON.parse(stored) as { best: number }).best : score
      return (
        <>
          <Navbar />
          <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', minHeight: 'calc(100vh - 60px)' }}>
            <div className="animate-fadeInUp" style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', textAlign: 'center' }}>

              <div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(3rem, 12vw, 5rem)', letterSpacing: '6px', lineHeight: 1, color: '#ff2d78', textShadow: '0 0 24px #ff2d7888' }}>
                  💀 GAME OVER
                </div>
                <div style={{ marginTop: '16px', fontFamily: "'Rajdhani', sans-serif", fontSize: '1.1rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '1px' }}>
                  Tu as survécu <span style={{ color: modeColor, fontWeight: 700 }}>{score} question{score > 1 ? 's' : ''}</span>
                </div>
                {isNewRecord && (
                  <div style={{ marginTop: '12px', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', letterSpacing: '4px', color: '#ffd700', textShadow: '0 0 16px #ffd70088', animation: 'glowPulse 2s ease-in-out infinite' }}>
                    🏆 NOUVEAU RECORD !
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                {[
                  { val: String(score), label: 'QUESTIONS SURVÉCUES' },
                  { val: String(bestEver), label: 'RECORD PERSO' },
                ].map((s, i) => (
                  <div key={i} style={{ padding: '20px 12px', background: 'rgba(0,0,0,0.3)', borderRight: i === 0 ? '1px solid rgba(255,255,255,0.08)' : 'none', textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2rem, 8vw, 3rem)', letterSpacing: '2px', color: modeColor, textShadow: `0 0 12px ${modeColor}88` }}>
                      {s.val}
                    </div>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.45rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.3)', marginTop: '6px' }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              {buttons}
            </div>
          </main>
        </>
      )
    }

    // ── Écran normal ──
    const rank = getRank(accuracy)
    return (
      <>
        <Navbar />
        <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', minHeight: 'calc(100vh - 60px)' }}>
          <div className="animate-fadeInUp" style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', textAlign: 'center' }}>

            <div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '4px', color: 'rgba(255,255,255,0.3)', marginBottom: '14px' }}>
                RANG FINAL
              </div>
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(3.5rem, 14vw, 5.5rem)',
                letterSpacing: '8px', lineHeight: 1,
                background: `linear-gradient(135deg, ${rank.color}, ${rank.colorAlt})`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                filter: `drop-shadow(0 0 18px ${rank.color}66)`,
              }}>
                {rank.label}
              </div>
              {isNewRecord && (
                <div style={{ marginTop: '14px', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', letterSpacing: '4px', color: '#ffd700', textShadow: '0 0 16px #ffd70088', animation: 'glowPulse 2s ease-in-out infinite' }}>
                  🏆 NOUVEAU RECORD !
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', width: '100%', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              {[
                { val: sessionLength !== Infinity ? `${score}/${sessionLength}` : String(score), label: 'SCORE' },
                { val: `${accuracy}%`, label: 'PRÉCISION' },
                { val: `${maxCombo}🔥`, label: 'COMBO MAX' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '20px 12px', background: 'rgba(0,0,0,0.3)', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.6rem, 5vw, 2.4rem)', letterSpacing: '2px', color: rank.color, textShadow: `0 0 12px ${rank.color}88` }}>
                    {s.val}
                  </div>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.48rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.3)', marginTop: '6px' }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.2)' }}>
              {modeLabel} — {sessionLength === Infinity ? '∞' : sessionLength} QUESTIONS
            </div>

            {buttons}
          </div>
        </main>
      </>
    )
  }

  // ── PLAYING ─────────────────────────────────────────────────────────────────
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
              background: `rgba(${modeColor === '#ff2d78' ? '255,45,120' : modeColor === '#00f0ff' ? '0,240,255' : modeColor === '#9b1fff' ? '155,31,255' : modeColor === '#ffe000' ? '255,224,0' : modeColor === '#4ade80' ? '74,222,128' : '255,106,0'}, 0.07)`,
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
              <button onClick={handleNextQuestion} style={{
                width: '100%', padding: '13px',
                background: isSessionOver && state !== 'idle'
                  ? `linear-gradient(90deg, ${modeColor}, ${modeColorAlt})`
                  : `linear-gradient(90deg, ${modeColorAlt}, ${modeColor})`,
                border: 'none', cursor: 'pointer',
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '0.95rem', letterSpacing: '4px', color: '#fff',
                boxShadow: `0 0 16px ${modeColor}33`,
                transition: 'all 0.2s',
              }}>
                {isSessionOver && state !== 'idle' ? 'VOIR LES RÉSULTATS →' : state === 'idle' ? 'PASSER →' : 'QUESTION SUIVANTE →'}
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

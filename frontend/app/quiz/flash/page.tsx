'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getRandomQuiz, submitFlashScore, getFlashLeaderboard, invalidateLeaderboardCache, type FlashLeaderboardEntry } from '@/lib/api'
import { playCorrect, playWrong } from '@/lib/sounds'
import { GifSection, makeChoiceStyle } from '@/components/QuestionCard'
import { useLanguage } from '@/lib/i18n'
import { checkAndUnlock, updateLifetime, type Achievement } from '@/lib/achievements'
import AchievementToast from '@/components/AchievementToast'
import type { QuizQuestion } from '@/types'

const COLOR     = '#e879f9'
const COLOR_ALT = '#a855f7'
const LIVES     = 3
const BASE_MS   = 4000
const MIN_MS    = 1200
const DECAY_MS  = 120

function calcMaxTime(qCount: number): number {
  return Math.max(MIN_MS, BASE_MS - qCount * DECAY_MS)
}

type Phase = 'intro' | 'playing' | 'finished'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isDesktop
}

export default function FlashPage() {
  const { t } = useLanguage()
  const isDesktop = useIsDesktop()

  const [phase, setPhase]             = useState<Phase>('intro')
  const [question, setQuestion]       = useState<QuizQuestion | null>(null)
  const [selected, setSelected]       = useState<string | null>(null)
  const [answerState, setAnswerState] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [lives, setLives]             = useState(LIVES)
  const [score, setScore]             = useState(0)
  const [total, setTotal]             = useState(0)
  const [qCount, setQCount]           = useState(0)
  const [timeLeft, setTimeLeft]       = useState(1)
  const [loading, setLoading]         = useState(false)
  const [bestScore, setBestScore]     = useState(0)
  const [newRecord, setNewRecord]     = useState(false)
  const [flashLb, setFlashLb]         = useState<FlashLeaderboardEntry[]>([])
  const [flashPseudo, setFlashPseudo] = useState('')
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])
  function dismissAchievement(id: string) { setNewAchievements(prev => prev.filter(a => a.id !== id)) }

  // Mutable refs so async/timer callbacks always see fresh values
  const livesRef     = useRef(LIVES)
  const scoreRef     = useRef(0)
  const totalRef     = useRef(0)
  const qCountRef    = useRef(0)
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const advancingRef = useRef(false)

  // Keep latest handleTimeout accessible from the timer closure
  const handleTimeoutRef = useRef<() => void>(() => {})

  useEffect(() => {
    try {
      const raw = localStorage.getItem('fda_flash_best')
      if (raw) setBestScore(JSON.parse(raw).best ?? 0)
    } catch { /* ignore */ }
  }, [])

  // On game end: submit best score + fetch leaderboard
  useEffect(() => {
    if (phase !== 'finished') return
    const p = localStorage.getItem('fda_pseudo') || ''
    setFlashPseudo(p)
    if (p) {
      try {
        const raw  = localStorage.getItem('fda_flash_best')
        const best = raw ? (JSON.parse(raw).best ?? 0) : 0
        if (best > 0) {
          invalidateLeaderboardCache('flash_lb')
          submitFlashScore(p, best).catch(() => {})
        }
      } catch { /* ignore */ }
    }
    getFlashLeaderboard().then(setFlashLb).catch(() => {})
  }, [phase])

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  function finishGame(finalScore: number) {
    try {
      const raw  = localStorage.getItem('fda_flash_best')
      const prev = raw ? JSON.parse(raw) : { best: -1, totalGames: 0 }
      if (finalScore > prev.best) setNewRecord(true)
      localStorage.setItem('fda_flash_best', JSON.stringify({
        best: Math.max(finalScore, prev.best),
        totalGames: (prev.totalGames ?? 0) + 1,
      }))
    } catch { /* ignore */ }
    try {
      const record = {
        date: new Date().toISOString(),
        mode: 'flash',
        score: finalScore,
        total: totalRef.current,
        accuracy: totalRef.current > 0 ? Math.round(finalScore / totalRef.current * 100) : 0,
        maxCombo: 0,
      }
      const histRaw = localStorage.getItem('fda_history')
      const hist = histRaw ? JSON.parse(histRaw) : []
      hist.unshift(record)
      localStorage.setItem('fda_history', JSON.stringify(hist.slice(0, 30)))
    } catch { /* ignore */ }
    try {
      updateLifetime({ questions: totalRef.current, totalCorrect: finalScore })
      const newly = checkAndUnlock({ mode: 'flash', flashScore: finalScore })
      if (newly.length > 0) setNewAchievements(newly)
    } catch { /* ignore */ }
    setPhase('finished')
  }

  async function loadNext() {
    if (advancingRef.current) return
    advancingRef.current = true
    stopTimer()
    setLoading(true)
    setSelected(null)
    setAnswerState('idle')
    try {
      const q = await getRandomQuiz()
      setQuestion(q)
    } catch { /* ignore */ } finally {
      setLoading(false)
      advancingRef.current = false
    }
  }

  // Kept fresh via ref so the timer interval always calls the latest version
  const handleTimeout = () => {
    playWrong()
    totalRef.current += 1
    setTotal(totalRef.current)
    livesRef.current -= 1
    setLives(livesRef.current)
    setAnswerState('wrong')
    const lv = livesRef.current
    const sc = scoreRef.current
    if (lv <= 0) {
      setTimeout(() => finishGame(sc), 700)
    } else {
      qCountRef.current += 1
      setQCount(qCountRef.current)
      setTimeout(() => loadNext(), 800)
    }
  }
  handleTimeoutRef.current = handleTimeout

  // Start timer whenever a fresh question is ready and awaiting input
  useEffect(() => {
    if (phase !== 'playing' || loading || !question || answerState !== 'idle') return
    const maxMs   = calcMaxTime(qCountRef.current)
    const startAt = Date.now()
    setTimeLeft(1)

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startAt
      const ratio   = Math.max(0, 1 - elapsed / maxMs)
      setTimeLeft(ratio)
      if (elapsed >= maxMs) {
        clearInterval(timerRef.current!)
        timerRef.current = null
        handleTimeoutRef.current()
      }
    }, 50)

    return () => stopTimer()
  }, [phase, loading, question, answerState])

  function handleChoice(choice: string) {
    if (answerState !== 'idle' || !question) return
    stopTimer()
    setSelected(choice)
    totalRef.current += 1
    setTotal(totalRef.current)

    if (choice === question.answer) {
      playCorrect()
      scoreRef.current += 1
      setScore(scoreRef.current)
      setAnswerState('correct')
      qCountRef.current += 1
      setQCount(qCountRef.current)
      setTimeout(() => loadNext(), 600)
    } else {
      playWrong()
      livesRef.current -= 1
      setLives(livesRef.current)
      setAnswerState('wrong')
      const lv = livesRef.current
      const sc = scoreRef.current
      if (lv <= 0) {
        setTimeout(() => finishGame(sc), 700)
      } else {
        qCountRef.current += 1
        setQCount(qCountRef.current)
        setTimeout(() => loadNext(), 800)
      }
    }
  }

  // Keyboard shortcuts (A-D or 1-4)
  useEffect(() => {
    if (phase !== 'playing' || loading || !question || answerState !== 'idle') return
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const num = parseInt(e.key, 10)
      if (num >= 1 && num <= question.choices.length) { handleChoice(question.choices[num - 1]); return }
      const ci = ['a', 'b', 'c', 'd'].indexOf(e.key.toLowerCase())
      if (ci >= 0 && ci < question.choices.length) handleChoice(question.choices[ci])
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, loading, question, answerState])

  function startGame() {
    stopTimer()
    livesRef.current  = LIVES
    scoreRef.current  = 0
    totalRef.current  = 0
    qCountRef.current = 0
    advancingRef.current = false
    setLives(LIVES)
    setScore(0)
    setTotal(0)
    setQCount(0)
    setSelected(null)
    setAnswerState('idle')
    setNewRecord(false)
    setQuestion(null)
    setPhase('playing')
    loadNext()
  }

  // ── INTRO ─────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <>
        <Navbar />
        <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', minHeight: 'calc(100vh - 60px)' }}>
          <div style={{ width: '100%', maxWidth: isDesktop ? '620px' : '420px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2.5rem, 8vw, 4rem)', letterSpacing: '10px', lineHeight: 1, background: `linear-gradient(135deg, ${COLOR}, ${COLOR_ALT})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: `drop-shadow(0 0 18px ${COLOR}55)` }}>
                FLASH
              </div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.52rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>
                {t('quiz.mode_flash_sub')}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { icon: '❤️', label: `${LIVES} lives — wrong answer or timeout costs 1` },
                { icon: '⚡', label: 'Timer shrinks every round — 4s start, 1.2s floor' },
                { icon: '🎯', label: 'Auto-advance after each answer' },
              ].map(r => (
                <div key={r.icon} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '10px 14px', background: `${COLOR}08`, border: `1px solid ${COLOR}22` }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>{r.icon}</span>
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '1px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{r.label}</span>
                </div>
              ))}
            </div>

            {bestScore > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.42rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.25)' }}>RECORD</span>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', letterSpacing: '3px', color: COLOR, textShadow: `0 0 10px ${COLOR}` }}>{bestScore} CORRECT</span>
              </div>
            )}

            <button onClick={startGame} style={{ width: '100%', padding: '16px', background: `linear-gradient(90deg, ${COLOR_ALT}, ${COLOR})`, border: 'none', cursor: 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', letterSpacing: '6px', color: '#fff', boxShadow: `0 0 24px ${COLOR}33` }}>
              {t('play.start')}
            </button>

            <Link href="/quiz" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.2)', textDecoration: 'none', textAlign: 'center' }}>
              {t('play.change_mode')}
            </Link>
          </div>
        </main>
      </>
    )
  }

  // ── FINISHED ──────────────────────────────────────────────────────────
  if (phase === 'finished') {
    const acc = total > 0 ? Math.round(score / total * 100) : 0
    return (
      <>
        <Navbar />
        <AchievementToast achievements={newAchievements} onDismiss={dismissAchievement} />
        <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', minHeight: 'calc(100vh - 60px)' }}>
          <div className="animate-fadeInUp" style={{ width: '100%', maxWidth: isDesktop ? '620px' : '420px', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', textAlign: 'center' }}>

            <div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.52rem', letterSpacing: '4px', color: 'rgba(255,255,255,0.3)', marginBottom: '8px' }}>GAME OVER</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(3rem, 10vw, 5rem)', letterSpacing: '4px', color: '#fff', textShadow: `0 0 30px ${COLOR}88`, lineHeight: 1 }}>
                {score}
                <span style={{ fontSize: '0.35em', color: COLOR, marginLeft: '6px' }}>CORRECT</span>
              </div>
              {newRecord && (
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '4px', color: COLOR, marginTop: '8px', textShadow: `0 0 10px ${COLOR}` }}>
                  ★ NEW RECORD ★
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', width: '100%', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              {[
                { val: String(score), label: 'CORRECT' },
                { val: String(total), label: 'ATTEMPTED' },
                { val: `${acc}%`,     label: 'ACCURACY' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '18px 8px', background: 'rgba(0,0,0,0.3)', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.8rem', letterSpacing: '2px', color: COLOR, textShadow: `0 0 10px ${COLOR}66` }}>{s.val}</div>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.4rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button onClick={startGame} style={{ flex: 1, padding: '13px', background: `linear-gradient(90deg, ${COLOR_ALT}, ${COLOR})`, border: 'none', cursor: 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.95rem', letterSpacing: '4px', color: '#fff', boxShadow: `0 0 16px ${COLOR}33` }}>
                {t('play.replay')}
              </button>
              <Link href="/quiz" style={{ flex: 1, padding: '13px', background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.45)', fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.95rem', letterSpacing: '3px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {t('play.modes_btn')}
              </Link>
            </div>

            {/* Leaderboard */}
            {flashLb.length > 0 && (
              <div style={{ width: '100%', textAlign: 'left' }}>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.42rem', letterSpacing: '4px', color: COLOR, marginBottom: '10px', borderBottom: `1px solid ${COLOR}22`, paddingBottom: '6px' }}>
                  FLASH LEADERBOARD
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {flashLb.map(entry => {
                    const isMe = flashPseudo && entry.player_name === flashPseudo
                    return (
                      <div key={entry.rank} style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: '8px', padding: '6px 10px', alignItems: 'center', background: isMe ? `${COLOR}12` : 'rgba(255,255,255,0.02)', border: `1px solid ${isMe ? COLOR + '44' : 'rgba(255,255,255,0.05)'}` }}>
                        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.8rem', color: entry.rank === 1 ? '#ffd700' : entry.rank === 2 ? '#c0c0c0' : entry.rank === 3 ? '#cd7f32' : 'rgba(255,255,255,0.3)' }}>
                          #{entry.rank}
                        </span>
                        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '1px', color: isMe ? COLOR : 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {entry.player_name}
                        </span>
                        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', color: isMe ? COLOR : 'rgba(255,255,255,0.4)', textShadow: isMe ? `0 0 8px ${COLOR}` : 'none' }}>
                          {entry.best_score}
                        </span>
                      </div>
                    )
                  })}
                </div>
                {!flashPseudo && (
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.42rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.2)', marginTop: '8px' }}>
                    Set your name on the Stats page to appear here.
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </>
    )
  }

  // ── PLAYING ───────────────────────────────────────────────────────────
  if (loading || !question) {
    return (
      <>
        <Navbar />
        <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)' }}>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", color: COLOR, letterSpacing: '4px', fontSize: '0.7rem' }}>LOADING...</div>
        </main>
      </>
    )
  }

  const maxTimeSecs = (calcMaxTime(qCount) / 1000).toFixed(1)

  return (
    <>
      <Navbar />
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 20px 32px', minHeight: 'calc(100vh - 60px)' }}>

        {/* HUD */}
        <div style={{ width: '100%', maxWidth: isDesktop ? '760px' : '500px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {Array.from({ length: LIVES }).map((_, i) => (
              <span key={i} style={{ fontSize: '1.3rem', opacity: i < lives ? 1 : 0.15, transition: 'opacity 0.2s' }}>❤️</span>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', letterSpacing: '2px', background: `linear-gradient(180deg, #fff, ${COLOR})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{score}</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.42rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.3)' }}>CORRECT</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1rem', letterSpacing: '3px', color: COLOR, textShadow: `0 0 8px ${COLOR}` }}>Q{qCount + 1}</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.42rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.3)' }}>{maxTimeSecs}s MAX</div>
          </div>
        </div>

        {/* Timer bar */}
        <div style={{ width: '100%', maxWidth: isDesktop ? '760px' : '500px', height: '4px', background: 'rgba(255,255,255,0.08)', marginBottom: '14px' }}>
          <div style={{
            height: '100%',
            width: `${timeLeft * 100}%`,
            background: timeLeft > 0.35 ? `linear-gradient(90deg, ${COLOR_ALT}, ${COLOR})` : '#ff2d78',
            boxShadow: timeLeft > 0.35 ? `0 0 8px ${COLOR}` : '0 0 8px #ff2d78',
            transition: 'background 0.3s, box-shadow 0.3s',
          }} />
        </div>

        {/* Question card */}
        <div style={{ width: '100%', maxWidth: isDesktop ? '760px' : '500px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', border: `1px solid ${answerState === 'correct' ? '#4ade8044' : answerState === 'wrong' ? '#ff2d7844' : 'rgba(255,255,255,0.08)'}`, transition: 'border-color 0.2s' }}>

          <div style={{ padding: '11px 18px', background: `${COLOR}12`, borderBottom: `1px solid ${COLOR}28`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', letterSpacing: '4px', background: `linear-gradient(90deg, ${COLOR}, ${COLOR_ALT})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>FLASH</span>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', letterSpacing: '2px', color: COLOR, textTransform: 'uppercase' }}>{question.fighter_slug}</span>
          </div>

          <GifSection gifUrl={question.gif_url} gifPath={question.gif_path} moveName={question.move_name} color={COLOR} />

          <div style={{ padding: '16px 18px 12px' }}>
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', fontWeight: 600, lineHeight: 1.4, color: 'rgba(255,255,255,0.9)', margin: 0 }}>
              {t('play.q_what_is')} <span style={{ color: COLOR }}>startup</span> {t('play.q_of')}{' '}
              <strong style={{ color: '#fff' }}>{question.move_name}</strong> ?
            </p>
          </div>

          <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {question.choices.map((choice, i) => (
              <button key={choice} onClick={() => handleChoice(choice)} style={makeChoiceStyle(choice, question.answer, selected, answerState === 'idle')}>
                <span style={{ width: '20px', height: '20px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.18)', fontSize: '0.62rem', fontFamily: "'Share Tech Mono', monospace" }}>
                  {String.fromCharCode(65 + i)}
                </span>
                {choice} frames
              </button>
            ))}
          </div>

          {answerState !== 'idle' && (
            <div style={{ padding: '0 18px 14px' }}>
              <div style={{ padding: '8px 14px', background: answerState === 'correct' ? 'rgba(74,222,128,0.1)' : 'rgba(255,45,120,0.1)', border: `1px solid ${answerState === 'correct' ? '#4ade80' : '#ff2d78'}`, fontFamily: "'Rajdhani', sans-serif", fontSize: '0.9rem', fontWeight: 700, color: answerState === 'correct' ? '#4ade80' : '#ff2d78' }}>
                {answerState === 'correct'
                  ? t('play.feedback_correct_startup', { n: question.answer })
                  : t('play.feedback_wrong_startup', { n: question.answer })}
              </div>
            </div>
          )}
        </div>

        <Link href="/quiz" style={{ marginTop: '16px', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }}>
          {t('play.change_mode')}
        </Link>
      </main>
    </>
  )
}

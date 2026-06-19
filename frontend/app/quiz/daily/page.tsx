'use client'
import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { todayStr } from '@/lib/dates'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getDailyQuiz, submitDailyScore, getDailyLeaderboard, submitGlobalScore, type LeaderboardEntry } from '@/lib/api'
import type { QuizQuestion } from '@/types'
import { track } from '@vercel/analytics'
import { useLanguage } from '@/lib/i18n'
import QuestionCard, { makeChoiceStyle } from '@/components/QuestionCard'
import { playCorrect, playWrong } from '@/lib/sounds'
import { checkAndUnlock, updateLifetime, type Achievement } from '@/lib/achievements'
import AchievementToast from '@/components/AchievementToast'
import Icon from '@/components/Icon'
import { primaryGifSrc } from '@/lib/gif'

const COLOR     = '#00ff88'
const COLOR_ALT = '#00b894'
const TIME_PER_Q = 8   // seconds per question — time-trial so answers can't be looked up

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

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.round(s % 60)
  if (m > 0) return `${m}m${String(sec).padStart(2, '0')}s`
  return `${sec}s`
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
    const data = JSON.parse(raw)
    if (typeof data.date !== 'string' || typeof data.score !== 'number' || !Array.isArray(data.answers)) {
      localStorage.removeItem('fda_daily_result')
      return null
    }
    return data as DailyResult
  } catch {
    localStorage.removeItem('fda_daily_result')
    return null
  }
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

  // Compute streak BEFORE writing anything to avoid desync on crash
  const stored = getStoredStreak()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  let newStreak = 1
  if (stored.last_played === yesterdayStr) newStreak = stored.streak + 1
  else if (stored.last_played === today)   newStreak = stored.streak

  const streakData: DailyStreak = { streak: newStreak, last_played: today }

  // Write both synchronously — minimizes desync window
  localStorage.setItem('fda_daily_result', JSON.stringify({ date: today, answers, score }))
  localStorage.setItem('fda_daily_streak', JSON.stringify(streakData))
  const hist = JSON.parse(localStorage.getItem('fda_daily_history') || '{}') as Record<string, {score:number;total:number}>
  hist[today] = { score, total: answers.length }
  localStorage.setItem('fda_daily_history', JSON.stringify(hist))
  return streakData
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
  const [timeLeft, setTimeLeft]   = useState(TIME_PER_Q)
  const [alreadyPlayed, setAlreadyPlayed] = useState<DailyResult | null>(null)
  const [leaderboard, setLeaderboard]     = useState<LeaderboardEntry[]>([])
  const [lbName, setLbName]               = useState('')
  const [lbSubmitted, setLbSubmitted]     = useState(false)
  const [lbSubmitting, setLbSubmitting]   = useState(false)
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])
  function dismissAchievement(id: string) { setNewAchievements(prev => prev.filter(a => a.id !== id)) }
  const answersRef   = useRef<boolean[]>([])
  const startTimeRef = useRef<number>(0)
  const elapsedRef   = useRef<number | null>(null)
  const { t } = useLanguage()

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

  useEffect(() => {
    const next = questions[idx + 1]
    const gifSrc = primaryGifSrc(next?.gif_url, next?.gif_path)
    if (!gifSrc) return
    const img = new Image()
    img.onerror = () => {}
    img.src = gifSrc
  }, [idx, questions])

  const fetchLeaderboard = useCallback(() => {
    getDailyLeaderboard().then(setLeaderboard).catch(() => {})
  }, [])

  useEffect(() => {
    if (phase !== 'finished') return
    // Pre-fill name from pseudo if available
    const stored = localStorage.getItem('fda_pseudo')?.trim()
    if (stored) setLbName(stored)
    // Slight delay so any just-submitted score has propagated
    const t = setTimeout(fetchLeaderboard, 900)
    return () => clearTimeout(t)
  }, [phase, fetchLeaderboard])

  useEffect(() => {
    if (phase !== 'finished' || alreadyPlayed) return
    // User just finished for the first time today
    updateLifetime({ questions: 10, totalCorrect: score })
    const newly = checkAndUnlock({ dailyScore: score })
    if (newly.length > 0) setNewAchievements(newly)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  useEffect(() => {
    if (!lbSubmitted || leaderboard.length === 0) return
    const rank1 = leaderboard[0]?.player_name === lbName
    if (rank1) {
      const newly = checkAndUnlock({ dailyRank: 1 })
      if (newly.length > 0) setNewAchievements(prev => [...prev, ...newly.filter(a => !prev.find(x => x.id === a.id))])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaderboard])

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
    startTimeRef.current = Date.now()
    setTimeLeft(TIME_PER_Q)
    loadQuestions()
    setPhase('playing')
  }

  const handleChoice = (choice: string) => {
    if (state !== 'idle') return
    const correct = choice === questions[idx]?.answer
    setSelected(choice)
    setState(correct ? 'correct' : 'wrong')
    if (correct) { playCorrect(); setScore(s => s + 1) } else playWrong()
    const next = [...answersRef.current, correct]
    answersRef.current = next
    setAnswers(next)
  }

  useEffect(() => {
    if (phase !== 'playing') return
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const question = questions[idx]
      if (question?.choices && state === 'idle') {
        const num = parseInt(e.key)
        if (num >= 1 && num <= question.choices.length) { handleChoice(question.choices[num - 1]); return }
        const ci = ['a','b','c','d'].indexOf(e.key.toLowerCase())
        if (ci >= 0 && ci < question.choices.length) { handleChoice(question.choices[ci]); return }
      }
      if (e.key === 'Enter' && state !== 'idle') handleNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, state, idx, questions])

  // Time-trial: per-question countdown
  useEffect(() => {
    if (phase !== 'playing' || state !== 'idle' || !questions[idx]) return
    const iv = setInterval(() => setTimeLeft(p => Math.max(0, p - 1)), 1000)
    return () => clearInterval(iv)
  }, [phase, state, idx, questions])

  // Out of time → the question counts as wrong
  useEffect(() => {
    if (phase !== 'playing' || state !== 'idle' || timeLeft > 0) return
    playWrong()
    setSelected(null)
    setState('wrong')
    const next = [...answersRef.current, false]
    answersRef.current = next
    setAnswers(next)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase, state])

  const handleNext = () => {
    if (idx + 1 >= questions.length) {
      const finalAnswers = answersRef.current
      const finalScore   = finalAnswers.filter(Boolean).length
      const accuracy     = Math.round(finalScore / finalAnswers.length * 100)
      const elapsed      = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 100) / 10 : undefined
      elapsedRef.current = elapsed ?? null
      const streakData   = saveResultAndStreak(finalAnswers, finalScore)
      track('daily_played', { score: finalScore, accuracy })
      setStreak(streakData.streak)
      setScore(finalScore)
      // Auto-submit to leaderboard if pseudo already set
      const pseudo = localStorage.getItem('fda_pseudo')?.trim()
      if (pseudo) {
        setLbName(pseudo)
        setLbSubmitted(true)
        submitDailyScore(pseudo, finalScore, accuracy, elapsed).catch(() => {})
        // Daily also feeds the global (mondial) leaderboard — once per day to avoid double-counting
        if (localStorage.getItem('fda_daily_global_date') !== todayStr()) {
          submitGlobalScore(pseudo, finalScore, finalAnswers.length).catch(() => {})
          localStorage.setItem('fda_daily_global_date', todayStr())
        }
      }
      setPhase('finished')
    } else {
      setIdx(i => i + 1)
      setSelected(null)
      setState('idle')
      setTimeLeft(TIME_PER_Q)
    }
  }

  const handleLbSubmit = async () => {
    const name = lbName.trim()
    if (!name || lbSubmitting || lbSubmitted) return
    setLbSubmitting(true)
    try {
      const acc = answers.length ? Math.round(score / answers.length * 100) : 0
      await submitDailyScore(name, score, acc, elapsedRef.current ?? undefined)
      // Daily also feeds the global (mondial) leaderboard — once per day to avoid double-counting
      if (localStorage.getItem('fda_daily_global_date') !== todayStr()) {
        submitGlobalScore(name, score, answers.length).catch(() => {})
        localStorage.setItem('fda_daily_global_date', todayStr())
      }
      localStorage.setItem('fda_pseudo', name)
      setLbSubmitted(true)
      fetchLeaderboard()
    } catch {
      // silent
    } finally {
      setLbSubmitting(false)
    }
  }

  const copyResult = async () => {
    const emojis = answers.map(a => a ? '✅' : '❌').join('')
    const date   = formatDate()
    const lines  = [
      `FIGHT DATA ARENA — DAILY ${date}`,
      `${emojis}  ${score}/10`,
    ]
    if (streak >= 2) lines.push(t('daily.streak', { n: streak }))
    lines.push('fightdata.app/quiz/daily')
    const text = lines.join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard not available
    }
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
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color: 'rgba(255,255,255,0.68)', marginTop: '10px' }}>
              {t('daily.one_per_day')}
            </div>
            <div style={{ display: 'inline-flex', marginTop: '12px', padding: '5px 13px', border: `1px solid ${COLOR}55`, background: `${COLOR}12`, fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: '2px', color: COLOR }}>
              {t('daily.time_trial')}
            </div>
          </div>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, maxWidth: '320px' }}>
            {t('daily.intro_desc')}
          </div>
          <button onClick={startPlaying} style={{
            width: '100%', maxWidth: '280px', padding: '14px',
            background: `linear-gradient(90deg, ${COLOR_ALT}, ${COLOR})`,
            border: 'none', cursor: 'pointer',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '1.1rem', letterSpacing: '6px', color: '#000',
            boxShadow: `0 0 20px ${COLOR}33`, transition: 'all 0.2s',
          }}>
            {t('daily.start')}
          </button>
          <Link href="/" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>
            {t('daily.home')}
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
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color: 'rgba(255,255,255,0.7)', marginTop: '8px' }}>
                {t('daily.already_played')}
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
                    background: correct ? 'rgba(74,222,128,0.15)' : 'rgba(255,45,120,0.12)',
                    border: `1px solid ${correct ? '#4ade80' : '#ff2d78'}`,
                  }}>
                    <Icon name={correct ? 'check' : 'cross'} size={18} color={correct ? '#4ade80' : '#ff2d78'} />
                  </div>
                ))}
              </div>
            ))}
          </div>
          {streak >= 2 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.2rem', letterSpacing: '3px', color: '#ffe000', textShadow: '0 0 12px #ffe000' }}>
              <Icon name="hardcore" size={18} color="#ffe000" /> {t('daily.streak', { n: streak })}
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
            {copied ? t('daily.copied') : t('daily.copy_result')}
          </button>

          <AchievementToast achievements={newAchievements} onDismiss={dismissAchievement} />

          {/* Leaderboard */}
          <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-4)', color: COLOR }}>
              {t('daily.leaderboard')}
            </div>

            {/* Name submit — only if not yet submitted */}
            {!lbSubmitted && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={lbName}
                  onChange={e => setLbName(e.target.value.slice(0, 24))}
                  onKeyDown={e => e.key === 'Enter' && handleLbSubmit()}
                  placeholder={t('daily.leaderboard_name')}
                  maxLength={24}
                  style={{
                    flex: 1, padding: '9px 14px',
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${COLOR}44`,
                    color: '#fff', outline: 'none',
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: '0.75rem', letterSpacing: '2px',
                  }}
                />
                <button
                  onClick={handleLbSubmit}
                  disabled={!lbName.trim() || lbSubmitting}
                  style={{
                    padding: '9px 16px',
                    background: lbName.trim() ? `linear-gradient(90deg, ${COLOR_ALT}, ${COLOR})` : 'rgba(255,255,255,0.06)',
                    border: 'none', cursor: lbName.trim() ? 'pointer' : 'default',
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: '0.8rem', letterSpacing: '2px',
                    color: lbName.trim() ? '#000' : 'rgba(255,255,255,0.6)',
                    transition: 'all 0.2s', whiteSpace: 'nowrap',
                  }}
                >
                  {lbSubmitting ? '...' : t('daily.leaderboard_join')}
                </button>
              </div>
            )}

            {lbSubmitted && (
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color: COLOR }}>
                {t('daily.leaderboard_ok')} — {lbName}
              </div>
            )}

            {/* Top 10 */}
            {leaderboard.length === 0 ? (
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)', color: 'rgba(255,255,255,0.65)' }}>
                {t('daily.leaderboard_empty')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {leaderboard.map(entry => {
                  const isMe = lbSubmitted && entry.player_name === lbName
                  return (
                    <div key={entry.rank} style={{
                      display: 'grid', gridTemplateColumns: '28px 1fr 48px 52px',
                      padding: '7px 12px', alignItems: 'center', gap: '8px',
                      background: isMe ? `${COLOR}12` : entry.rank <= 3 ? 'rgba(255,255,255,0.03)' : 'transparent',
                      border: `1px solid ${isMe ? COLOR + '44' : 'rgba(255,255,255,0.05)'}`,
                    }}>
                      <span style={{
                        fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.85rem', letterSpacing: '1px',
                        color: entry.rank === 1 ? '#ffd700' : entry.rank === 2 ? '#c0c0c0' : entry.rank === 3 ? '#cd7f32' : 'rgba(255,255,255,0.6)',
                      }}>#{entry.rank}</span>
                      <span style={{
                        fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', letterSpacing: '1px',
                        color: isMe ? COLOR : 'rgba(255,255,255,0.7)',
                        textShadow: isMe ? `0 0 8px ${COLOR}` : 'none',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{entry.player_name}</span>
                      <span style={{
                        fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: '1px',
                        color: 'rgba(255,255,255,0.68)', textAlign: 'right',
                      }}>{entry.elapsed_seconds != null ? formatTime(entry.elapsed_seconds) : '—'}</span>
                      <span style={{
                        fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', letterSpacing: '1px',
                        color: isMe ? COLOR : 'rgba(255,255,255,0.65)', textAlign: 'right',
                      }}>{entry.score}/10</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <Link href="/" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>
            {t('daily.home')}
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
            { val: score,           label: t('daily.score') },
            { val: `${idx + 1}/${questions.length}`, label: t('daily.question') },
            { val: `${answers.filter(Boolean).length}/${answers.length || 0}`, label: t('daily.correct') },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.7rem', letterSpacing: '2px', background: `linear-gradient(180deg, #fff, ${COLOR})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {s.val}
              </div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color: 'rgba(255,255,255,0.7)' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.7)', letterSpacing: '4px' }}>
            {t('daily.loading')}
          </div>
        ) : loadError ? (
          <div style={{ fontFamily: "'Share Tech Mono', monospace", color: '#ff2d78', letterSpacing: '3px', textAlign: 'center' }}>
            {t('daily.load_error')}<br />
            <button onClick={loadQuestions} style={{ marginTop: '12px', background: 'none', border: '1px solid #ff2d78', color: '#ff2d78', fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', letterSpacing: '3px', padding: '8px 20px', cursor: 'pointer' }}>
              {t('daily.retry')}
            </button>
          </div>
        ) : !question ? (
          <div style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.7)', letterSpacing: '4px' }}>
            {t('daily.loading')}
          </div>
        ) : (
          <QuestionCard
            gifUrl={question.gif_url}
            gifPath={question.gif_path}
            moveName={question.move_name}
            color={COLOR}
            header={
              <div style={{ padding: '11px 18px', background: 'rgba(0,255,136,0.07)', borderBottom: `1px solid ${COLOR}28`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', letterSpacing: '4px', background: `linear-gradient(90deg, ${COLOR}, ${COLOR_ALT})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  DAILY {formatDate()}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {state === 'idle' && (
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.15rem', letterSpacing: '1px', color: timeLeft <= 3 ? '#ff2d78' : COLOR, textShadow: `0 0 8px ${timeLeft <= 3 ? '#ff2d78' : COLOR}`, minWidth: '30px', textAlign: 'right' }}>{timeLeft}s</span>
                  )}
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', letterSpacing: '2px', color: COLOR }}>Q{idx + 1}/10</span>
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.7)' }}>{question.fighter_slug}</span>
                </div>
              </div>
            }
            questionText={
              <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', fontWeight: 600, lineHeight: 1.4, color: 'rgba(255,255,255,0.9)' }}>
                {t('play.q_what_is')} <span style={{ color: COLOR }}>startup</span> {t('play.q_of')}{' '}
                <strong style={{ color: '#fff' }}>{question.move_name}</strong> ?
              </p>
            }
            choices={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {question.choices.map((choice, i) => (
                  <button key={choice} onClick={() => handleChoice(choice)} style={makeChoiceStyle(choice, question.answer, selected, state === 'idle')}>
                    <span style={{ width: '20px', height: '20px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.18)', fontSize: '0.62rem' }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {choice} frames
                  </button>
                ))}
              </div>
            }
            feedback={
              <>
                {state !== 'idle' && (
                  <div style={{ padding: '9px 14px', marginBottom: '10px', background: state === 'correct' ? 'rgba(74,222,128,0.1)' : 'rgba(255,45,120,0.1)', border: `1px solid ${state === 'correct' ? '#4ade80' : '#ff2d78'}`, fontFamily: "'Rajdhani', sans-serif", fontSize: '0.9rem', fontWeight: 700, color: state === 'correct' ? '#4ade80' : '#ff2d78' }}>
                    {state === 'correct'
                      ? t('daily.feedback_correct', { n: question.answer })
                      : t('daily.feedback_wrong', { n: question.answer })}
                  </div>
                )}
                {state !== 'idle' && (
                  <button
                    onClick={handleNext}
                    style={{ width: '100%', padding: '13px', background: `linear-gradient(90deg, ${COLOR_ALT}, ${COLOR})`, border: 'none', cursor: 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.95rem', letterSpacing: '4px', color: '#000', transition: 'all 0.2s' }}>
                    {idx + 1 >= questions.length ? t('daily.see_results') : t('daily.next_question')}
                  </button>
                )}
              </>
            }
          />
        )}
        <Link href="/" style={{ marginTop: '16px', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>
          {t('daily.home')}
        </Link>
      </main>
    </>
  )
}

export default function DailyChallengePage() {
  return <Suspense><DailyPage /></Suspense>
}

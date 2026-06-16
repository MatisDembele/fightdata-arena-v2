'use client'
import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getWeeklyQuiz, submitWeeklyScore, getWeeklyLeaderboard, submitGlobalScore, type LeaderboardEntry } from '@/lib/api'
import { checkAndUnlock, type Achievement } from '@/lib/achievements'
import AchievementToast from '@/components/AchievementToast'
import type { QuizQuestion } from '@/types'
import { track } from '@vercel/analytics'
import { useLanguage } from '@/lib/i18n'
import QuestionCard, { makeChoiceStyle } from '@/components/QuestionCard'
import { playCorrect, playWrong } from '@/lib/sounds'
import { primaryGifSrc } from '@/lib/gif'

const COLOR     = '#ff6a00'
const COLOR_ALT = '#d97706'

type Phase       = 'intro' | 'playing' | 'finished'
type AnswerState = 'idle' | 'correct' | 'wrong'

const TOTAL_Q = 20

interface WeeklyResult {
  week: string
  answers: boolean[]
  score: number
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.round(s % 60)
  if (m > 0) return `${m}m${String(sec).padStart(2, '0')}s`
  return `${sec}s`
}

function mondayStr(): string {
  const today = new Date()
  const day   = today.getUTCDay()
  const diff  = day === 0 ? -6 : 1 - day
  const mon   = new Date(today)
  mon.setUTCDate(today.getUTCDate() + diff)
  return mon.toISOString().split('T')[0]
}

function weekNumber(): number {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function getStoredResult(): WeeklyResult | null {
  try {
    const raw = localStorage.getItem('fda_weekly_result')
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function saveResult(answers: boolean[], score: number): void {
  localStorage.setItem('fda_weekly_result', JSON.stringify({ week: mondayStr(), answers, score }))
}

function WeeklyPage() {
  const [phase, setPhase]         = useState<Phase>('intro')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [idx, setIdx]             = useState(0)
  const [answers, setAnswers]     = useState<boolean[]>([])
  const [selected, setSelected]   = useState<string | null>(null)
  const [state, setState]         = useState<AnswerState>('idle')
  const [score, setScore]         = useState(0)
  const [copied, setCopied]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [alreadyPlayed, setAlreadyPlayed] = useState<WeeklyResult | null>(null)
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
    if (result?.week === mondayStr()) {
      answersRef.current = result.answers
      setAlreadyPlayed(result)
      setAnswers(result.answers)
      setScore(result.score)
      setPhase('finished')
    }
  }, [])

  useEffect(() => {
    const next = questions[idx + 1]
    const gifSrc = primaryGifSrc(next?.gif_url, next?.gif_path)
    if (gifSrc) {
      const img = new Image()
      img.src = gifSrc
    }
  }, [idx, questions])

  const fetchLeaderboard = useCallback(() => {
    getWeeklyLeaderboard().then(setLeaderboard).catch(() => {})
  }, [])

  useEffect(() => {
    if (phase !== 'finished') return
    const stored = localStorage.getItem('fda_pseudo')?.trim()
    if (stored) setLbName(stored)
    const timer = setTimeout(fetchLeaderboard, 900)
    return () => clearTimeout(timer)
  }, [phase, fetchLeaderboard])

  useEffect(() => {
    if (!lbSubmitted || leaderboard.length === 0) return
    if (leaderboard[0]?.player_name === lbName) {
      const newly = checkAndUnlock({ weeklyRank: 1 })
      if (newly.length > 0) setNewAchievements(prev => [...prev, ...newly.filter(a => !prev.find(x => x.id === a.id))])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaderboard])

  const loadQuestions = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const qs = await getWeeklyQuiz()
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

  const handleNext = () => {
    if (idx + 1 >= questions.length) {
      const finalAnswers = answersRef.current
      const finalScore   = finalAnswers.filter(Boolean).length
      const accuracy     = Math.round(finalScore / finalAnswers.length * 100)
      const elapsed      = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 100) / 10 : undefined
      elapsedRef.current = elapsed ?? null
      saveResult(finalAnswers, finalScore)
      track('weekly_played', { score: finalScore, accuracy })
      setScore(finalScore)
      // Achievements
      const newly = checkAndUnlock({ weeklyScore: finalScore })
      if (newly.length > 0) setNewAchievements(newly)
      const pseudo = localStorage.getItem('fda_pseudo')?.trim()
      if (pseudo) {
        setLbName(pseudo)
        setLbSubmitted(true)
        submitWeeklyScore(pseudo, finalScore, accuracy, elapsed).catch(() => {})
        submitGlobalScore(pseudo, finalScore, finalAnswers.length).catch(() => {})
      }
      setPhase('finished')
    } else {
      setIdx(i => i + 1)
      setSelected(null)
      setState('idle')
    }
  }

  const handleLbSubmit = async () => {
    const name = lbName.trim()
    if (!name || lbSubmitting || lbSubmitted) return
    setLbSubmitting(true)
    try {
      const acc = answers.length ? Math.round(score / answers.length * 100) : 0
      await submitWeeklyScore(name, score, acc, elapsedRef.current ?? undefined)
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
    const wk = weekNumber()
    const rows = [emojis.slice(0, 10), emojis.slice(10)].filter(Boolean)
    const lines = [
      `FIGHT DATA ARENA — WEEKLY W${wk}`,
      ...rows,
      `${score}/${TOTAL_Q}`,
      'fightdata.app/quiz/weekly',
    ]
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
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
              📆 {t('weekly.day_label', { n: weekNumber() })}
            </div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2.5rem, 8vw, 4rem)', letterSpacing: '8px', color: '#fff', textShadow: `0 0 20px ${COLOR}, 0 0 50px ${COLOR}55`, lineHeight: 1 }}>
              {t('weekly.title')}
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color: 'rgba(255,255,255,0.25)', marginTop: '10px' }}>
              {t('quiz.mode_weekly_sub')}
            </div>
          </div>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.9rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '320px' }}>
            {t('quiz.mode_weekly_desc')}
          </div>
          <button onClick={startPlaying} style={{
            width: '100%', maxWidth: '280px', padding: '14px',
            background: `linear-gradient(90deg, ${COLOR_ALT}, ${COLOR})`,
            border: 'none', cursor: 'pointer',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '1.1rem', letterSpacing: '6px', color: '#fff',
            boxShadow: `0 0 20px ${COLOR}33`, transition: 'all 0.2s',
          }}>
            {t('daily.start')}
          </button>
          <Link href="/quiz" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }}>
            {t('play.change_mode')}
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
              {t('weekly.title')}
            </div>
            {alreadyPlayed && (
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>
                {t('weekly.already_played')}
              </div>
            )}
          </div>

          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(3rem, 10vw, 5rem)', letterSpacing: '4px', color: '#fff', textShadow: `0 0 30px ${COLOR}88`, lineHeight: 1 }}>
            {score}<span style={{ fontSize: '0.5em', color: COLOR }}>/{TOTAL_Q}</span>
          </div>

          {/* Answer grid — 2 rows of 10 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
            {[answers.slice(0, 10), answers.slice(10, 20)].map((row, ri) => (
              <div key={ri} style={{ display: 'flex', gap: '4px' }}>
                {row.map((correct, ci) => (
                  <div key={ci} style={{
                    width: '28px', height: '28px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.9rem',
                    background: correct ? 'rgba(74,222,128,0.15)' : 'rgba(255,45,120,0.12)',
                    border: `1px solid ${correct ? '#4ade80' : '#ff2d78'}`,
                  }}>
                    {correct ? '✅' : '❌'}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <AchievementToast achievements={newAchievements} onDismiss={dismissAchievement} />

          <button onClick={copyResult} style={{
            width: '100%', maxWidth: '280px', padding: '14px',
            background: copied ? 'rgba(74,222,128,0.2)' : `linear-gradient(90deg, ${COLOR_ALT}, ${COLOR})`,
            border: copied ? '1px solid #4ade80' : 'none',
            cursor: 'pointer',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '1rem', letterSpacing: '4px',
            color: copied ? '#4ade80' : '#fff',
            transition: 'all 0.2s',
            boxShadow: copied ? 'none' : `0 0 16px ${COLOR}33`,
          }}>
            {copied ? t('weekly.copied') : t('weekly.copy_result')}
          </button>

          {/* Leaderboard */}
          <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-4)', color: COLOR }}>
              {t('weekly.leaderboard')}
            </div>

            {!lbSubmitted && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={lbName}
                  onChange={e => setLbName(e.target.value.slice(0, 24))}
                  onKeyDown={e => e.key === 'Enter' && handleLbSubmit()}
                  placeholder={t('weekly.leaderboard_name')}
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
                    color: lbName.trim() ? '#fff' : 'rgba(255,255,255,0.2)',
                    transition: 'all 0.2s', whiteSpace: 'nowrap',
                  }}
                >
                  {lbSubmitting ? '...' : t('weekly.leaderboard_join')}
                </button>
              </div>
            )}

            {lbSubmitted && (
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color: COLOR }}>
                {t('weekly.leaderboard_ok')} — {lbName}
              </div>
            )}

            {leaderboard.length === 0 ? (
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)', color: 'rgba(255,255,255,0.2)' }}>
                {t('weekly.leaderboard_empty')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {leaderboard.map(entry => {
                  const isMe = lbSubmitted && entry.player_name === lbName
                  return (
                    <div key={entry.rank} style={{
                      display: 'grid', gridTemplateColumns: '28px 1fr 48px 56px',
                      padding: '7px 12px', alignItems: 'center', gap: '8px',
                      background: isMe ? `${COLOR}12` : entry.rank <= 3 ? 'rgba(255,255,255,0.03)' : 'transparent',
                      border: `1px solid ${isMe ? COLOR + '44' : 'rgba(255,255,255,0.05)'}`,
                    }}>
                      <span style={{
                        fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.85rem', letterSpacing: '1px',
                        color: entry.rank === 1 ? '#ffd700' : entry.rank === 2 ? '#c0c0c0' : entry.rank === 3 ? '#cd7f32' : 'rgba(255,255,255,0.3)',
                      }}>#{entry.rank}</span>
                      <span style={{
                        fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', letterSpacing: '1px',
                        color: isMe ? COLOR : 'rgba(255,255,255,0.7)',
                        textShadow: isMe ? `0 0 8px ${COLOR}` : 'none',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{entry.player_name}</span>
                      <span style={{
                        fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: '1px',
                        color: 'rgba(255,255,255,0.25)', textAlign: 'right',
                      }}>{entry.elapsed_seconds != null ? formatTime(entry.elapsed_seconds) : '—'}</span>
                      <span style={{
                        fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', letterSpacing: '1px',
                        color: isMe ? COLOR : 'rgba(255,255,255,0.5)', textAlign: 'right',
                      }}>{entry.score}/{TOTAL_Q}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <Link href="/quiz" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }}>
            {t('play.change_mode')}
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
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'rgba(255,255,255,0.05)' }}>
            <div style={{ height: '100%', width: `${(idx / TOTAL_Q) * 100}%`, background: `linear-gradient(90deg, ${COLOR_ALT}, ${COLOR})`, transition: 'width 0.3s' }} />
          </div>
          {[
            { val: score,                        label: t('daily.score') },
            { val: `${idx + 1}/${TOTAL_Q}`,      label: t('daily.question') },
            { val: `${answers.filter(Boolean).length}/${answers.length || 0}`, label: t('daily.correct') },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.7rem', letterSpacing: '2px', background: `linear-gradient(180deg, #fff, ${COLOR})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {s.val}
              </div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color: 'rgba(255,255,255,0.28)' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.3)', letterSpacing: '4px' }}>
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
          <div style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.3)', letterSpacing: '4px' }}>
            {t('daily.loading')}
          </div>
        ) : (
          <QuestionCard
            gifUrl={question.gif_url}
            gifPath={question.gif_path}
            moveName={question.move_name}
            color={COLOR}
            header={
              <div style={{ padding: '11px 18px', background: `${COLOR}12`, borderBottom: `1px solid ${COLOR}28`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', letterSpacing: '4px', background: `linear-gradient(90deg, ${COLOR}, ${COLOR_ALT})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {t('weekly.title')}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', letterSpacing: '2px', color: COLOR }}>Q{idx + 1}/{TOTAL_Q}</span>
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)' }}>{question.fighter_slug}</span>
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
                    {question.on_block_value && (
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: '1px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>
                        {question.move_name} — {question.answer}f startup · {question.on_block_value} on block
                      </div>
                    )}
                  </div>
                )}
                {state !== 'idle' && (
                  <button
                    onClick={handleNext}
                    style={{ width: '100%', padding: '13px', background: `linear-gradient(90deg, ${COLOR_ALT}, ${COLOR})`, border: 'none', cursor: 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.95rem', letterSpacing: '4px', color: '#fff', transition: 'all 0.2s' }}>
                    {idx + 1 >= questions.length ? t('daily.see_results') : t('daily.next_question')}
                  </button>
                )}
              </>
            }
          />
        )}
        <Link href="/quiz" style={{ marginTop: '16px', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }}>
          {t('play.change_mode')}
        </Link>
      </main>
    </>
  )
}

export default function WeeklyChallengePage() {
  return <Suspense><WeeklyPage /></Suspense>
}

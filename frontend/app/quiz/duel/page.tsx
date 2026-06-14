'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getSeededQuiz } from '@/lib/api'
import { playCorrect, playWrong } from '@/lib/sounds'
import { GifSection, makeChoiceStyle } from '@/components/QuestionCard'
import { useLanguage } from '@/lib/i18n'
import { getRank } from '@/lib/constants'
import type { QuizQuestion } from '@/types'

const COLOR     = '#14b8a6'
const COLOR_ALT = '#0d9488'

function parseIntParam(s: string | null): number | null {
  if (!s) return null
  const n = parseInt(s, 10)
  return Number.isNaN(n) ? null : n
}

function generateSeed(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

type Phase = 'loading' | 'intro' | 'playing' | 'finished'

function DuelQuiz() {
  const params = useSearchParams()
  const router = useRouter()
  const { t } = useLanguage()

  const seed      = params.get('seed')
  const p1score = parseIntParam(params.get('p1'))
  const p1acc   = parseIntParam(params.get('p1a'))

  const [phase,       setPhase]       = useState<Phase>('loading')
  const [questions,   setQuestions]   = useState<QuizQuestion[]>([])
  const [idx,         setIdx]         = useState(0)
  const [selected,    setSelected]    = useState<string | null>(null)
  const [answerState, setAnswerState] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [score,       setScore]       = useState(0)
  const [copied,      setCopied]      = useState(false)

  // Generate seed if missing
  useEffect(() => {
    if (!seed) {
      router.replace(`/quiz/duel?seed=${generateSeed()}`)
    }
  }, [seed, router])

  // Fetch seeded questions
  useEffect(() => {
    if (!seed) return
    getSeededQuiz(seed, 10)
      .then(qs => { setQuestions(qs); setPhase('intro') })
      .catch(() => setPhase('intro'))
  }, [seed])

  const question = questions[idx] ?? null
  const total    = questions.length

  const handleChoice = useCallback((choice: string) => {
    if (answerState !== 'idle' || !question) return
    setSelected(choice)
    if (choice === question.answer) {
      playCorrect()
      setAnswerState('correct')
      setScore(s => s + 1)
    } else {
      playWrong()
      setAnswerState('wrong')
    }
  }, [answerState, question])

  const handleNext = useCallback(() => {
    if (idx >= total - 1) {
      setPhase('finished')
    } else {
      setIdx(i => i + 1)
      setSelected(null)
      setAnswerState('idle')
    }
  }, [idx, total])

  useEffect(() => {
    if (phase !== 'playing') return
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) return
      if (question?.choices && answerState === 'idle') {
        const num = parseInt(e.key)
        if (num >= 1 && num <= question.choices.length) { handleChoice(question.choices[num - 1]); return }
        const letter = ['a','b','c','d'].indexOf(e.key.toLowerCase())
        if (letter >= 0 && letter < question.choices.length) { handleChoice(question.choices[letter]); return }
      }
      if (e.key === 'Enter' && answerState !== 'idle') handleNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, question, answerState, handleChoice, handleNext])

  const buildShareUrl = useCallback((myScore: number, myAcc: number) =>
    `${typeof window !== 'undefined' ? window.location.origin : ''}/quiz/duel?seed=${seed}&p1=${myScore}&p1a=${myAcc}`,
  [seed])

  const handleShare = useCallback(async (myScore: number, myAcc: number) => {
    try {
      await navigator.clipboard.writeText(buildShareUrl(myScore, myAcc))
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch { /* clipboard unavailable */ }
  }, [buildShareUrl])

  // ── LOADING ──
  if (phase === 'loading' || !seed) {
    return (
      <>
        <Navbar />
        <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)' }}>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.3)', letterSpacing: '4px', fontSize: '0.7rem' }}>
            LOADING...
          </div>
        </main>
      </>
    )
  }

  // ── INTRO ──
  if (phase === 'intro') {
    return (
      <>
        <Navbar />
        <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', minHeight: 'calc(100vh - 60px)' }}>
          <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2.5rem, 8vw, 4rem)', letterSpacing: '10px', lineHeight: 1, background: `linear-gradient(135deg, ${COLOR}, ${COLOR_ALT})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: `drop-shadow(0 0 18px ${COLOR}55)` }}>
                DUEL
              </div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.52rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>
                {t('quiz.mode_duel_sub')}
              </div>
            </div>

            {/* Seed display */}
            <div style={{ padding: '16px 20px', background: `${COLOR}10`, border: `1px solid ${COLOR}30`, display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.42rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.25)' }}>
                {t('play.duel_intro_seed')}
              </div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', letterSpacing: '6px', color: COLOR, textShadow: `0 0 14px ${COLOR}88` }}>
                {seed}
              </div>
            </div>

            {/* Challenger score (if link has one) */}
            {p1score !== null && (
              <div style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '1.2rem' }}>⚔️</div>
                <div>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.42rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.3)', marginBottom: '4px' }}>
                    {t('play.duel_challenger')}
                  </div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1rem', letterSpacing: '3px', color: '#fff' }}>
                    {p1score}/{total || 10} — {p1acc}%
                  </div>
                </div>
              </div>
            )}

            {!p1score && (
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.45rem', letterSpacing: '1px', color: 'rgba(255,255,255,0.2)', lineHeight: 1.6 }}>
                {t('play.duel_no_challenger')}
              </div>
            )}

            <button
              onClick={() => setPhase('playing')}
              style={{ width: '100%', padding: '16px', background: `linear-gradient(90deg, ${COLOR_ALT}, ${COLOR})`, border: 'none', cursor: 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', letterSpacing: '6px', color: '#fff', boxShadow: `0 0 24px ${COLOR}33` }}
            >
              {t('play.start')} 10Q
            </button>

            <Link href="/quiz" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.2)', textDecoration: 'none', textAlign: 'center' }}>
              {t('play.change_mode')}
            </Link>
          </div>
        </main>
      </>
    )
  }

  // ── PLAYING ──
  if (phase === 'playing' && question) {
    const progress = total > 0 ? ((idx) / total) * 100 : 0

    return (
      <>
        <Navbar />
        <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 20px', minHeight: 'calc(100vh - 60px)' }}>

          {/* Score bar */}
          <div className="score-bar">
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${COLOR}, transparent)` }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'rgba(255,255,255,0.05)' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${COLOR_ALT}, ${COLOR})`, transition: 'width 0.3s' }} />
            </div>
            {[
              { val: score,        label: t('play.score_label') },
              { val: `${idx + 1}/${total}`, label: t('play.score_played') },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.7rem', letterSpacing: '2px', background: `linear-gradient(180deg, #fff, ${COLOR})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {stat.val}
                </div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.52rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.28)' }}>{stat.label}</div>
              </div>
            ))}
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', letterSpacing: '4px', background: `linear-gradient(90deg, ${COLOR}, ${COLOR_ALT})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              DUEL {seed}
            </div>
          </div>

          {/* Question card */}
          <div style={{ width: '100%', maxWidth: '500px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)' }}>

            <div style={{ padding: '11px 18px', background: `${COLOR}12`, borderBottom: `1px solid ${COLOR}28`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', letterSpacing: '4px', background: `linear-gradient(90deg, ${COLOR}, ${COLOR_ALT})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                DUEL
              </span>
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', letterSpacing: '2px', color: COLOR, textTransform: 'uppercase' }}>
                {question.fighter_slug}
              </span>
            </div>

            <GifSection gifUrl={question.gif_url} gifPath={question.gif_path} moveName={question.move_name} color={COLOR} fallback="HITBOX PREVIEW" />

            <div style={{ padding: '16px 18px 12px' }}>
              <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', fontWeight: 600, lineHeight: 1.4, color: 'rgba(255,255,255,0.9)' }}>
                {t('play.q_what_is')} <span style={{ color: COLOR }}>startup</span> {t('play.q_of')}{' '}
                <strong style={{ color: '#fff' }}>{question.move_name}</strong> ?
              </p>
            </div>

            <div style={{ padding: '0 18px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {question.choices.map((choice, i) => (
                  <button key={choice} onClick={() => handleChoice(choice)} style={makeChoiceStyle(choice, question.answer, selected, answerState === 'idle')}>
                    <span style={{ width: '20px', height: '20px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.18)', fontSize: '0.62rem', fontFamily: "'Share Tech Mono', monospace" }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {choice} frames
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: '12px 18px 18px' }}>
              {answerState !== 'idle' && (
                <div style={{ padding: '9px 14px', marginBottom: '10px', background: answerState === 'correct' ? 'rgba(74,222,128,0.1)' : 'rgba(255,45,120,0.1)', border: `1px solid ${answerState === 'correct' ? '#4ade80' : '#ff2d78'}`, fontFamily: "'Rajdhani', sans-serif", fontSize: '0.9rem', fontWeight: 700, color: answerState === 'correct' ? '#4ade80' : '#ff2d78' }}>
                  {answerState === 'correct'
                    ? t('play.feedback_correct_startup', { n: question.answer })
                    : t('play.feedback_wrong_startup', { n: question.answer })}
                  {question.on_block_value && (
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.45rem', letterSpacing: '1px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>
                      {question.move_name} — {question.answer}f startup · {question.on_block_value} on block
                    </div>
                  )}
                </div>
              )}
              <button onClick={handleNext} style={{ width: '100%', padding: '13px', background: idx >= total - 1 && answerState !== 'idle' ? `linear-gradient(90deg, ${COLOR}, ${COLOR_ALT})` : `linear-gradient(90deg, ${COLOR_ALT}, ${COLOR})`, border: 'none', cursor: 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.95rem', letterSpacing: '4px', color: '#fff', boxShadow: `0 0 16px ${COLOR}33` }}>
                {answerState === 'idle'
                  ? t('play.skip')
                  : idx >= total - 1
                  ? t('play.see_results')
                  : t('play.next_question')}
              </button>
            </div>
          </div>

          <Link href="/quiz" style={{ marginTop: '16px', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }}>
            {t('play.change_mode')}
          </Link>
        </main>
      </>
    )
  }

  // ── FINISHED ──
  const finalScore = score
  const finalAcc   = total > 0 ? Math.round((finalScore / total) * 100) : 0
  const rank       = getRank(finalAcc)

  const hasChallenger = p1score !== null && p1acc !== null
  const youWin  = hasChallenger && finalScore > p1score!
  const youLose = hasChallenger && finalScore < p1score!

  const resultLabel = youWin ? t('play.duel_win') : youLose ? t('play.duel_lose') : hasChallenger ? t('play.duel_tie') : rank.label

  return (
    <>
      <Navbar />
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', minHeight: 'calc(100vh - 60px)' }}>
        <div className="animate-fadeInUp" style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', textAlign: 'center' }}>

          <div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.52rem', letterSpacing: '4px', color: 'rgba(255,255,255,0.3)', marginBottom: '12px' }}>
              DUEL — SEED {seed}
            </div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2.5rem, 10vw, 4rem)', letterSpacing: '8px', lineHeight: 1, background: `linear-gradient(135deg, ${hasChallenger ? (youWin ? '#4ade80' : youLose ? '#ff2d78' : '#ffe000') : rank.color}, ${hasChallenger ? (youWin ? '#00f0ff' : youLose ? '#ff6a00' : '#f59e0b') : rank.colorAlt})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: `drop-shadow(0 0 18px ${hasChallenger ? (youWin ? '#4ade80' : youLose ? '#ff2d78' : '#ffe000') : rank.color}66)` }}>
              {resultLabel}
            </div>
          </div>

          {/* VS comparison */}
          {hasChallenger ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', width: '100%', gap: '8px', alignItems: 'center' }}>
              <div style={{ padding: '20px 12px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${youWin ? '#4ade80' : 'rgba(255,255,255,0.08)'}` }}>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.42rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.3)', marginBottom: '8px' }}>{t('play.duel_you')}</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', letterSpacing: '2px', color: youWin ? '#4ade80' : '#fff' }}>{finalScore}/{total}</div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.5rem', letterSpacing: '1px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>{finalAcc}%</div>
              </div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', letterSpacing: '3px', color: COLOR }}>{t('play.duel_vs')}</div>
              <div style={{ padding: '20px 12px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${youLose ? '#ff2d78' : 'rgba(255,255,255,0.08)'}` }}>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.42rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.3)', marginBottom: '8px' }}>{t('play.duel_challenger')}</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', letterSpacing: '2px', color: youLose ? '#ff2d78' : '#fff' }}>{p1score}/{total}</div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.5rem', letterSpacing: '1px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>{p1acc}%</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', width: '100%', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              {[
                { val: `${finalScore}/${total}`, label: t('play.score_label') },
                { val: `${finalAcc}%`,           label: t('play.precision') },
              ].map((stat, i) => (
                <div key={i} style={{ padding: '20px 12px', background: 'rgba(0,0,0,0.3)', borderRight: i === 0 ? '1px solid rgba(255,255,255,0.08)' : 'none', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.6rem, 6vw, 2.4rem)', letterSpacing: '2px', color: rank.color, textShadow: `0 0 12px ${rank.color}88` }}>{stat.val}</div>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.45rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.3)', marginTop: '6px' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', width: '100%', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleShare(finalScore, finalAcc)}
              style={{ flex: '1 1 0', padding: '13px 12px', background: copied ? 'rgba(74,222,128,0.12)' : `linear-gradient(90deg, ${COLOR_ALT}, ${COLOR})`, border: copied ? '1px solid #4ade80' : 'none', cursor: 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.95rem', letterSpacing: '3px', color: copied ? '#4ade80' : '#fff', transition: 'all 0.3s' }}
            >
              {copied ? t('play.duel_link_copied') : t('play.duel_share')}
            </button>
            <button
              onClick={() => { setIdx(0); setScore(0); setSelected(null); setAnswerState('idle'); setPhase('playing') }}
              style={{ flex: '1 1 0', padding: '13px 12px', background: 'none', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.95rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.45)' }}
            >
              {t('play.replay')}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
            <Link href="/quiz" style={{ flex: '1 1 0', padding: '10px', background: 'none', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.25)', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '3px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {t('play.modes_btn')}
            </Link>
            <Link href={`/quiz/duel?seed=${generateSeed()}`} style={{ flex: '1 1 0', padding: '10px', background: 'none', border: `1px solid ${COLOR}33`, color: COLOR, fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '3px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              NEW DUEL
            </Link>
          </div>

        </div>
      </main>
    </>
  )
}

export default function DuelPage() {
  return <Suspense><DuelQuiz /></Suspense>
}

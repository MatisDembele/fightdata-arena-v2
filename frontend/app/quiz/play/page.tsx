'use client'
import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getRandomQuiz, getFighterQuiz, getRandomPunish, getRandomDamage, getRandomOnBlock, getRandomOnHit, getRandomRecovery, submitGlobalScore, submitSurvivalScore, getSurvivalLeaderboard, invalidateLeaderboardCache, type SurvivalLeaderboardEntry } from '@/lib/api'
import { playCorrect, playWrong, getSoundEnabled, toggleSound } from '@/lib/sounds'
import { checkAndUnlock, updateLifetime, RARITY_COLOR, type Achievement, type LifetimeDelta } from '@/lib/achievements'
import type { QuizQuestion } from '@/types'
import { track } from '@vercel/analytics'
import { useLanguage, type DictKey } from '@/lib/i18n'
import { GifSection, makeChoiceStyle } from '@/components/QuestionCard'
import { MODE_COLORS, MODE_COLORS_ALT, getRank, type Rank } from '@/lib/constants'

type AnswerState = 'idle' | 'correct' | 'wrong'

interface HistoryEntry {
  question: QuizQuestion
  userAnswer: string
  correct: boolean
}

function QuizPlay() {
  const params = useSearchParams()
  const mode   = params.get('mode') || 'random'
  const slug   = params.get('slug') || ''
  const { t } = useLanguage()

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
  const seenMovesRef     = useRef<Set<string>>(new Set())

  const [sessionPhase, setSessionPhase]   = useState<'selector' | 'playing' | 'finished'>('selector')
  const [sessionLength, setSessionLength] = useState<number>(10)
  const [maxCombo, setMaxCombo]           = useState(0)
  const [copied, setCopied]               = useState(false)
  const [isNewRecord, setIsNewRecord]     = useState(false)
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])
  const [bestRecord, setBestRecord]       = useState<{ bestScore: number; bestAccuracy: number } | null>(null)
  const historyRef                        = useRef<HistoryEntry[]>([])
  const [showReview, setShowReview]       = useState(false)
  const [survivalLb,    setSurvivalLb]   = useState<SurvivalLeaderboardEntry[]>([])
  const [survivalPseudo,setSurvivalPseudo]= useState('')

  const isHardcore  = mode === 'hardcore'
  const isInput     = mode === 'input'
  const isPunish    = mode === 'punish'
  const isSurvival  = mode === 'survival'
  const isDamage    = mode === 'damage'
  const isOnBlock   = mode === 'onblock'
  const isOnHit     = mode === 'onhit'
  const isRecovery  = mode === 'recovery'
  const isCustom    = mode === 'custom'
  const isMistakes  = mode === 'mistakes'

  const [soundEnabled, setSoundEnabled] = useState(true)
  useEffect(() => { setSoundEnabled(getSoundEnabled()) }, [])

  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0

  const modeColor    = MODE_COLORS[mode]     ?? '#ff2d78'
  const modeColorAlt = MODE_COLORS_ALT[mode] ?? '#9b1fff'

  const fetchOne = useCallback(async (): Promise<QuizQuestion> => {
    if (isMistakes) {
      const raw = localStorage.getItem('fda_mistakes')
      const bank: Record<string, { question: QuizQuestion }> = raw ? JSON.parse(raw) : {}
      const entries = Object.values(bank)
      if (entries.length === 0) throw new Error('no_mistakes')
      return entries[Math.floor(Math.random() * entries.length)].question
    }
    if (isOnBlock)  return getRandomOnBlock()
    if (isOnHit)    return getRandomOnHit()
    if (isRecovery) return getRandomRecovery()
    if (isPunish) return getRandomPunish()
    if (isDamage) return getRandomDamage()
    if (isCustom) {
      const customFighters = params.get('fighters')?.split(',').filter(Boolean) ?? []
      if (customFighters.length === 0) return getRandomQuiz()
      const randomFighter = customFighters[Math.floor(Math.random() * customFighters.length)]
      return getFighterQuiz(randomFighter)
    }
    if (mode === 'fighter' && slug) return getFighterQuiz(slug)
    return getRandomQuiz()
  }, [mode, slug, isPunish, isDamage, isOnBlock, isOnHit, isRecovery, isCustom, isMistakes, params])

  const fetchUnique = useCallback(async (): Promise<QuizQuestion> => {
    for (let i = 0; i < 4; i++) {
      const q = await fetchOne()
      const key = `${q.fighter_slug}:${q.move_name}`
      if (!seenMovesRef.current.has(key)) return q
    }
    return fetchOne()
  }, [fetchOne])

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
      const q = await fetchUnique()
      seenMovesRef.current.add(`${q.fighter_slug}:${q.move_name}`)
      setQuestion(q)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [fetchUnique])

  const prefetchNext = useCallback(async () => {
    if (prefetchingRef.current) return
    prefetchingRef.current = true
    const myToken = prefetchTokenRef.current
    try {
      const q = await fetchUnique()
      if (prefetchTokenRef.current === myToken) {
        nextQuestionRef.current = q
        const gifSrc = q.gif_path
          ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/${q.gif_path}`
          : q.gif_url
        if (gifSrc) {
          const img = new Image()
          img.src = gifSrc
        }
      }
    } catch {
      // silent
    } finally {
      if (prefetchTokenRef.current === myToken) {
        prefetchingRef.current = false
      }
    }
  }, [fetchUnique])

  useEffect(() => { if (sessionPhase === 'playing') loadQuestion() }, [loadQuestion, sessionPhase])

  useEffect(() => {
    if (state !== 'idle') prefetchNext()
  }, [state, prefetchNext])

  useEffect(() => {
    if (state === 'idle' || !question) return
    historyRef.current.push({
      question: { ...question },
      userAnswer: selected ?? '',
      correct: state === 'correct',
    })
    // Update mistake bank: wrong → save (capped 100), correct → remove
    const mistakeKey = `${question.fighter_slug}:${question.move_name}:${mode}`
    const raw = localStorage.getItem('fda_mistakes')
    const bank: Record<string, { question: QuizQuestion; mode: string; count: number; lastSeen: string }> =
      raw ? JSON.parse(raw) : {}
    if (state === 'wrong') {
      bank[mistakeKey] = {
        question: { ...question },
        mode,
        count: (bank[mistakeKey]?.count ?? 0) + 1,
        lastSeen: new Date().toISOString(),
      }
      const sorted = Object.entries(bank).sort((a, b) =>
        new Date(b[1].lastSeen).getTime() - new Date(a[1].lastSeen).getTime()
      )
      localStorage.setItem('fda_mistakes', JSON.stringify(Object.fromEntries(sorted.slice(0, 100))))
    } else if (state === 'correct' && bank[mistakeKey]) {
      delete bank[mistakeKey]
      localStorage.setItem('fda_mistakes', JSON.stringify(bank))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  useEffect(() => {
    if (isInput && !loading && state === 'idle') {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isInput, loading, state, question])

  useEffect(() => {
    if (sessionPhase !== 'playing' || loading || isInput) return
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (!isPunish && question?.choices) {
        const num = parseInt(e.key)
        if (num >= 1 && num <= question.choices.length && state === 'idle') {
          handleChoice(question.choices[num - 1]); return
        }
        const idx = ['a','b','c','d'].indexOf(e.key.toLowerCase())
        if (idx >= 0 && idx < question.choices.length && state === 'idle') {
          handleChoice(question.choices[idx]); return
        }
      }
      if (e.key === 'Enter' && state !== 'idle') handleNextQuestion()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionPhase, loading, isInput, isPunish, state, question])

  useEffect(() => {
    if (sessionPhase !== 'finished') return
    track('quiz_completed', { mode, score, accuracy })
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
      const key = isCustom ? 'fda_best_custom' : `fda_best_${mode}${mode === 'fighter' ? `_${slug}` : ''}`
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
    // Lifetime + achievements (run after best-score save so checkAndUnlock can read updated keys)
    const delta: LifetimeDelta = { questions: total, totalCorrect: score }
    if (isPunish) delta.punishCorrect = score
    if (mode === 'fighter' && slug) {
      delta.addFighter = slug
      delta.addFighterCorrect = { slug, correct: score }
    }
    updateLifetime(delta)
    const ctx: Parameters<typeof checkAndUnlock>[0] = { mode, score, total, maxCombo }
    if (isSurvival) ctx.survived = score
    if (mode === 'fighter' && slug) ctx.slug = slug
    const newly = checkAndUnlock(ctx)
    if (newly.length > 0) setNewAchievements(newly)

    // Auto-submit to global leaderboard if pseudo set
    if (total > 0) {
      const pseudo = localStorage.getItem('fda_pseudo')?.trim()
      if (pseudo) submitGlobalScore(pseudo, score, total).catch(() => {})
    }
    // Survival leaderboard
    if (isSurvival) {
      const pseudo = localStorage.getItem('fda_pseudo')?.trim() || ''
      setSurvivalPseudo(pseudo)
      if (pseudo) {
        invalidateLeaderboardCache('survival_lb')
        submitSurvivalScore(pseudo, score).catch(() => {})
      }
      getSurvivalLeaderboard().then(setSurvivalLb).catch(() => {})
    }
    // Save session to history (last 30)
    if (total > 0) {
      const record = {
        date: new Date().toISOString(),
        mode,
        score,
        total,
        accuracy: total > 0 ? Math.round((score / total) * 100) : 0,
        maxCombo,
        ...(mode === 'fighter' && slug ? { fighter: slug } : {}),
      }
      const histRaw = localStorage.getItem('fda_history')
      const hist = histRaw ? JSON.parse(histRaw) : []
      hist.unshift(record)
      localStorage.setItem('fda_history', JSON.stringify(hist.slice(0, 30)))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionPhase])

  const handlePunish = (userAnswer: 'punissable' | 'safe') => {
    if (state !== 'idle' || !question) return
    setSelected(userAnswer)
    if (userAnswer === question.answer) handleCorrect(); else handleWrong()
  }

  useEffect(() => {
    if (!isHardcore || state !== 'idle' || loading || !question) return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          setState('wrong')
          setCombo(0)
          setTotal(n => n + 1)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isHardcore, state, loading, question])

  const handleCorrect = () => {
    playCorrect()
    setState('correct')
    setScore(s => s + 1)
    setCombo(s => { const next = s + 1; setMaxCombo(m => Math.max(m, next)); return next })
    setTotal(t => t + 1)
  }

  const handleWrong = () => {
    playWrong()
    setState('wrong')
    setCombo(0)
    setTotal(t => t + 1)
  }

  const handleChoice = (choice: string) => {
    if (state !== 'idle') return
    if (timerRef.current) clearInterval(timerRef.current)
    setSelected(choice)
    if (choice === question?.answer) handleCorrect(); else handleWrong()
  }

  const handleInputSubmit = () => {
    if (state !== 'idle' || !inputVal.trim()) return
    const userVal = inputVal.trim()
    const correct = question?.answer ?? ''
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
      seenMovesRef.current.add(`${q.fighter_slug}:${q.move_name}`)
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
      const s = score > 1 ? 's' : ''
      text = [
        t('play.share_survival_line1'),
        t('play.share_survival_line2', { n: score, s }),
        t('play.share_survival_line3', { best }),
        'fightdata.app',
      ].join('\n')
    } else {
      const labels: Record<string, string> = {
        random:   'RANDOM',
        fighter:  slug.toUpperCase(),
        input:    'INPUT',
        punish:   'PUNISH FINDER',
        hardcore: 'HARDCORE',
        damage:   'DAMAGE',
        onblock:  'ON BLOCK',
        onhit:    'ON HIT',
        recovery: 'RECOVERY',
        custom:   'CUSTOM',
        mistakes: 'ERROR BANK',
      }
      const label    = labels[mode] ?? mode.toUpperCase()
      const rank     = getRank(accuracy)
      const scoreStr = sessionLength !== Infinity ? `${score}/${sessionLength}` : String(score)
      text = [
        `Fight Data Arena 🥊 — Mode ${label}`,
        t('play.share_score', { score: scoreStr, accuracy, rank: rank.label }),
        t('play.share_combo', { combo: maxCombo }),
        'fightdata.app',
      ].join('\n')
    }
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard not available
    }
  }, [mode, slug, score, sessionLength, accuracy, maxCombo, isSurvival, t])

  function startSession() {
    track('quiz_started', { mode })
    seenMovesRef.current = new Set()
    historyRef.current = []; setShowReview(false)
    setScore(0); setCombo(0); setMaxCombo(0); setTotal(0)
    setIsNewRecord(false); setLoading(true); setQuestion(null)
    setSessionPhase('playing')
  }

  function restartSession() {
    track('quiz_started', { mode })
    seenMovesRef.current = new Set()
    historyRef.current = []; setShowReview(false)
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
    survival: t('play.mode_survival_label'),
    damage:   'DAMAGE MODE',
    onblock:  t('play.mode_onblock_label'),
    onhit:    t('play.mode_onhit_label'),
    recovery: t('play.mode_recovery_label'),
    custom:   'CUSTOM MODE',
    mistakes: t('play.mode_mistakes_label'),
  }[mode] ?? 'QUIZ'

  useEffect(() => {
    if (isSurvival && sessionPhase === 'selector') {
      setScore(0); setCombo(0); setMaxCombo(0); setTotal(0)
      setIsNewRecord(false); setLoading(true); setQuestion(null)
      setSessionPhase('playing')
    }
  }, [isSurvival, sessionPhase])

  const [mistakesCount, setMistakesCount] = useState(0)

  useEffect(() => {
    if (sessionPhase !== 'selector') return
    const key = isCustom ? 'fda_best_custom' : (mode === 'fighter' && slug ? `fda_best_fighter_${slug}` : `fda_best_${mode}`)
    const raw = localStorage.getItem(key)
    setBestRecord(raw ? JSON.parse(raw) : null)
    if (isMistakes) {
      const bankRaw = localStorage.getItem('fda_mistakes')
      setMistakesCount(bankRaw ? Object.keys(JSON.parse(bankRaw)).length : 0)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionPhase])

  useEffect(() => {
    if (sessionPhase !== 'selector') return
    const LENGTHS = [10, 20, 30, 40, 50, Infinity]
    const handler = (e: KeyboardEvent) => {
      const n = parseInt(e.key)
      if (n >= 1 && n <= LENGTHS.length) { setSessionLength(LENGTHS[n - 1]); return }
      if (e.key === 'Enter') startSession()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionPhase])

  const isPunishable = question?.answer === 'punissable'

  // ── SELECTOR ────────────────────────────────────────────────────────────────
  if (sessionPhase === 'selector') {
    const LENGTHS = [10, 20, 30, 40, 50, Infinity] as number[]
    const TIME_EST: Record<number, string> = { 10: '~3 min', 20: '~6 min', 30: '~9 min', 40: '~12 min', 50: '~15 min' }
    const modeSub = ({
      random:   t('quiz.mode_random_sub'),
      fighter:  t('quiz.mode_fighter_sub'),
      input:    t('quiz.mode_input_sub'),
      punish:   t('quiz.mode_punish_sub'),
      hardcore: t('quiz.mode_hardcore_sub'),
      damage:   t('quiz.mode_damage_sub'),
      onblock:  t('quiz.mode_onblock_sub'),
      onhit:    t('quiz.mode_onhit_sub'),
      recovery: t('quiz.mode_recovery_sub'),
      custom:   t('quiz.mode_custom_sub'),
      mistakes: isMistakes ? t('play.mistakes_bank', { n: mistakesCount }) : '',
    } as Record<string, string>)[mode] ?? ''

    return (
      <>
        <Navbar />
        <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', minHeight: 'calc(100vh - 60px)' }}>
          <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

            {/* Mode header */}
            <div>
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(2rem, 7vw, 3rem)',
                letterSpacing: '6px', lineHeight: 1,
                background: `linear-gradient(135deg, ${modeColor}, ${modeColorAlt})`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                filter: `drop-shadow(0 0 18px ${modeColor}55)`,
              }}>
                {modeLabel}
              </div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.52rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>
                {modeSub}
              </div>
              {bestRecord && (
                <div style={{ marginTop: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: `${modeColor}10`, border: `1px solid ${modeColor}30` }}>
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.42rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.28)' }}>RECORD</span>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.85rem', letterSpacing: '2px', color: modeColor }}>{bestRecord.bestScore} CORRECT</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.6rem' }}>·</span>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.85rem', letterSpacing: '2px', color: modeColor }}>{bestRecord.bestAccuracy}%</span>
                </div>
              )}
            </div>

            {/* Question count picker */}
            <div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.48rem', letterSpacing: '4px', color: 'rgba(255,255,255,0.18)', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                {t('play.session_length')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {LENGTHS.map((len, i) => {
                  const isSel = sessionLength === len
                  const isInf = len === Infinity
                  return (
                    <button
                      key={String(len)}
                      onClick={() => setSessionLength(len)}
                      style={{
                        padding: '18px 8px 14px',
                        background: isSel ? `${modeColor}18` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isSel ? modeColor : 'rgba(255,255,255,0.07)'}`,
                        cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                        transition: 'all 0.15s',
                        boxShadow: isSel ? `0 0 22px ${modeColor}22, inset 0 0 30px ${modeColor}08` : 'none',
                        position: 'relative',
                      }}
                    >
                      <span style={{ position: 'absolute', top: '6px', right: '8px', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.38rem', letterSpacing: '0px', color: isSel ? `${modeColor}77` : 'rgba(255,255,255,0.12)' }}>
                        [{i + 1}]
                      </span>
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.2rem', letterSpacing: '1px', lineHeight: 1, color: isSel ? modeColor : 'rgba(255,255,255,0.55)', textShadow: isSel ? `0 0 18px ${modeColor}88` : 'none' }}>
                        {isInf ? '∞' : len}
                      </span>
                      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.4rem', letterSpacing: '2px', color: isSel ? `${modeColor}bb` : 'rgba(255,255,255,0.22)' }}>
                        {isInf ? t('play.infinite_label') : 'Q'}
                      </span>
                      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.38rem', letterSpacing: '1px', color: isSel ? `${modeColor}66` : 'rgba(255,255,255,0.13)', marginTop: '2px' }}>
                        {isInf ? '∞' : TIME_EST[len]}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* CTA */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
              {isMistakes && mistakesCount === 0 ? (
                <>
                  <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', fontFamily: "'Rajdhani', sans-serif", fontSize: '0.9rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
                    {t('quiz.mistakes_empty')}
                  </div>
                  <Link href="/quiz" style={{ width: '100%', padding: '16px', background: `${modeColor}18`, border: `1px solid ${modeColor}44`, cursor: 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', letterSpacing: '6px', color: modeColor, textDecoration: 'none', display: 'block', textAlign: 'center' }}>
                    {t('play.change_mode')}
                  </Link>
                </>
              ) : (
                <>
                  <button onClick={startSession} style={{
                    width: '100%', padding: '16px',
                    background: `linear-gradient(90deg, ${modeColorAlt}, ${modeColor})`,
                    border: 'none', cursor: 'pointer',
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: '1.1rem', letterSpacing: '6px', color: '#fff',
                    boxShadow: `0 0 24px ${modeColor}33`, transition: 'all 0.2s',
                  }}>
                    {sessionLength === Infinity
                      ? `${t('play.start')} ∞`
                      : `${t('play.start')} ${sessionLength}Q`}
                  </button>
                  <Link href="/quiz" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }}>
                    {t('play.change_mode')}
                  </Link>
                </>
              )}
            </div>

          </div>
        </main>
      </>
    )
  }

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
        }}>{t('play.replay')}</button>
        <Link href="/quiz" style={{
          flex: '1 1 0', padding: '13px 12px',
          background: 'none', border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.45)',
          fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.95rem', letterSpacing: '3px',
          textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{t('play.modes_btn')}</Link>
        <button onClick={handleShare} style={{
          flex: '1 1 0', padding: '13px 12px',
          background: 'none',
          border: `1px solid ${copied ? '#4ade80' : 'rgba(255,255,255,0.12)'}`,
          color: copied ? '#4ade80' : 'rgba(255,255,255,0.45)',
          fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.95rem', letterSpacing: '3px',
          cursor: 'pointer', transition: 'all 0.3s',
        }}>{copied ? t('play.copied') : t('play.share')}</button>
        <Link href="/profile" style={{
          width: '100%', padding: '10px 12px',
          background: 'none', border: '1px solid rgba(255,255,255,0.07)',
          color: 'rgba(255,255,255,0.25)',
          fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '3px',
          textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{t('stats.title')} →</Link>
      </div>
    )

    // ── Survival end screen ──
    if (isSurvival) {
      const stored   = typeof window !== 'undefined' ? localStorage.getItem('fda_survival_best') : null
      const bestEver = stored ? (JSON.parse(stored) as { best: number }).best : score
      const s = score > 1 ? 's' : ''
      return (
        <>
          <Navbar />
          <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', minHeight: 'calc(100vh - 60px)' }}>
            <div className="animate-fadeInUp" style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', textAlign: 'center' }}>

              <div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(3rem, 12vw, 5rem)', letterSpacing: '6px', lineHeight: 1, color: '#ff2d78', textShadow: '0 0 24px #ff2d7888' }}>
                  {t('play.game_over')}
                </div>
                <div style={{ marginTop: '16px', fontFamily: "'Rajdhani', sans-serif", fontSize: '1.1rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '1px' }}>
                  {t('play.survived_msg', { n: score, s })}
                </div>
                {isNewRecord && (
                  <div style={{ marginTop: '12px', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', letterSpacing: '4px', color: '#ffd700', textShadow: '0 0 16px #ffd70088', animation: 'glowPulse 2s ease-in-out infinite' }}>
                    {t('play.new_record')}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                {[
                  { val: String(score), label: t('play.survived_label') },
                  { val: String(bestEver), label: t('play.best_record') },
                ].map((stat, i) => (
                  <div key={i} style={{ padding: '20px 12px', background: 'rgba(0,0,0,0.3)', borderRight: i === 0 ? '1px solid rgba(255,255,255,0.08)' : 'none', textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2rem, 8vw, 3rem)', letterSpacing: '2px', color: modeColor, textShadow: `0 0 12px ${modeColor}88` }}>
                      {stat.val}
                    </div>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.45rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.3)', marginTop: '6px' }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {newAchievements.length > 0 && <AchievementToast achievements={newAchievements} label={t('play.achievement_unlocked')} />}

              {/* Survival leaderboard */}
              {survivalLb.length > 0 && (
                <div style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(74,222,128,0.15)' }}>
                  <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(74,222,128,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.85rem', letterSpacing: '4px', color: modeColor }}>SURVIVAL LEADERBOARD</span>
                    {!survivalPseudo && (
                      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.4rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.2)' }}>— set a name on the Stats page to appear here</span>
                    )}
                  </div>
                  {survivalLb.map((entry) => {
                    const isMe = survivalPseudo && entry.player_name.toLowerCase() === survivalPseudo.toLowerCase()
                    return (
                      <div key={entry.rank} style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '8px 16px',
                        background: isMe ? `${modeColor}12` : 'transparent',
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                      }}>
                        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.85rem', letterSpacing: '2px', color: entry.rank <= 3 ? modeColor : 'rgba(255,255,255,0.2)', minWidth: '20px' }}>
                          {entry.rank <= 3 ? ['🥇','🥈','🥉'][entry.rank - 1] : `#${entry.rank}`}
                        </span>
                        <span style={{ flex: 1, fontFamily: "'Rajdhani', sans-serif", fontSize: '0.85rem', fontWeight: isMe ? 700 : 500, color: isMe ? '#fff' : 'rgba(255,255,255,0.5)', textAlign: 'left' }}>
                          {entry.player_name}
                        </span>
                        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', letterSpacing: '2px', color: isMe ? modeColor : 'rgba(255,255,255,0.35)' }}>
                          {entry.best_score}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              <ReviewSection history={historyRef.current} show={showReview} onToggle={() => setShowReview(v => !v)} modeColor={modeColor} mode={mode} t={t as (k: string, v?: Record<string, string | number>) => string} />

              {buttons}
            </div>
          </main>
        </>
      )
    }

    // ── Normal end screen ──
    const rank = getRank(accuracy)
    return (
      <>
        <Navbar />
        <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', minHeight: 'calc(100vh - 60px)' }}>
          <div className="animate-fadeInUp" style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', textAlign: 'center' }}>

            <div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '4px', color: 'rgba(255,255,255,0.3)', marginBottom: '14px' }}>
                {t('play.final_rank')}
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
                  {t('play.new_record')}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', width: '100%', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              {[
                { val: sessionLength !== Infinity ? `${score}/${sessionLength}` : String(score), label: t('play.score_label') },
                { val: `${accuracy}%`, label: t('play.precision') },
                { val: `${maxCombo}🔥`, label: t('play.combo_max') },
              ].map((stat, i) => (
                <div key={i} style={{ padding: '20px 12px', background: 'rgba(0,0,0,0.3)', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.6rem, 5vw, 2.4rem)', letterSpacing: '2px', color: rank.color, textShadow: `0 0 12px ${rank.color}88` }}>
                    {stat.val}
                  </div>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.48rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.3)', marginTop: '6px' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.2)' }}>
              {modeLabel} — {sessionLength === Infinity ? '∞' : sessionLength} QUESTIONS
            </div>

            {newAchievements.length > 0 && <AchievementToast achievements={newAchievements} label={t('play.achievement_unlocked')} />}

            <ReviewSection history={historyRef.current} show={showReview} onToggle={() => setShowReview(v => !v)} modeColor={modeColor} mode={mode} t={t as (k: string, v?: Record<string, string | number>) => string} />

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
          {sessionLength !== Infinity && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'rgba(255,255,255,0.05)' }}>
              <div style={{
                height: '100%',
                width: `${(total / sessionLength) * 100}%`,
                background: `linear-gradient(90deg, ${modeColorAlt}, ${modeColor})`,
                transition: 'width 0.3s',
              }} />
            </div>
          )}
          {[
            { val: score,           label: t('play.score_label') },
            { val: `${combo}🔥`,   label: t('play.score_combo') },
            { val: `${accuracy}%`, label: t('play.precision') },
            { val: sessionLength !== Infinity ? `${total}/${sessionLength}` : total, label: t('play.score_played') },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.7rem', letterSpacing: '2px',
                background: `linear-gradient(180deg, #fff, ${modeColor})`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>{stat.val}</div>
              <div style={{
                fontFamily: "'Share Tech Mono', monospace", fontSize: '0.52rem',
                letterSpacing: '3px', color: 'rgba(255,255,255,0.28)',
              }}>{stat.label}</div>
            </div>
          ))}
          <button
            onClick={() => { setSoundEnabled(toggleSound()) }}
            style={{
              position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: '1px solid rgba(255,255,255,0.1)',
              color: soundEnabled ? modeColor : 'rgba(255,255,255,0.2)',
              fontFamily: "'Share Tech Mono', monospace", fontSize: '0.48rem',
              letterSpacing: '2px', padding: '3px 7px', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            title={soundEnabled ? 'Mute SFX' : 'Enable SFX'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
        </div>

        {loading ? (
          <div style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.3)', letterSpacing: '4px' }}>
            {t('play.loading')}
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
              background: `${modeColor}12`,
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
            <GifSection gifUrl={question.gif_url} gifPath={question.gif_path} moveName={question.move_name} color={modeColor} fallback={t('play.hitbox_preview')} />

            {/* Question */}
            <div style={{ padding: '16px 18px 12px' }}>
              {isPunish ? (
                <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', fontWeight: 600, lineHeight: 1.4, color: 'rgba(255,255,255,0.9)' }}>
                  <strong style={{ color: '#fff' }}>{question.move_name}</strong>{' '}
                  {t('play.q_is_it_punishable')}{' '}
                  <span style={{ color: modeColor }}>{t('play.q_punishable_on_block')}</span>
                </p>
              ) : isOnBlock ? (
                <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', fontWeight: 600, lineHeight: 1.4, color: 'rgba(255,255,255,0.9)' }}>
                  {t('play.q_what_is')} <span style={{ color: modeColor }}>on block value</span> {t('play.q_of')}{' '}
                  <strong style={{ color: '#fff' }}>{question.move_name}</strong> ?
                </p>
              ) : isOnHit ? (
                <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', fontWeight: 600, lineHeight: 1.4, color: 'rgba(255,255,255,0.9)' }}>
                  {t('play.q_what_is')} <span style={{ color: modeColor }}>on hit value</span> {t('play.q_of')}{' '}
                  <strong style={{ color: '#fff' }}>{question.move_name}</strong> ?
                </p>
              ) : (
                <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', fontWeight: 600, lineHeight: 1.4, color: 'rgba(255,255,255,0.9)' }}>
                  {t('play.q_what_is')} <span style={{ color: modeColor }}>{isDamage ? t('play.q_damage') : isRecovery ? t('play.q_recovery') : 'startup'}</span> {t('play.q_of')}{' '}
                  <strong style={{ color: '#fff' }}>{question.move_name}</strong> ?
                </p>
              )}
            </div>

            {/* Content by mode */}
            <div style={{ padding: '0 18px' }}>

              {/* MCQ */}
              {!isInput && !isPunish && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {question.choices.map((choice, i) => (
                    <button key={choice} onClick={() => handleChoice(choice)} style={makeChoiceStyle(choice, question.answer, selected, state === 'idle')}>
                      <span style={{
                        width: '20px', height: '20px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid rgba(255,255,255,0.18)', fontSize: '0.62rem',
                        fontFamily: "'Share Tech Mono', monospace",
                      }}>{String.fromCharCode(65 + i)}</span>
                      {isOnBlock || isOnHit ? choice : isDamage ? choice : `${choice} frames`}
                    </button>
                  ))}
                </div>
              )}

              {/* INPUT mode */}
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
                  }}>{t('play.input_hint')}</p>
                </div>
              )}

              {/* PUNISH FINDER mode */}
              {isPunish && (
                <div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handlePunish('punissable')}
                      disabled={state !== 'idle'}
                      style={{
                        flex: 1, padding: '20px 12px',
                        background: state === 'idle' ? 'rgba(255,45,120,0.08)' : isPunishable ? 'rgba(255,45,120,0.2)' : 'rgba(255,45,120,0.04)',
                        border: `1px solid ${state === 'idle' ? 'rgba(255,45,120,0.3)' : isPunishable ? '#ff2d78' : 'rgba(255,45,120,0.1)'}`,
                        cursor: state === 'idle' ? 'pointer' : 'default',
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: '1.4rem', letterSpacing: '4px',
                        color: state !== 'idle' && isPunishable ? '#ff2d78' : 'rgba(255,45,120,0.8)',
                        transition: 'all 0.2s',
                        boxShadow: state === 'idle' ? '0 0 12px rgba(255,45,120,0.1)' : isPunishable ? '0 0 20px rgba(255,45,120,0.3)' : 'none',
                      }}
                    >
                      💀 {t('play.punishable_label')}
                      <div style={{ fontSize: '0.6rem', letterSpacing: '2px', marginTop: '4px', opacity: 0.6 }}>{'≤ -4 ON BLOCK'}</div>
                    </button>
                    <button
                      onClick={() => handlePunish('safe')}
                      disabled={state !== 'idle'}
                      style={{
                        flex: 1, padding: '20px 12px',
                        background: state === 'idle' ? 'rgba(74,222,128,0.08)' : !isPunishable ? 'rgba(74,222,128,0.2)' : 'rgba(74,222,128,0.04)',
                        border: `1px solid ${state === 'idle' ? 'rgba(74,222,128,0.3)' : !isPunishable ? '#4ade80' : 'rgba(74,222,128,0.1)'}`,
                        cursor: state === 'idle' ? 'pointer' : 'default',
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: '1.4rem', letterSpacing: '4px',
                        color: state !== 'idle' && !isPunishable ? '#4ade80' : 'rgba(74,222,128,0.8)',
                        transition: 'all 0.2s',
                        boxShadow: state === 'idle' ? '0 0 12px rgba(74,222,128,0.1)' : !isPunishable ? '0 0 20px rgba(74,222,128,0.3)' : 'none',
                      }}
                    >
                      ✓ {t('play.safe_label')}
                      <div style={{ fontSize: '0.6rem', letterSpacing: '2px', marginTop: '4px', opacity: 0.6 }}>{'-3 à +∞ ON BLOCK'}</div>
                    </button>
                  </div>
                  <p style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: '0.52rem', color: 'rgba(255,255,255,0.18)',
                    letterSpacing: '1.5px', marginTop: '8px', textAlign: 'center',
                  }}>{t('play.pushback_note')}</p>
                </div>
              )}
            </div>

            {/* Feedback + next button */}
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
                  {isOnBlock ? (
                    state === 'correct'
                      ? t('play.feedback_correct_onblock', { move: question.move_name, n: question.answer })
                      : t('play.feedback_wrong_onblock', { move: question.move_name, n: question.answer })
                  ) : isOnHit ? (
                    state === 'correct'
                      ? t('play.feedback_correct_onhit', { move: question.move_name, n: question.answer })
                      : t('play.feedback_wrong_onhit', { move: question.move_name, n: question.answer })
                  ) : isRecovery ? (
                    state === 'correct'
                      ? t('play.feedback_correct_recovery', { move: question.move_name, n: question.answer })
                      : t('play.feedback_wrong_recovery', { move: question.move_name, n: question.answer })
                  ) : isPunish ? (
                    state === 'correct'
                      ? t('play.feedback_correct_punish', { move: question.move_name, label: t(isPunishable ? 'play.punishable_label' : 'play.safe_label'), value: question.on_block_value ?? '' })
                      : t('play.feedback_wrong_punish',   { move: question.move_name, label: t(isPunishable ? 'play.punishable_label' : 'play.safe_label'), value: question.on_block_value ?? '' })
                  ) : isDamage ? (
                    state === 'correct'
                      ? t('play.feedback_correct_damage', { n: question.answer })
                      : t('play.feedback_wrong_damage', { n: question.answer })
                  ) : isInput ? (
                    state === 'correct'
                      ? t('play.feedback_correct_startup', { n: question.answer })
                      : t('play.feedback_wrong_startup_input', { n: question.answer, v: selected ?? '' })
                  ) : (
                    state === 'correct'
                      ? t('play.feedback_correct_startup', { n: question.answer })
                      : timeLeft === 0
                      ? t('play.feedback_timeout', { n: question.answer })
                      : t('play.feedback_wrong_startup', { n: question.answer })
                  )}
                  {!isPunish && !isDamage && !isOnBlock && !isOnHit && !isRecovery && question.on_block_value && (
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.45rem', letterSpacing: '1px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>
                      {question.move_name} — {question.answer}f startup · {question.on_block_value} on block
                    </div>
                  )}
                  {state === 'wrong' && (() => {
                    const fact = getFunFact(question, mode)
                    return fact ? (
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.44rem', letterSpacing: '1px', color: '#f59e0b', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(245,158,11,0.2)' }}>
                        💡 {fact}
                      </div>
                    ) : null
                  })()}
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
                {isSessionOver && state !== 'idle'
                  ? t('play.see_results')
                  : state === 'idle'
                  ? t('play.skip')
                  : t('play.next_question')}
              </button>
            </div>

          </div>
        )}

        <Link href="/quiz" style={{
          marginTop: '16px',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '0.6rem', letterSpacing: '3px',
          color: 'rgba(255,255,255,0.2)', textDecoration: 'none',
        }}>{t('play.change_mode')}</Link>

      </main>
    </>
  )
}

export default function QuizPlayPage() {
  return <Suspense><QuizPlay /></Suspense>
}

function getFunFact(q: { answer: string; on_block_value?: string | null; move_name: string }, mode: string): string | null {
  if (mode === 'damage') {
    const dmg = parseInt(q.answer)
    if (!isNaN(dmg)) {
      if (dmg >= 2000) return `${q.move_name} deals ${dmg} pts — one of the hardest-hitting moves`
      if (dmg <= 400)  return `${q.move_name} is a weak poke at only ${dmg} pts damage`
    }
    return null
  }
  if (mode === 'onblock') {
    const v = parseInt(q.answer.replace('+', ''))
    if (!isNaN(v)) {
      if (v <= -10) return `${q.move_name} is ${q.answer} on block — severely punishable`
      if (v >= 4)   return `${q.move_name} is ${q.answer} on block — leaves you at advantage`
    }
    return null
  }
  if (mode === 'onhit') {
    const v = parseInt(q.answer.replace('+', ''))
    if (!isNaN(v)) {
      if (v >= 20)  return `${q.move_name} is ${q.answer} on hit — massive advantage`
      if (v <= -4)  return `${q.move_name} is ${q.answer} on hit — even unsafe on hit`
    }
    return null
  }
  if (mode === 'recovery') {
    const r = parseInt(q.answer)
    if (!isNaN(r)) {
      if (r <= 10) return `${q.move_name} has only ${r}f recovery — lightning fast`
      if (r >= 40) return `${q.move_name} has ${r}f recovery — lots of vulnerability after this move`
    }
    return null
  }
  if (mode === 'punish') return null
  // Startup modes
  const startup = parseInt(q.answer)
  if (!isNaN(startup)) {
    if (startup <= 4)  return `${q.move_name} is ${startup}f — among the fastest moves in SF6`
    if (startup >= 25) return `${q.move_name} is ${startup}f — a slow, committal move`
  }
  if (q.on_block_value) {
    const ob = parseInt(q.on_block_value.replace('+', ''))
    if (!isNaN(ob)) {
      if (ob <= -10) return `${q.move_name} is ${q.on_block_value} on block — very punishable`
      if (ob >= 4)   return `${q.move_name} is ${q.on_block_value} on block — leaves you at advantage`
    }
  }
  return null
}

function ReviewSection({ history, show, onToggle, modeColor, mode, t }: {
  history: HistoryEntry[]
  show: boolean
  onToggle: () => void
  modeColor: string
  mode: string
  t: (k: string, v?: Record<string, string | number>) => string
}) {
  if (history.length === 0) return null
  const fmt = (val: string) =>
    mode === 'damage' || mode === 'onblock' || mode === 'punish' ? val : `${val}f`
  return (
    <div style={{ width: '100%' }}>
      <button onClick={onToggle} style={{
        width: '100%', padding: '10px',
        background: 'none', border: '1px solid rgba(255,255,255,0.1)',
        color: 'rgba(255,255,255,0.35)', cursor: 'pointer',
        fontFamily: "'Share Tech Mono', monospace", fontSize: '0.5rem', letterSpacing: '3px',
        transition: 'all 0.2s',
      }}>
        {show ? t('play.review_hide') : t('play.review_answers')} ({history.length})
      </button>
      {show && (
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {history.map((entry, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '20px 1fr auto',
              alignItems: 'center', gap: '10px', padding: '8px 12px',
              background: entry.correct ? 'rgba(74,222,128,0.06)' : 'rgba(255,45,120,0.06)',
              border: `1px solid ${entry.correct ? 'rgba(74,222,128,0.2)' : 'rgba(255,45,120,0.2)'}`,
            }}>
              <span style={{ fontSize: '0.8rem' }}>{entry.correct ? '✓' : '✗'}</span>
              <div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.75rem', letterSpacing: '1px', color: 'rgba(255,255,255,0.7)' }}>
                  {entry.question.fighter_slug.toUpperCase()} — {entry.question.move_name}
                </div>
                {!entry.correct && entry.userAnswer && (
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.38rem', letterSpacing: '1px', color: '#ff2d78', marginTop: '2px' }}>
                    {t('play.your_answer')}: {fmt(entry.userAnswer)}
                  </div>
                )}
              </div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', letterSpacing: '1px', color: entry.correct ? '#4ade80' : 'rgba(255,255,255,0.45)', textAlign: 'right' }}>
                {fmt(entry.question.answer)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AchievementToast({ achievements, label }: { achievements: Achievement[]; label: string }) {
  return (
    <div style={{ width: '100%', padding: '14px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.48rem', letterSpacing: '4px', color: '#f59e0b' }}>
        {label}
      </div>
      {achievements.map(a => (
        <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '1.3rem', lineHeight: 1 }}>{a.icon}</div>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.85rem', letterSpacing: '2px', color: RARITY_COLOR[a.rarity] }}>
              {a.name}
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.42rem', letterSpacing: '1px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
              {a.desc}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

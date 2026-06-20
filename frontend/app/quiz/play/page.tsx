'use client'
import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getRandomQuiz, getFighterQuiz, getRandomPunish, getRandomDamage, getRandomOnBlock, getRandomOnHit, getRandomRecovery, getRandomActive, getFighterActive, getFighterRecovery, getFighterOnBlock, getFighterOnHit, getFighterDamage, getFighterPunish, submitGlobalScore, submitSurvivalScore, getSurvivalLeaderboard, invalidateLeaderboardCache, syncProfile, type SurvivalLeaderboardEntry } from '@/lib/api'
import { playCorrect, playWrong, getSoundEnabled, toggleSound } from '@/lib/sounds'
import { checkAndUnlock, updateLifetime, type Achievement, type LifetimeDelta } from '@/lib/achievements'
import AchievementToast from '@/components/AchievementToast'
import type { QuizQuestion } from '@/types'
import { primaryGifSrc } from '@/lib/gif'
import { track } from '@vercel/analytics'
import { useLanguage, type DictKey } from '@/lib/i18n'
import Icon from '@/components/Icon'
import { ACCENT, PODIUM } from '@/lib/colors'
import { GifSection, makeChoiceStyle } from '@/components/QuestionCard'
import { MODE_COLORS, MODE_COLORS_ALT, getRank, type Rank } from '@/lib/constants'
import { useAuth } from '@/components/AuthProvider'

type AnswerState = 'idle' | 'correct' | 'wrong'

interface HistoryEntry {
  question: QuizQuestion
  userAnswer: string
  correct: boolean
}

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

function QuizPlay() {
  const params = useSearchParams()
  const mode   = params.get('mode') || 'random'
  const slug   = params.get('slug') || ''
  const { t } = useLanguage()
  const isDesktop = useIsDesktop()

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
  const nextQuestionRef       = useRef<QuizQuestion | null>(null)
  const prefetchingRef        = useRef<boolean>(false)
  const prefetchTokenRef      = useRef<number>(0)
  const seenMovesRef          = useRef<Set<string>>(new Set())
  const mistakeQuestionMode   = useRef<string>('random')
  const mistakeOriginalKey    = useRef<string>('')

  const [sessionPhase, setSessionPhase]   = useState<'selector' | 'playing' | 'finished'>('selector')
  const [explainerOpen, setExplainerOpen] = useState(false)
  const [infoOpen, setInfoOpen]           = useState(false)
  const [sessionLength, setSessionLength] = useState<number>(10)
  const [maxCombo, setMaxCombo]           = useState(0)
  const [copied, setCopied]               = useState(false)
  const [isNewRecord, setIsNewRecord]     = useState(false)
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])
  function dismissAchievement(id: string) { setNewAchievements(prev => prev.filter(a => a.id !== id)) }
  const { user, token } = useAuth()
  const userRef = useRef(user)
  const tokenRef = useRef(token)
  useEffect(() => { userRef.current = user; tokenRef.current = token }, [user, token])
  const [bestRecord, setBestRecord]       = useState<{ bestScore: number; bestAccuracy: number } | null>(null)
  const historyRef                        = useRef<HistoryEntry[]>([])
  const [showReview, setShowReview]       = useState(false)
  const [survivalLb,    setSurvivalLb]   = useState<SurvivalLeaderboardEntry[]>([])
  const [survivalPseudo,setSurvivalPseudo]= useState('')

  const isHardcore   = mode === 'hardcore'
  const isInput      = mode === 'input'
  const isPunish     = mode === 'punish'
  const isSurvival   = mode === 'survival'
  const isDamage     = mode === 'damage'
  const isOnBlock    = mode === 'onblock'
  const isOnHit      = mode === 'onhit'
  const isRecovery   = mode === 'recovery'
  const isActive     = mode === 'active'
  const isCustom     = mode === 'custom'
  const isMistakes   = mode === 'mistakes'
  const isAllRandom  = mode === 'allrandom'

  // Modes that expose the data-type picker
  const hasDataTypePicker = mode === 'fighter' || isCustom || isHardcore || isSurvival || isInput

  const dtParam = params.get('dataType') as 'startup'|'active'|'recovery'|'onblock'|'onhit'|'damage'|'punish' | null
  // The stat to train is chosen up-front on /quiz and travels in the URL; it is
  // not re-picked here (the explainer shows it; "change stat" links back to /quiz).
  const [dataType] = useState<'startup'|'active'|'recovery'|'onblock'|'onhit'|'damage'|'punish'>(dtParam ?? 'startup')

  // Effective question type (data-type modes override via dataType state)
  const mqm = isMistakes ? mistakeQuestionMode.current : ''
  const effectivePunish   = isPunish   || (hasDataTypePicker && dataType === 'punish')   || (isMistakes && mqm === 'punish')
  const effectiveOnBlock  = isOnBlock  || (hasDataTypePicker && dataType === 'onblock')  || (isMistakes && mqm === 'onblock')
  const effectiveOnHit    = isOnHit    || (hasDataTypePicker && dataType === 'onhit')    || (isMistakes && mqm === 'onhit')
  const effectiveDamage   = isDamage   || (hasDataTypePicker && dataType === 'damage')   || (isMistakes && mqm === 'damage')
  const effectiveActive   = isActive || (hasDataTypePicker && dataType === 'active')     || (isMistakes && mqm === 'active')
  const effectiveRecovery = isRecovery || (hasDataTypePicker && dataType === 'recovery') || (isMistakes && mqm === 'recovery')

  const [soundEnabled, setSoundEnabled] = useState(true)
  useEffect(() => { setSoundEnabled(getSoundEnabled()) }, [])

  // Whether jumping moves appear in questions — off by default, remembered across sessions.
  const [includeJumps, setIncludeJumps] = useState(false)
  useEffect(() => { setIncludeJumps(localStorage.getItem('fda_include_jumps') === '1') }, [])
  const toggleJumps = (val: boolean) => {
    setIncludeJumps(val)
    localStorage.setItem('fda_include_jumps', val ? '1' : '0')
  }

  // Whether moves without a hitbox GIF (specials/supers/throws) can be quizzed
  // — off by default; they show their input notation instead of a GIF.
  const [includeNoGif, setIncludeNoGif] = useState(false)
  useEffect(() => { setIncludeNoGif(localStorage.getItem('fda_include_nogif') === '1') }, [])
  const toggleNoGif = (val: boolean) => {
    setIncludeNoGif(val)
    localStorage.setItem('fda_include_nogif', val ? '1' : '0')
  }

  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0

  const modeColor    = MODE_COLORS[mode]     ?? '#ff2d78'
  const modeColorAlt = MODE_COLORS_ALT[mode] ?? '#9b1fff'

  const fetchOne = useCallback(async (): Promise<QuizQuestion> => {
    if (isMistakes) {
      const raw = localStorage.getItem('fda_mistakes')
      const bank: Record<string, { question: QuizQuestion; mode: string }> = raw ? JSON.parse(raw) : {}
      const entries = Object.entries(bank)
      if (entries.length === 0) throw new Error('no_mistakes')
      const [key, entry] = entries[Math.floor(Math.random() * entries.length)]
      mistakeQuestionMode.current = entry.mode ?? 'random'
      mistakeOriginalKey.current  = key
      return entry.question
    }
    // wg=false also pulls moves without a hitbox GIF (specials/supers/throws).
    const wg = !includeNoGif
    if (isAllRandom) {
      const fetchers = [getRandomQuiz, getRandomOnBlock, getRandomOnHit, getRandomRecovery, getRandomDamage]
      return fetchers[Math.floor(Math.random() * fetchers.length)](wg)
    }
    // Modes with data-type picker: route to the right endpoint per dataType
    if (mode === 'fighter' && slug) {
      switch (dataType) {
        case 'active':   return getFighterActive(slug, wg)
        case 'recovery': return getFighterRecovery(slug, wg)
        case 'onblock':  return getFighterOnBlock(slug, wg)
        case 'onhit':    return getFighterOnHit(slug, wg)
        case 'damage':   return getFighterDamage(slug, wg)
        case 'punish':   return getFighterPunish(slug, wg)
        default:         return getFighterQuiz(slug, wg)
      }
    }
    if (isCustom) {
      const customFighters = params.get('fighters')?.split(',').filter(Boolean) ?? []
      const f = customFighters.length > 0 ? customFighters[Math.floor(Math.random() * customFighters.length)] : null
      switch (dataType) {
        case 'active':   return f ? getFighterActive(f, wg)   : getRandomActive(wg)
        case 'recovery': return f ? getFighterRecovery(f, wg) : getRandomRecovery(wg)
        case 'onblock':  return f ? getFighterOnBlock(f, wg)  : getRandomOnBlock(wg)
        case 'onhit':    return f ? getFighterOnHit(f, wg)    : getRandomOnHit(wg)
        case 'damage':   return f ? getFighterDamage(f, wg)   : getRandomDamage(wg)
        case 'punish':   return f ? getFighterPunish(f, wg)   : getRandomPunish(wg)
        default:         return f ? getFighterQuiz(f, wg)     : getRandomQuiz(wg)
      }
    }
    if (isHardcore || isSurvival || isInput) {
      switch (dataType) {
        case 'active':   return getRandomActive(wg)
        case 'recovery': return getRandomRecovery(wg)
        case 'onblock':  return getRandomOnBlock(wg)
        case 'onhit':    return getRandomOnHit(wg)
        case 'damage':   return getRandomDamage(wg)
        case 'punish':   return getRandomPunish(wg)
        default:         return getRandomQuiz(wg)
      }
    }
    // Single-type modes
    if (isOnBlock)  return getRandomOnBlock(wg)
    if (isOnHit)    return getRandomOnHit(wg)
    if (isRecovery) return getRandomRecovery(wg)
    if (isPunish)   return getRandomPunish(wg)
    if (isDamage)   return getRandomDamage(wg)
    if (isActive)   return getRandomActive(wg)
    return getRandomQuiz(wg)
  }, [mode, slug, dataType, isPunish, isDamage, isOnBlock, isOnHit, isRecovery, isActive, isCustom, isMistakes, isAllRandom, isHardcore, isSurvival, params, includeNoGif])

  const fetchUnique = useCallback(async (): Promise<QuizQuestion> => {
    // Jump attacks are excluded by default; the mistakes bank replays as-is.
    const rejectJumps = !includeJumps && !isMistakes
    for (let i = 0; i < 8; i++) {
      const q = await fetchOne()
      const key = `${q.fighter_slug}:${q.move_name}`
      const isDup  = seenMovesRef.current.has(key)
      // The API serves sections as "jump attacks" (spaces); JSON uses "jump_attacks". Match both.
      const isJump = rejectJumps && q.section?.toLowerCase().replace(/_/g, ' ') === 'jump attacks'
      if (!isDup && !isJump) return q
    }
    return fetchOne()
  }, [fetchOne, includeJumps, isMistakes])

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
        const gifSrc = primaryGifSrc(q.gif_url, q.gif_path)
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

  // Prefetch next question's GIF as soon as current question is displayed,
  // giving the full answer time (~15s) instead of only the 3.5s result delay.
  useEffect(() => {
    if (question && !loading) prefetchNext()
  }, [question, loading, prefetchNext])

  useEffect(() => {
    if (state === 'idle' || !question) return
    historyRef.current.push({
      question: { ...question },
      userAnswer: selected ?? '',
      correct: state === 'correct',
    })
    // Update mistake bank: wrong → save (capped 100), correct → remove
    const effectiveMode = isMistakes ? mistakeQuestionMode.current : mode
    const mistakeKey = isMistakes ? mistakeOriginalKey.current : `${question.fighter_slug}:${question.move_name}:${mode}`
    const raw = localStorage.getItem('fda_mistakes')
    const bank: Record<string, { question: QuizQuestion; mode: string; count: number; lastSeen: string }> =
      raw ? JSON.parse(raw) : {}
    if (state === 'wrong') {
      bank[mistakeKey] = {
        question: { ...question },
        mode: effectiveMode,
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
      if (!effectivePunish && question?.choices) {
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
    if (effectivePunish) delta.punishCorrect = score
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
      const pseudo = userRef.current?.username || localStorage.getItem('fda_pseudo')?.trim()
      if (pseudo) submitGlobalScore(pseudo, score, total).catch(() => {})
    }
    // Survival leaderboard
    if (isSurvival) {
      const pseudo = userRef.current?.username || localStorage.getItem('fda_pseudo')?.trim() || ''
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
    // Auto-sync au cloud si connecté
    if (tokenRef.current) syncProfile(tokenRef.current).catch(() => {})
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
    random:    'STARTUP MODE',
    allrandom: 'RANDOM MODE',
    fighter:   `FIGHTER // ${slug.toUpperCase()}`,
    input:     'INPUT MODE',
    punish:    'PUNISH FINDER',
    hardcore:  'HARDCORE',
    survival:  t('play.mode_survival_label'),
    damage:    'DAMAGE MODE',
    onblock:   t('play.mode_onblock_label'),
    onhit:     t('play.mode_onhit_label'),
    recovery:  t('play.mode_recovery_label'),
    active:    'ACTIVE MODE',
    custom:    'CUSTOM MODE',
    mistakes:  t('play.mode_mistakes_label'),
  }[mode] ?? 'QUIZ'

  useEffect(() => {
    if (isSurvival && sessionPhase === 'selector') {
      setScore(0); setCombo(0); setMaxCombo(0); setTotal(0)
      setIsNewRecord(false); setLoading(true); setQuestion(null)
      setSessionPhase('playing')
    }
  }, [isSurvival, sessionPhase])

  // Remember whether the player keeps the stat explainer open (collapsed by default)
  useEffect(() => {
    setExplainerOpen(localStorage.getItem('fda_statx_open') === '1')
  }, [])

  const toggleExplainer = useCallback(() => {
    setExplainerOpen(o => {
      const next = !o
      localStorage.setItem('fda_statx_open', next ? '1' : '0')
      return next
    })
  }, [])

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

  // Auto-reset session length if it exceeds available mistakes
  useEffect(() => {
    if (isMistakes && mistakesCount > 0 && sessionLength !== Infinity && sessionLength > mistakesCount) {
      setSessionLength(mistakesCount)
    }
  }, [isMistakes, mistakesCount, sessionLength])

  useEffect(() => {
    if (sessionPhase !== 'selector') return
    const LENGTHS = isMistakes
      ? (() => {
          const std = [10, 20, 30, 40, 50].filter(n => n <= mistakesCount)
          const showExact = mistakesCount > 0 && mistakesCount <= 50 && ![10, 20, 30, 40, 50].includes(mistakesCount)
          return [...std, ...(showExact ? [mistakesCount] : []), Infinity]
        })()
      : [10, 20, 30, 40, 50, Infinity]
    const handler = (e: KeyboardEvent) => {
      const n = parseInt(e.key)
      if (n >= 1 && n <= LENGTHS.length) { setSessionLength(LENGTHS[n - 1]); return }
      if (e.key === 'Enter') startSession()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionPhase, isMistakes, mistakesCount])

  const isPunishable = question?.answer === 'punissable'

  // The single stat this session tests (null for mixed-stat modes) — drives the explainer
  const sessionStat: StatKey | null =
    isAllRandom       ? null :
    effectiveOnBlock  ? 'onblock'  :
    effectiveOnHit    ? 'onhit'    :
    effectiveRecovery ? 'recovery' :
    effectivePunish   ? 'punish'   :
    effectiveDamage   ? 'damage'   :
    effectiveActive   ? 'active'   : 'startup'

  // ── SELECTOR ────────────────────────────────────────────────────────────────
  if (sessionPhase === 'selector') {
    const STD_LENGTHS = [10, 20, 30, 40, 50]
    const LENGTHS: number[] = isMistakes
      ? (() => {
          const std = STD_LENGTHS.filter(n => n <= mistakesCount)
          const showExact = mistakesCount > 0 && mistakesCount <= 50 && !STD_LENGTHS.includes(mistakesCount)
          return [...std, ...(showExact ? [mistakesCount] : []), Infinity]
        })()
      : [...STD_LENGTHS, Infinity]
    const TIME_EST: Record<number, string> = { 10: '~3 min', 20: '~6 min', 30: '~9 min', 40: '~12 min', 50: '~15 min' }
    const getTimeEst = (len: number) => TIME_EST[len] ?? `~${Math.round(len * 0.3)} min`
    const modeSub = ({
      random:    t('quiz.mode_random_sub'),
      allrandom: t('quiz.mode_allrandom_sub'),
      fighter:   t('quiz.mode_fighter_sub'),
      input:     t('quiz.mode_input_sub'),
      punish:    t('quiz.mode_punish_sub'),
      hardcore:  t('quiz.mode_hardcore_sub'),
      damage:    t('quiz.mode_damage_sub'),
      onblock:   t('quiz.mode_onblock_sub'),
      onhit:     t('quiz.mode_onhit_sub'),
      recovery:  t('quiz.mode_recovery_sub'),
      custom:    t('quiz.mode_custom_sub'),
      mistakes:  isMistakes ? t('play.mistakes_bank', { n: mistakesCount }) : '',
    } as Record<string, string>)[mode] ?? ''

    return (
      <>
        <Navbar />
        <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', minHeight: 'calc(100vh - 60px)' }}>
          <div style={{ width: '100%', maxWidth: isDesktop ? '680px' : '480px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

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
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color: 'rgba(255,255,255,0.7)', marginTop: '8px' }}>
                {modeSub}
              </div>
              {bestRecord && (
                <div style={{ marginTop: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: `${modeColor}10`, border: `1px solid ${modeColor}30` }}>
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-2)', color: 'rgba(255,255,255,0.7)' }}>RECORD</span>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.85rem', letterSpacing: '2px', color: modeColor }}>{bestRecord.bestScore} CORRECT</span>
                  <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.6rem' }}>·</span>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.85rem', letterSpacing: '2px', color: modeColor }}>{bestRecord.bestAccuracy}%</span>
                </div>
              )}
            </div>

            {/* Per-stat detailed explainer — only when the session targets one known stat */}
            {sessionStat && (
              <StatExplainer stat={sessionStat} color={modeColor} open={explainerOpen} onToggle={toggleExplainer} t={t} />
            )}

            {/* The stat (what to train) is chosen up-front on /quiz — no redundant
                re-pick here. The explainer above shows which one is active. */}

            {/* Jump-attacks toggle — off by default */}
            {!isMistakes && (
              <div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color: 'rgba(255,255,255,0.65)', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                  {t('play.jumps_label')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {[{ v: false, label: t('play.no') }, { v: true, label: t('play.yes') }].map(({ v, label }) => {
                    const isSel = includeJumps === v
                    return (
                      <button key={String(v)} onClick={() => toggleJumps(v)} style={{
                        padding: '5px 18px',
                        background: isSel ? `${modeColor}20` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isSel ? modeColor : 'rgba(255,255,255,0.08)'}`,
                        color: isSel ? modeColor : 'rgba(255,255,255,0.7)',
                        cursor: 'pointer',
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)',
                        boxShadow: isSel ? `0 0 10px ${modeColor}22` : 'none',
                        transition: 'all 0.15s',
                      }}>
                        {label}
                      </button>
                    )
                  })}
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-1)', color: 'rgba(255,255,255,0.65)' }}>
                    {t('play.jumps_sub')}
                  </span>
                </div>
              </div>
            )}

            {/* No-GIF moves toggle — off by default */}
            {!isMistakes && (
              <div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color: 'rgba(255,255,255,0.65)', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                  {t('play.nogif_label')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {[{ v: false, label: t('play.no') }, { v: true, label: t('play.yes') }].map(({ v, label }) => {
                    const isSel = includeNoGif === v
                    return (
                      <button key={String(v)} onClick={() => toggleNoGif(v)} style={{
                        padding: '5px 18px',
                        background: isSel ? `${modeColor}20` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isSel ? modeColor : 'rgba(255,255,255,0.08)'}`,
                        color: isSel ? modeColor : 'rgba(255,255,255,0.7)',
                        cursor: 'pointer',
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)',
                        boxShadow: isSel ? `0 0 10px ${modeColor}22` : 'none',
                        transition: 'all 0.15s',
                      }}>
                        {label}
                      </button>
                    )
                  })}
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-1)', color: 'rgba(255,255,255,0.65)' }}>
                    {t('play.nogif_sub')}
                  </span>
                </div>
              </div>
            )}

            {/* Question count picker */}
            <div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color: 'rgba(255,255,255,0.65)', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
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
                      <span style={{ position: 'absolute', top: '6px', right: '8px', fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: '0px', color: isSel ? `${modeColor}77` : 'rgba(255,255,255,0.6)' }}>
                        [{i + 1}]
                      </span>
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.2rem', letterSpacing: '1px', lineHeight: 1, color: isSel ? modeColor : 'rgba(255,255,255,0.7)', textShadow: isSel ? `0 0 18px ${modeColor}88` : 'none' }}>
                        {isInf ? '∞' : len}
                      </span>
                      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-2)', color: isSel ? `${modeColor}bb` : 'rgba(255,255,255,0.7)' }}>
                        {isInf ? t('play.infinite_label') : 'Q'}
                      </span>
                      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: '1px', color: isSel ? `${modeColor}66` : 'rgba(255,255,255,0.65)', marginTop: '2px' }}>
                        {isInf ? '∞' : getTimeEst(len)}
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
                  <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', fontFamily: "'Rajdhani', sans-serif", fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
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
                  <Link href="/quiz" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>
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
          color: 'rgba(255,255,255,0.7)',
          fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.95rem', letterSpacing: '3px',
          textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{t('play.modes_btn')}</Link>
        <button onClick={handleShare} style={{
          flex: '1 1 0', padding: '13px 12px',
          background: 'none',
          border: `1px solid ${copied ? '#4ade80' : 'rgba(255,255,255,0.12)'}`,
          color: copied ? '#4ade80' : 'rgba(255,255,255,0.7)',
          fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.95rem', letterSpacing: '3px',
          cursor: 'pointer', transition: 'all 0.3s',
        }}>{copied ? t('play.copied') : t('play.share')}</button>
        <Link href="/profile" style={{
          width: '100%', padding: '10px 12px',
          background: 'none', border: '1px solid rgba(255,255,255,0.07)',
          color: 'rgba(255,255,255,0.68)',
          fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)',
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
            <div className="animate-fadeInUp" style={{ width: '100%', maxWidth: isDesktop ? '720px' : '480px', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', textAlign: 'center' }}>

              <div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(3rem, 12vw, 5rem)', letterSpacing: '6px', lineHeight: 1, color: '#ff2d78', textShadow: '0 0 24px #ff2d7888' }}>
                  {t('play.game_over')}
                </div>
                <div style={{ marginTop: '16px', fontFamily: "'Rajdhani', sans-serif", fontSize: '1.1rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: '1px' }}>
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
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)', color: 'rgba(255,255,255,0.7)', marginTop: '6px' }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              <AchievementToast achievements={newAchievements} onDismiss={dismissAchievement} />

              {/* Survival leaderboard */}
              {survivalLb.length > 0 && (
                <div style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(74,222,128,0.15)' }}>
                  <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(74,222,128,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.85rem', letterSpacing: '4px', color: modeColor }}>SURVIVAL LEADERBOARD</span>
                    {!survivalPseudo && (
                      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-2)', color: 'rgba(255,255,255,0.65)' }}>— set a name on the Stats page to appear here</span>
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
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.85rem', letterSpacing: '2px', color: entry.rank <= 3 ? modeColor : 'rgba(255,255,255,0.65)', minWidth: '20px' }}>
                          {entry.rank <= 3 ? <Icon name="medal" size={18} color={PODIUM[entry.rank - 1]} /> : `#${entry.rank}`}
                        </span>
                        <span style={{ flex: 1, fontFamily: "'Rajdhani', sans-serif", fontSize: '0.85rem', fontWeight: isMe ? 700 : 500, color: isMe ? '#fff' : 'rgba(255,255,255,0.65)', textAlign: 'left' }}>
                          {entry.player_name}
                        </span>
                        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', letterSpacing: '2px', color: isMe ? modeColor : 'rgba(255,255,255,0.7)' }}>
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
          <div className="animate-fadeInUp" style={{ width: '100%', maxWidth: isDesktop ? '720px' : '480px', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', textAlign: 'center' }}>

            <div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color: 'rgba(255,255,255,0.7)', marginBottom: '14px' }}>
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
                { val: <>{maxCombo}<Icon name="flame" size={18} color={ACCENT.combo} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '3px' }} /></>, label: t('play.combo_max') },
              ].map((stat, i) => (
                <div key={i} style={{ padding: '20px 12px', background: 'rgba(0,0,0,0.3)', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.6rem, 5vw, 2.4rem)', letterSpacing: '2px', color: rank.color, textShadow: `0 0 12px ${rank.color}88` }}>
                    {stat.val}
                  </div>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)', color: 'rgba(255,255,255,0.7)', marginTop: '6px' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color: 'rgba(255,255,255,0.65)' }}>
              {modeLabel} — {sessionLength === Infinity ? '∞' : sessionLength} QUESTIONS
            </div>

            <AchievementToast achievements={newAchievements} onDismiss={dismissAchievement} />

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
        padding: '10px 16px', height: 'calc(100dvh - 60px)',
        overflow: 'hidden', boxSizing: 'border-box',
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
            { val: <>{combo}<Icon name="flame" size={15} color={ACCENT.combo} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '2px' }} /></>, label: t('play.score_combo') },
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
                fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)',
                letterSpacing: 'var(--ls-3)', color: 'rgba(255,255,255,0.7)',
              }}>{stat.label}</div>
            </div>
          ))}
          <button
            onClick={() => { setSoundEnabled(toggleSound()) }}
            style={{
              position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
              width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: soundEnabled ? `${modeColor}22` : 'rgba(255,255,255,0.06)',
              border: `1px solid ${soundEnabled ? modeColor : 'rgba(255,255,255,0.3)'}`,
              boxShadow: soundEnabled ? `0 0 10px ${modeColor}44` : 'none',
              color: '#fff', fontSize: '1.05rem', lineHeight: 1,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            title={soundEnabled ? 'Mute SFX' : 'Enable SFX'}
          >
            <Icon name={soundEnabled ? 'soundOn' : 'soundOff'} size={17} />
          </button>
        </div>

        {/* Centering region — fills remaining height so the card fits without scrolling */}
        <div style={{ flex: '1 1 auto', minHeight: 0, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {loading ? (
          <div style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.7)', letterSpacing: '4px' }}>
            {t('play.loading')}
          </div>
        ) : question && (
          <div style={{
            width: '100%', maxWidth: isDesktop ? '900px' : '500px',
            maxHeight: '100%', height: isDesktop ? undefined : '100%',
            boxSizing: 'border-box',
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: isDesktop ? 'grid' : 'flex',
            flexDirection: isDesktop ? undefined : 'column',
            overflowX: 'hidden', overflowY: 'auto',
            gridTemplateColumns: isDesktop ? '45% 55%' : undefined,
          }}>

            {/* Header */}
            <div style={{
              padding: '11px 18px',
              background: `${modeColor}12`,
              borderBottom: `1px solid ${modeColor}28`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gridColumn: isDesktop ? '1 / -1' : undefined,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', letterSpacing: '4px',
                  background: `linear-gradient(90deg, ${modeColor}, ${modeColorAlt})`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>{modeLabel}</span>
                {sessionStat && (
                  <button
                    onClick={() => setInfoOpen(true)}
                    title={t('statx.heading')}
                    style={{
                      width: '20px', height: '20px', flexShrink: 0, lineHeight: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `${modeColor}1a`, border: `1px solid ${modeColor}66`, color: modeColor,
                      fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.8rem', cursor: 'pointer',
                    }}
                  >?</button>
                )}
              </div>
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
              <div style={{ height: '2px', background: 'rgba(255,255,255,0.08)', gridColumn: isDesktop ? '1 / -1' : undefined }}>
                <div style={{
                  height: '100%', width: `${(timeLeft / 5) * 100}%`,
                  background: timeLeft <= 2 ? '#ff2d78' : '#ffe000',
                  transition: 'width 1s linear',
                  boxShadow: `0 0 6px ${timeLeft <= 2 ? '#ff2d78' : '#ffe000'}`,
                }} />
              </div>
            )}

            {/* GIF */}
            <GifSection gifUrl={question.gif_url} gifPath={question.gif_path} moveName={question.move_name} color={modeColor} fallback={t('play.hitbox_preview')} input={question.input} section={question.section} flexible={!isDesktop} />

            {/* Right column on desktop: question + choices + feedback */}
            <div style={isDesktop ? { display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: '1px solid rgba(255,255,255,0.06)' } : { flexShrink: 0 }}>

            {/* Question */}
            <div style={{ padding: '12px 18px 8px' }}>
              {effectivePunish ? (
                <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', fontWeight: 600, lineHeight: 1.4, color: 'rgba(255,255,255,0.9)' }}>
                  <strong style={{ color: '#fff' }}>{question.move_name}</strong>{' '}
                  {t('play.q_is_it_punishable')}{' '}
                  <span style={{ color: modeColor }}>{t('play.q_punishable_on_block')}</span>
                </p>
              ) : effectiveOnBlock ? (
                <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', fontWeight: 600, lineHeight: 1.4, color: 'rgba(255,255,255,0.9)' }}>
                  {t('play.q_what_is')} <span style={{ color: modeColor }}>on block value</span> {t('play.q_of')}{' '}
                  <strong style={{ color: '#fff' }}>{question.move_name}</strong> ?
                </p>
              ) : effectiveOnHit ? (
                <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', fontWeight: 600, lineHeight: 1.4, color: 'rgba(255,255,255,0.9)' }}>
                  {t('play.q_what_is')} <span style={{ color: modeColor }}>on hit value</span> {t('play.q_of')}{' '}
                  <strong style={{ color: '#fff' }}>{question.move_name}</strong> ?
                </p>
              ) : (
                <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', fontWeight: 600, lineHeight: 1.4, color: 'rgba(255,255,255,0.9)' }}>
                  {t('play.q_what_is')} <span style={{ color: modeColor }}>{effectiveDamage ? t('play.q_damage') : effectiveRecovery ? t('play.q_recovery') : effectiveActive ? 'active' : 'startup'}</span> {t('play.q_of')}{' '}
                  <strong style={{ color: '#fff' }}>{question.move_name}</strong> ?
                </p>
              )}
            </div>

            {/* Content by mode */}
            <div style={{ padding: '0 18px' }}>

              {/* MCQ */}
              {!isInput && !effectivePunish && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {question.choices.map((choice, i) => (
                    <button key={choice} onClick={() => handleChoice(choice)} style={makeChoiceStyle(choice, question.answer, selected, state === 'idle')}>
                      <span style={{
                        width: '20px', height: '20px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid rgba(255,255,255,0.18)', fontSize: '0.62rem',
                        fontFamily: "'Share Tech Mono', monospace",
                      }}>{String.fromCharCode(65 + i)}</span>
                      {effectiveOnBlock || effectiveOnHit || effectiveDamage ? choice : `${choice} frames`}
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
                    fontSize: '0.6rem', color: 'rgba(255,255,255,0.68)',
                    letterSpacing: '2px', marginTop: '8px',
                  }}>{t('play.input_hint')}</p>
                </div>
              )}

              {/* PUNISH FINDER mode */}
              {effectivePunish && (
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
                      <Icon name="skull" size={20} color={ACCENT.skull} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} />{t('play.punishable_label')}
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
                      <Icon name="check" size={18} color="#4ade80" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} />{t('play.safe_label')}
                      <div style={{ fontSize: '0.6rem', letterSpacing: '2px', marginTop: '4px', opacity: 0.6 }}>{'-3 à +∞ ON BLOCK'}</div>
                    </button>
                  </div>
                  <p style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: 'var(--fs-xs)', color: 'rgba(255,255,255,0.65)',
                    letterSpacing: '1.5px', marginTop: '8px', textAlign: 'center',
                  }}>{t('play.pushback_note')}</p>
                </div>
              )}
            </div>

            {/* Feedback + next button */}
            <div style={{ padding: '10px 18px 12px' }}>
              {state !== 'idle' && (
                <div style={{
                  padding: '9px 14px', marginBottom: '8px',
                  background: state === 'correct' ? 'rgba(74,222,128,0.1)' : 'rgba(255,45,120,0.1)',
                  border: `1px solid ${state === 'correct' ? '#4ade80' : '#ff2d78'}`,
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '0.9rem', fontWeight: 700,
                  color: state === 'correct' ? '#4ade80' : '#ff2d78',
                }}>
                  {effectiveOnBlock ? (
                    state === 'correct'
                      ? t('play.feedback_correct_onblock', { move: question.move_name, n: question.answer })
                      : t('play.feedback_wrong_onblock', { move: question.move_name, n: question.answer })
                  ) : effectiveOnHit ? (
                    state === 'correct'
                      ? t('play.feedback_correct_onhit', { move: question.move_name, n: question.answer })
                      : t('play.feedback_wrong_onhit', { move: question.move_name, n: question.answer })
                  ) : effectiveRecovery ? (
                    state === 'correct'
                      ? t('play.feedback_correct_recovery', { move: question.move_name, n: question.answer })
                      : t('play.feedback_wrong_recovery', { move: question.move_name, n: question.answer })
                  ) : effectivePunish ? (
                    state === 'correct'
                      ? t('play.feedback_correct_punish', { move: question.move_name, label: t(isPunishable ? 'play.punishable_label' : 'play.safe_label'), value: question.on_block_value ?? '' })
                      : t('play.feedback_wrong_punish',   { move: question.move_name, label: t(isPunishable ? 'play.punishable_label' : 'play.safe_label'), value: question.on_block_value ?? '' })
                  ) : effectiveDamage ? (
                    state === 'correct'
                      ? t('play.feedback_correct_damage', { n: question.answer })
                      : t('play.feedback_wrong_damage', { n: question.answer })
                  ) : effectiveActive ? (
                    state === 'correct'
                      ? t('play.feedback_correct_active', { n: question.answer })
                      : t('play.feedback_wrong_active', { n: question.answer })
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
                  {!effectivePunish && !effectiveDamage && !effectiveOnBlock && !effectiveOnHit && !effectiveRecovery && !effectiveActive && question.on_block_value && (
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-1)', color: 'rgba(255,255,255,0.7)', marginTop: '6px' }}>
                      {question.move_name} — {question.answer}f startup · {question.on_block_value} on block
                    </div>
                  )}
                </div>
              )}
              {state !== 'idle' && (
                <button onClick={handleNextQuestion} style={{
                  width: '100%', padding: '13px',
                  background: isSessionOver
                    ? `linear-gradient(90deg, ${modeColor}, ${modeColorAlt})`
                    : `linear-gradient(90deg, ${modeColorAlt}, ${modeColor})`,
                  border: 'none', cursor: 'pointer',
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '0.95rem', letterSpacing: '4px', color: '#fff',
                  boxShadow: `0 0 16px ${modeColor}33`,
                  transition: 'all 0.2s',
                }}>
                  {isSessionOver ? t('play.see_results') : t('play.next_question')}
                </button>
              )}
            </div>

            </div>{/* end right column */}

          </div>
        )}
        </div>{/* end centering region */}

        <Link href="/quiz" style={{
          flexShrink: 0, marginTop: '10px',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '0.6rem', letterSpacing: '3px',
          color: 'rgba(255,255,255,0.65)', textDecoration: 'none',
        }}>{t('play.change_mode')}</Link>
      </main>

      {/* In-quiz stat explainer modal */}
      {infoOpen && sessionStat && (
        <div
          onClick={() => setInfoOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div onClick={e => e.stopPropagation()} style={{ background: '#0d0015', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 0 60px rgba(0,0,0,0.8)', maxWidth: '460px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <StatExplainer stat={sessionStat} color={modeColor} open onToggle={() => setInfoOpen(false)} t={t} />
          </div>
        </div>
      )}
    </>
  )
}

export default function QuizPlayPage() {
  return <Suspense><QuizPlay /></Suspense>
}

type StatKey = 'startup' | 'onblock' | 'onhit' | 'recovery' | 'damage' | 'active' | 'punish'

const STAT_LABEL: Record<StatKey, string> = {
  startup: 'STARTUP', onblock: 'ON BLOCK', onhit: 'ON HIT', recovery: 'RECOVERY',
  damage: 'DAMAGE', active: 'ACTIVE', punish: 'PUNISH',
}

/** Detailed, plain-language explanation of the stat a mono-stat quiz is testing. */
function StatExplainer({ stat, color, open, onToggle, t }: {
  stat: StatKey
  color: string
  open: boolean
  onToggle: () => void
  t: (k: DictKey, v?: Record<string, string | number>) => string
}) {
  const rows: { lbl: DictKey; body: DictKey }[] = [
    { lbl: 'statx.lbl_def',   body: `statx.${stat}_def`   as DictKey },
    { lbl: 'statx.lbl_scale', body: `statx.${stat}_scale` as DictKey },
    { lbl: 'statx.lbl_use',   body: `statx.${stat}_use`   as DictKey },
  ]
  return (
    <div style={{ border: `1px solid ${color}30`, background: `${color}08` }}>
      <button
        onClick={onToggle}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-2)', color }}>{t('statx.heading')}</span>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', letterSpacing: '1.5px', color: '#fff' }}>{STAT_LABEL[stat]}</span>
        </span>
        <span style={{ color, fontSize: '0.55rem', flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
      </button>
      {open && (
        <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: '11px' }}>
          {rows.map(r => (
            <div key={r.lbl} style={{ display: 'grid', gridTemplateColumns: '88px 1fr', gap: '12px', alignItems: 'start' }}>
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-1)', color: 'rgba(255,255,255,0.7)', paddingTop: '1px' }}>{t(r.lbl)}</span>
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.84rem', fontWeight: 500, color: 'rgba(255,255,255,0.68)', lineHeight: 1.5 }}>{t(r.body)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
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
        color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
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
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-1)', color: '#ff2d78', marginTop: '2px' }}>
                    {t('play.your_answer')}: {fmt(entry.userAnswer)}
                  </div>
                )}
              </div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', letterSpacing: '1px', color: entry.correct ? '#4ade80' : 'rgba(255,255,255,0.7)', textAlign: 'right' }}>
                {fmt(entry.question.answer)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


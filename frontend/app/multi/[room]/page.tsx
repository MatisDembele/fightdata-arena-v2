'use client'
import { useEffect, useRef, useState, use } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useLanguage } from '@/lib/i18n'
import { getFighterPortrait } from '@/lib/portraits'
import { GifSection, makeChoiceStyle } from '@/components/QuestionCard'
import { checkAndUnlock, updateLifetime, RARITY_COLOR, type Achievement } from '@/lib/achievements'

const WS_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/^http/, 'ws')

type Phase = 'connecting' | 'waiting' | 'vs' | 'playing' | 'result' | 'leaderboard' | 'gameover' | 'error'

interface Question {
  move_name: string
  section: string
  gif_url?: string
  gif_path?: string
  question: string
  choices: string[]
  fighter_slug: string
  on_block_value?: string
  game_mode: string
}

interface Scores { [name: string]: number }

const COLOR     = '#ffe000'
const COLOR_WIN = '#4ade80'
const COLOR_LOS = '#ff2d78'
const SLOT_COLORS = ['#ff2d78', '#00f0ff', '#ffe000', '#4ade80', '#c084fc', '#f59e0b']

const MULTI_MODES = [
  { id: 'startup',  label: 'STARTUP',  color: '#ff2d78', suffix: ' frames' },
  { id: 'damage',   label: 'DAMAGE',   color: '#f59e0b', suffix: ''        },
  { id: 'onblock',  label: 'ON BLOCK', color: '#c084fc', suffix: ''        },
  { id: 'punish',   label: 'PUNISH',   color: '#ffe000', suffix: ''        },
  { id: 'onhit',    label: 'ON HIT',   color: '#4ade80', suffix: ''        },
  { id: 'recovery', label: 'RECOVERY', color: '#00f0ff', suffix: ' frames' },
] as const
type MultiModeId = typeof MULTI_MODES[number]['id']

function getModeConfig(id: string) {
  return MULTI_MODES.find(m => m.id === id) ?? MULTI_MODES[0]
}

function playerColor(name: string): string {
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return SLOT_COLORS[hash % SLOT_COLORS.length]
}

export default function MultiRoom({ params }: { params: Promise<{ room: string }> }) {
  const { room }     = use(params)
  const searchParams = useSearchParams()
  const router       = useRouter()
  const playerName   = searchParams.get('name') || 'Joueur'
  const playerAvatar = searchParams.get('avatar') || 'ryu'
  const { t } = useLanguage()

  const wsRef            = useRef<WebSocket | null>(null)
  const leaderboardTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [phase, setPhase]                     = useState<Phase>('connecting')
  const [players, setPlayers]                 = useState<string[]>([])
  const [host, setHost]                       = useState('')
  const [readyPlayers, setReadyPlayers]       = useState<string[]>([])
  const [question, setQuestion]               = useState<Question | null>(null)
  const [questionNumber, setQuestionNumber]   = useState(0)
  const [totalQuestions, setTotalQuestions]   = useState(10)
  const [selected, setSelected]               = useState<string | null>(null)
  const [correctAnswer, setCorrectAnswer]     = useState<string | null>(null)
  const [onBlockValue, setOnBlockValue]       = useState<string | null>(null)
  const [playerAnswers, setPlayerAnswers]     = useState<Record<string, string>>({})
  const [scores, setScores]                   = useState<Scores>({})
  const [winner, setWinner]                   = useState<string | null>(null)
  const [answeredCount, setAnsweredCount]     = useState(0)
  const [totalCount, setTotalCount]           = useState(0)
  const [pointsEarned, setPointsEarned]       = useState<Record<string, number>>({})
  const [correctCounts, setCorrectCounts]     = useState<Record<string, number>>({})
  const [avatars, setAvatars]                 = useState<Record<string, string>>({})
  const [vsPlayers, setVsPlayers]             = useState<string[]>([])
  const [linkCopied, setLinkCopied]           = useState(false)
  const [error, setError]                     = useState('')
  const [gameMode, setGameMode]               = useState('startup')
  const [rematchWaiting, setRematchWaiting]   = useState(false)
  const [rematchVotes, setRematchVotes]       = useState(0)
  const [rematchNeeded, setRematchNeeded]     = useState(0)
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])
  const [leftNote, setLeftNote]               = useState('')
  const [countdown, setCountdown]             = useState(0)

  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/api/multi/ws/${room}/${encodeURIComponent(playerName)}?avatar=${playerAvatar}`)
    wsRef.current = ws

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)

      if (msg.type === 'room_joined') {
        setPlayers(msg.players)
        if (msg.avatars) setAvatars(msg.avatars)
        if (msg.game_mode) setGameMode(msg.game_mode)
        if (msg.max_questions) setTotalQuestions(msg.max_questions)
        if (msg.host) setHost(msg.host)
        if (msg.ready_players) setReadyPlayers(msg.ready_players)
        setPhase('waiting')
      }

      if (msg.type === 'player_joined') {
        setPlayers(msg.players)
        if (msg.avatars) setAvatars(msg.avatars)
        if (msg.host) setHost(msg.host)
        if (msg.ready_players) setReadyPlayers(msg.ready_players)
      }

      if (msg.type === 'ready_update') {
        setReadyPlayers(msg.ready_players ?? [])
      }

      if (msg.type === 'settings_update') {
        if (msg.game_mode) setGameMode(msg.game_mode)
        if (msg.max_questions) setTotalQuestions(msg.max_questions)
      }

      if (msg.type === 'vs') {
        setVsPlayers(msg.players)
        if (msg.avatars) setAvatars(msg.avatars)
        if (msg.game_mode) setGameMode(msg.game_mode)
        setPhase('vs')
      }

      if (msg.type === 'countdown') {
        setCountdown(msg.value)
      }

      if (msg.type === 'question') {
        setCountdown(0)
        if (leaderboardTimer.current) { clearTimeout(leaderboardTimer.current); leaderboardTimer.current = null }
        setQuestion(msg.question)
        setGameMode(msg.game_mode || msg.question.game_mode || 'startup')
        setQuestionNumber(msg.question_number)
        setTotalQuestions(msg.total)
        setSelected(null); setCorrectAnswer(null)
        setOnBlockValue(null); setPlayerAnswers({})
        setPointsEarned({}); setAnsweredCount(0); setPhase('playing')
      }

      if (msg.type === 'player_answered') {
        setAnsweredCount(msg.answered_count ?? 0)
        setTotalCount(msg.total_count ?? 0)
      }

      if (msg.type === 'answer_result') {
        setCorrectAnswer(msg.correct_answer)
        setPlayerAnswers(msg.player_answers)
        setScores(msg.scores)
        setPointsEarned(msg.points_earned ?? {})
        setOnBlockValue(msg.on_block_value ?? null)
        setGameMode(msg.game_mode || gameMode)
        setPhase('result')
        if (leaderboardTimer.current) clearTimeout(leaderboardTimer.current)
        leaderboardTimer.current = setTimeout(() => setPhase('leaderboard'), 1500)
      }

      if (msg.type === 'game_over') {
        setScores(msg.scores)
        setWinner(msg.winner)
        setCorrectCounts(msg.correct_counts ?? {})
        if (msg.avatars) setAvatars(msg.avatars)
        setRematchVotes(0)
        setRematchNeeded(Object.keys(msg.scores).length)
        setPhase('gameover')
      }

      if (msg.type === 'rematch_requested') {
        setRematchVotes(msg.votes ?? 1)
        setRematchNeeded(msg.needed ?? 2)
      }

      if (msg.type === 'rematch_start') {
        setScores({})
        setCorrectCounts({})
        setPointsEarned({})
        setWinner(null)
        setSelected(null)
        setCorrectAnswer(null)
        setOnBlockValue(null)
        setPlayerAnswers({})
        setAnsweredCount(0)
        setQuestionNumber(0)
        setRematchWaiting(false)
        setRematchVotes(0)
        if (msg.avatars) setAvatars(msg.avatars)
        if (msg.players) setPlayers(msg.players)
        if (msg.host) setHost(msg.host)
        if (msg.game_mode) setGameMode(msg.game_mode)
        if (msg.max_questions) setTotalQuestions(msg.max_questions)
        setReadyPlayers([])
        setPhase('waiting')
      }

      if (msg.type === 'ping') {
        wsRef.current?.send(JSON.stringify({ type: 'pong' }))
        return
      }

      if (msg.type === 'player_left') {
        setPlayers(msg.players ?? [])
        if (msg.avatars) setAvatars(msg.avatars)
        if (msg.host) setHost(msg.host)
        if (msg.ready_players) setReadyPlayers(msg.ready_players)
        // Show temporary notification instead of crashing to error screen
        const note = t('multi.player_left_msg', { name: (msg.player ?? '').toUpperCase().slice(0, 10) })
        setLeftNote(note)
        setTimeout(() => setLeftNote(''), 3500)
      }

      if (msg.type === 'error') { setError(msg.message); setPhase('error') }
    }

    ws.onerror  = () => { setError(t('room.ws_failed')); setPhase('error') }
    ws.onopen   = () => {}
    return () => {
      ws.close()
      if (leaderboardTimer.current) clearTimeout(leaderboardTimer.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, playerName])

  useEffect(() => {
    if (phase !== 'gameover' || winner !== playerName) return
    updateLifetime({ multiWins: 1 })
    const newly = checkAndUnlock({ multiWon: true })
    if (newly.length > 0) setNewAchievements(newly)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, winner])

  function sendAnswer(value: string) {
    if (selected || !wsRef.current) return
    setSelected(value)
    wsRef.current.send(JSON.stringify({ type: 'answer', value }))
  }

  function sendRematch() {
    if (!wsRef.current || rematchWaiting) return
    setRematchWaiting(true)
    wsRef.current.send(JSON.stringify({ type: 'rematch' }))
  }

  function sendToggleReady() {
    wsRef.current?.send(JSON.stringify({ type: 'set_ready' }))
  }

  function sendSetMode(mode: string) {
    wsRef.current?.send(JSON.stringify({ type: 'set_game_mode', mode }))
  }

  function sendSetQuestions(n: number) {
    wsRef.current?.send(JSON.stringify({ type: 'set_questions', n }))
  }

  function sendStartGame() {
    wsRef.current?.send(JSON.stringify({ type: 'start_game' }))
  }

  function copyLink() {
    const url = `https://www.fightdata.app/multi?room=${room}`
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2500)
    })
  }

  const isPunish   = gameMode === 'punish'
  const modeConfig = getModeConfig(gameMode)

  const punishBtnStyle = (value: 'punissable' | 'safe'): React.CSSProperties => {
    const isPunishable = value === 'punissable'
    const c = isPunishable ? '#ff2d78' : '#4ade80'
    const isCorrect = correctAnswer === value
    const isWrong   = selected === value && correctAnswer !== null && correctAnswer !== value
    return {
      flex: 1, padding: '20px 12px', cursor: selected ? 'default' : 'pointer',
      fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.3rem', letterSpacing: '4px',
      border: `1px solid ${isWrong ? '#ff2d78' : isCorrect ? c : `${c}44`}`,
      background: isCorrect ? `${c}18` : isWrong ? 'rgba(255,45,120,0.1)' : `${c}08`,
      color: isCorrect ? c : isWrong ? '#ff2d78' : `${c}99`,
      transition: 'all 0.2s', textAlign: 'center' as const,
      boxShadow: isCorrect ? `0 0 20px ${c}33` : 'none',
    }
  }

  const feedbackText = () => {
    if (!correctAnswer || !selected) return ''
    const isCorrect = selected === correctAnswer
    const move = question?.move_name ?? ''
    const answer = correctAnswer
    switch (gameMode) {
      case 'punish': {
        const label = correctAnswer === 'punissable' ? t('room.punishable_label') : t('room.safe_label')
        const ob = onBlockValue ? ` (${t('room.on_block_prefix')}${onBlockValue})` : ''
        return isCorrect
          ? t('room.feedback_correct_punish',   { move, label, ob })
          : t('room.feedback_wrong_punish',     { move, label, ob })
      }
      case 'damage':
        return isCorrect
          ? t('room.feedback_correct_damage',   { answer })
          : t('room.feedback_wrong_damage',     { answer })
      case 'onblock':
        return isCorrect
          ? t('room.feedback_correct_onblock',  { move, answer })
          : t('room.feedback_wrong_onblock',    { move, answer })
      case 'onhit':
        return isCorrect
          ? t('room.feedback_correct_onhit',    { move, answer })
          : t('room.feedback_wrong_onhit',      { move, answer })
      case 'recovery':
        return isCorrect
          ? t('room.feedback_correct_recovery', { move, answer })
          : t('room.feedback_wrong_recovery',   { move, answer })
      default: // startup
        return isCorrect
          ? t('room.feedback_correct_startup',  { answer })
          : t('room.feedback_wrong_startup',    { answer })
    }
  }

  const backBtnStyle: React.CSSProperties = {
    background: 'none', border: `1px solid ${COLOR}`, color: COLOR,
    fontFamily: "'Bebas Neue', sans-serif", fontSize: '1rem', letterSpacing: '4px',
    padding: '10px 28px', cursor: 'pointer', textShadow: `0 0 8px ${COLOR}55`,
  }

  const renderContent = () => {

    if (phase === 'connecting') return <CenteredMsg color={COLOR}>{t('room.connecting')}</CenteredMsg>

    if (phase === 'error') return (
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", color: COLOR_LOS, letterSpacing: '3px', fontSize: '0.8rem' }}>{error}</div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => router.push('/multi')} style={backBtnStyle}>{t('room.lobby')}</button>
          <button onClick={() => router.push('/')} style={{ ...backBtnStyle, border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.4)', textShadow: 'none' }}>{t('room.home')}</button>
        </div>
      </div>
    )

    if (phase === 'waiting') {
      const isHost   = playerName === host
      const amReady  = readyPlayers.includes(playerName)
      const canStart = players.length >= 2
      const allReady = readyPlayers.length === players.length && players.length >= 2

      return (
        <div style={{ width: '100%', maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Header */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.8rem', letterSpacing: '6px', color: '#fff' }}>
              ROOM — <span style={{ color: COLOR, textShadow: `0 0 12px ${COLOR}` }}>{room}</span>
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.48rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.2)', marginTop: '4px' }}>
              {t('room.give_code')}
            </div>
          </div>

          {/* 6 player slots — 3 columns × 2 rows */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {Array.from({ length: 6 }).map((_, i) => {
              const name      = players[i]
              const slug      = name ? (avatars[name] || 'ryu') : null
              const portrait  = slug ? getFighterPortrait(slug) : null
              const isMe      = name === playerName
              const isReady   = name ? readyPlayers.includes(name) : false
              const isHostP   = name === host
              const c         = SLOT_COLORS[i]
              return (
                <div key={i} style={{
                  padding: '10px 8px 8px',
                  border: `1px solid ${name ? c + '40' : 'rgba(255,255,255,0.05)'}`,
                  background: name ? `${c}06` : 'rgba(255,255,255,0.015)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                  position: 'relative', minHeight: '110px', justifyContent: 'center',
                }}>
                  {/* Ready dot */}
                  {name && isReady && (
                    <div style={{ position: 'absolute', top: '6px', right: '6px', width: '7px', height: '7px', borderRadius: '50%', background: COLOR_WIN, boxShadow: `0 0 6px ${COLOR_WIN}` }} />
                  )}
                  {/* Host badge */}
                  {isHostP && (
                    <div style={{ position: 'absolute', top: '4px', left: '5px', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.32rem', letterSpacing: '1px', color: COLOR, background: `${COLOR}18`, padding: '1px 4px' }}>
                      {t('multi.host_badge')}
                    </div>
                  )}
                  {/* Avatar */}
                  <div style={{ width: '48px', height: '48px', overflow: 'hidden', border: `2px solid ${name ? c : 'rgba(255,255,255,0.06)'}`, background: 'rgba(0,0,0,0.4)', flexShrink: 0 }}>
                    {portrait
                      ? <img src={portrait} alt={slug!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', color: 'rgba(255,255,255,0.08)' }}>?</div>
                    }
                  </div>
                  {/* Name */}
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.42rem', letterSpacing: '1px', color: name ? (isMe ? c : 'rgba(255,255,255,0.5)') : 'rgba(255,255,255,0.1)', textAlign: 'center', maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {name ? (isMe ? t('room.you') : name.toUpperCase().slice(0, 8)) : t('multi.slot_empty')}
                  </div>
                  {/* Ready label */}
                  {name && (
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.35rem', letterSpacing: '1px', color: isReady ? COLOR_WIN : 'rgba(255,255,255,0.18)' }}>
                      {isReady ? t('multi.ready') : t('multi.not_ready')}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Host settings panel */}
          {isHost && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px 16px', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.48rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.2)' }}>
                {t('multi.game_mode')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {MULTI_MODES.map(m => (
                  <button key={m.id} onClick={() => sendSetMode(m.id)} style={{
                    padding: '7px 4px', fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.8rem', letterSpacing: '2px',
                    border: `1px solid ${gameMode === m.id ? m.color : 'rgba(255,255,255,0.1)'}`,
                    background: gameMode === m.id ? `${m.color}15` : 'transparent',
                    color: gameMode === m.id ? m.color : 'rgba(255,255,255,0.3)',
                    cursor: 'pointer', transition: 'all 0.2s',
                    textShadow: gameMode === m.id ? `0 0 8px ${m.color}55` : 'none',
                  }}>
                    {m.label}
                  </button>
                ))}
              </div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.48rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.2)', marginTop: '4px' }}>
                {t('multi.num_questions')}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[5, 10, 15, 20].map(n => (
                  <button key={n} onClick={() => sendSetQuestions(n)} style={{
                    flex: 1, padding: '8px', fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', letterSpacing: '2px',
                    border: `1px solid ${totalQuestions === n ? '#00f0ff' : 'rgba(255,255,255,0.1)'}`,
                    background: totalQuestions === n ? 'rgba(0,240,255,0.1)' : 'transparent',
                    color: totalQuestions === n ? '#00f0ff' : 'rgba(255,255,255,0.3)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Non-host sees current settings */}
          {!isHost && (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.52rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.2)', padding: '4px 10px', border: '1px solid rgba(255,255,255,0.07)' }}>
                {totalQuestions} Q
              </div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.52rem', letterSpacing: '3px', color: modeConfig.color, padding: '4px 10px', border: `1px solid ${modeConfig.color}33` }}>
                {modeConfig.label}
              </div>
            </div>
          )}

          {/* Action row */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {!isHost ? (
              <button onClick={sendToggleReady} style={{
                flex: 1, padding: '13px', fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.95rem', letterSpacing: '4px',
                border: `1px solid ${amReady ? COLOR_WIN : 'rgba(255,255,255,0.18)'}`,
                background: amReady ? `${COLOR_WIN}12` : 'rgba(255,255,255,0.03)',
                color: amReady ? COLOR_WIN : 'rgba(255,255,255,0.4)',
                cursor: 'pointer', transition: 'all 0.2s',
                textShadow: amReady ? `0 0 8px ${COLOR_WIN}66` : 'none',
              }}>
                {amReady ? `✓ ${t('multi.ready')}` : t('multi.not_ready')}
              </button>
            ) : (
              <button onClick={sendStartGame} disabled={!canStart} style={{
                flex: 1, padding: '13px', fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.95rem', letterSpacing: '4px',
                border: `1px solid ${canStart ? (allReady ? COLOR_WIN : COLOR) : 'rgba(255,255,255,0.07)'}`,
                background: canStart ? (allReady ? `${COLOR_WIN}12` : `${COLOR}12`) : 'transparent',
                color: canStart ? (allReady ? COLOR_WIN : COLOR) : 'rgba(255,255,255,0.15)',
                cursor: canStart ? 'pointer' : 'default',
                transition: 'all 0.3s',
                textShadow: canStart ? `0 0 10px ${allReady ? COLOR_WIN : COLOR}66` : 'none',
                boxShadow: canStart && allReady ? `0 0 20px ${COLOR_WIN}33` : 'none',
              }}>
                {t('multi.launch')}
              </button>
            )}
            <button onClick={copyLink} style={{
              padding: '13px 14px', background: 'none',
              border: `1px solid ${linkCopied ? COLOR_WIN : 'rgba(255,255,255,0.1)'}`,
              color: linkCopied ? COLOR_WIN : 'rgba(255,255,255,0.3)',
              fontFamily: "'Share Tech Mono', monospace", fontSize: '0.48rem', letterSpacing: '2px',
              cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}>
              {linkCopied ? t('room.link_copied') : t('room.copy_link')}
            </button>
          </div>

          {/* Ready count info */}
          {players.length >= 2 && (
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.44rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.18)', textAlign: 'center' }}>
              {t('multi.ready_count', { n: readyPlayers.length, total: players.length })}
              {!isHost && !amReady && ' — ' + t('multi.waiting_host')}
            </div>
          )}
        </div>
      )
    }

    if (phase === 'vs') {
      return (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px',
          background: 'rgba(4,0,12,0.97)',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,45,120,0.08) 0%, transparent 50%, rgba(0,240,255,0.06) 100%)' }} />

          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(4rem, 12vw, 6rem)', letterSpacing: '12px', color: COLOR, textShadow: `0 0 30px ${COLOR}, 0 0 60px ${COLOR}44`, lineHeight: 1, position: 'relative', zIndex: 1 }}>
            VS
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', maxWidth: '520px', position: 'relative', zIndex: 1 }}>
            {vsPlayers.map((name) => {
              const slug    = avatars[name] || 'ryu'
              const portrait = getFighterPortrait(slug)
              const isMe    = name === playerName
              const c       = playerColor(name)
              return (
                <div key={name} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: 'clamp(64px, 12vw, 96px)', height: 'clamp(64px, 12vw, 96px)', overflow: 'hidden', border: `3px solid ${c}`, boxShadow: `0 0 24px ${c}55`, background: 'rgba(0,0,0,0.5)' }}>
                    {portrait ? <img src={portrait} alt={slug} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                  </div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.85rem', letterSpacing: '3px', color: isMe ? c : '#fff', textShadow: isMe ? `0 0 10px ${c}` : 'none' }}>
                    {isMe ? t('room.you') : name.toUpperCase().slice(0, 8)}
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.48rem', letterSpacing: '4px', color: 'rgba(255,255,255,0.15)', position: 'relative', zIndex: 1 }}>
            ROOM {room} — {gameMode.toUpperCase()} — {totalQuestions} Q
          </div>
        </div>
      )
    }

    if ((phase === 'playing' || phase === 'result') && question) {
      const myAnsweredThis = !!selected
      const statusText = myAnsweredThis
        ? answeredCount >= totalCount
          ? t('room.both_answered')
          : t('multi.answered_count', { n: answeredCount, total: totalCount })
        : answeredCount > 0
          ? t('multi.answered_count', { n: answeredCount, total: totalCount })
          : t('multi.answered_count', { n: 0, total: totalCount || players.length })

      return (
        <div style={{ width: '100%', maxWidth: '500px', minWidth: 0 }}>

          <div style={{ padding: '10px 18px', background: 'rgba(255,224,0,0.06)', borderBottom: `1px solid ${COLOR}28`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', letterSpacing: '4px', color: COLOR, textShadow: `0 0 8px ${COLOR}55` }}>
                Q{questionNumber}/{totalQuestions}
              </span>
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '3px', color: modeConfig.color, marginLeft: '12px', opacity: 0.6 }}>
                {modeConfig.label}
              </span>
            </div>
            <Scoreboard scores={scores} playerName={playerName} avatars={avatars} color={COLOR} youLabel={t('room.you')} />
          </div>

          <GifSection gifUrl={question.gif_url} gifPath={question.gif_path} moveName={question.move_name} color={COLOR} />

          <div style={{ padding: '14px 18px 10px' }}>
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', margin: 0 }}>
              {isPunish
                ? <><strong style={{ color: '#fff' }}>{question.move_name}</strong> {t('room.q_is_it')} <span style={{ color: COLOR_LOS }}>{t('room.q_punishable_on_block')}</span></>
                : <>{t('room.q_what_is')} <span style={{ color: modeConfig.color }}>{modeConfig.label.toLowerCase()}</span> {t('room.q_of')} <strong style={{ color: '#fff' }}>{question.move_name}</strong> ?</>
              }
            </p>
          </div>

          <div style={{ padding: '0 18px' }}>
            {!isPunish && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {question.choices.map((choice, i) => (
                  <button key={choice} onClick={() => sendAnswer(choice)} style={{ ...makeChoiceStyle(choice, correctAnswer, selected, !correctAnswer), cursor: selected || correctAnswer ? 'default' : 'pointer' }}>
                    <span style={{ width: '20px', height: '20px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.18)', fontSize: '0.62rem' }}>{String.fromCharCode(65 + i)}</span>
                    {choice}{modeConfig.suffix}
                  </button>
                ))}
              </div>
            )}
            {isPunish && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => sendAnswer('punissable')} disabled={!!selected} style={punishBtnStyle('punissable')}>
                  💀 {t('room.punishable_label')}
                  <div style={{ fontSize: '0.55rem', letterSpacing: '2px', marginTop: '4px', opacity: 0.6 }}>{'≤ -4 ON BLOCK'}</div>
                </button>
                <button onClick={() => sendAnswer('safe')} disabled={!!selected} style={punishBtnStyle('safe')}>
                  ✓ {t('room.safe_label')}
                  <div style={{ fontSize: '0.55rem', letterSpacing: '2px', marginTop: '4px', opacity: 0.6 }}>{'-3 À +∞ ON BLOCK'}</div>
                </button>
              </div>
            )}
          </div>

          <div style={{ padding: '12px 18px 18px' }}>
            {phase === 'playing' && (
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '2px', color: answeredCount > 0 ? COLOR : 'rgba(255,255,255,0.2)', textAlign: 'center', transition: 'color 0.3s' }}>
                {statusText}
              </div>
            )}
            {phase === 'result' && correctAnswer && (() => {
              const myPts    = pointsEarned[playerName] ?? 0
              const isCorrect = selected === correctAnswer
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', padding: '6px 14px 0' }}>
                    <span style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: '1.6rem', letterSpacing: '3px',
                      color: isCorrect ? COLOR : 'rgba(255,255,255,0.2)',
                      textShadow: isCorrect ? `0 0 16px ${COLOR}` : 'none',
                    }}>
                      {isCorrect ? `+${myPts}` : '0'} PTS
                    </span>
                    {isCorrect && (
                      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '2px', color: 'rgba(255,224,0,0.5)' }}>
                        {myPts === 1000 ? 'PERFECT' : myPts >= 800 ? 'FAST!' : myPts >= 500 ? 'GOOD' : 'SLOW'}
                      </span>
                    )}
                  </div>
                  <div style={{ padding: '9px 14px', background: isCorrect ? 'rgba(74,222,128,0.1)' : 'rgba(255,45,120,0.1)', border: `1px solid ${isCorrect ? '#4ade80' : '#ff2d78'}`, fontFamily: "'Rajdhani', sans-serif", fontSize: '0.9rem', fontWeight: 700, color: isCorrect ? '#4ade80' : '#ff2d78' }}>
                    {feedbackText()}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )
    }

    if (phase === 'leaderboard') {
      const sorted = Object.entries(scores).sort(([,a],[,b]) => b - a)
      const leader = sorted[0]?.[0]
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%', maxWidth: '380px' }}>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '5px', color: 'rgba(255,255,255,0.3)' }}>
            Q{questionNumber}/{totalQuestions} — {t('room.leaderboard')}
          </div>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {sorted.map(([name, score], rank) => {
              const isLeader = name === leader
              const isMe     = name === playerName
              const slug     = avatars[name] || 'ryu'
              const portrait = getFighterPortrait(slug)
              const pts      = pointsEarned[name] ?? 0
              return (
                <div key={name} style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px',
                  background: isLeader ? 'rgba(255,224,0,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isLeader ? 'rgba(255,224,0,0.4)' : 'rgba(255,255,255,0.07)'}`,
                  transition: 'all 0.3s',
                }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', color: isLeader ? COLOR : 'rgba(255,255,255,0.25)', width: '20px', textAlign: 'center' }}>
                    {rank + 1}
                  </div>
                  <div style={{ width: '36px', height: '36px', overflow: 'hidden', border: `2px solid ${isLeader ? COLOR : 'rgba(255,255,255,0.15)'}`, flexShrink: 0 }}>
                    {portrait ? <img src={portrait} alt={slug} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', letterSpacing: '2px', color: isLeader ? COLOR : isMe ? '#fff' : 'rgba(255,255,255,0.6)', textShadow: isLeader ? `0 0 10px ${COLOR}` : 'none' }}>
                      {isMe ? t('room.you') : name.toUpperCase().slice(0, 12)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', letterSpacing: '2px', color: isLeader ? COLOR : 'rgba(255,255,255,0.5)', textShadow: isLeader ? `0 0 12px ${COLOR}` : 'none' }}>{score}</div>
                    {pts > 0 && <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.5rem', letterSpacing: '2px', color: 'rgba(255,224,0,0.5)' }}>+{pts}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    if (phase === 'gameover') {
      const sorted    = Object.entries(scores).sort(([,a],[,b]) => b - a)
      const myRank    = sorted.findIndex(([n]) => n === playerName)
      const isWin     = winner === playerName
      const isDraw    = winner === 'draw'
      const MEDALS    = ['🥇', '🥈', '🥉']

      return (
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>

          <div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 'clamp(3rem, 10vw, 4.5rem)',
              letterSpacing: '10px', lineHeight: 1,
              color: isDraw ? COLOR : isWin ? COLOR_WIN : COLOR_LOS,
              textShadow: `0 0 20px ${isDraw ? COLOR : isWin ? COLOR_WIN : COLOR_LOS}, 0 0 50px ${isDraw ? COLOR : isWin ? COLOR_WIN : COLOR_LOS}44`,
            }}>
              {isDraw ? t('room.draw') : isWin ? t('room.victory') : t('room.defeat')}
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '4px', color: 'rgba(255,255,255,0.25)', marginTop: '8px' }}>
              {isDraw ? t('room.draw_msg') : isWin ? t('room.well_played') : t('room.better_luck')}
            </div>
          </div>

          {/* Full ranking */}
          <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {sorted.map(([name, score], rank) => {
              const isMe      = name === playerName
              const isFirst   = rank === 0
              const slug      = avatars[name] || 'ryu'
              const portrait  = getFighterPortrait(slug)
              const correct   = correctCounts[name] ?? 0
              const acc       = Math.round((correct / totalQuestions) * 100)
              const medal     = MEDALS[rank] ?? `#${rank + 1}`
              return (
                <div key={name} style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                  background: isMe ? `${COLOR}0a` : isFirst ? `${COLOR_WIN}06` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isMe ? `${COLOR}30` : isFirst ? `${COLOR_WIN}20` : 'rgba(255,255,255,0.06)'}`,
                }}>
                  <span style={{ fontSize: '1rem', width: '24px', textAlign: 'center', flexShrink: 0 }}>{medal}</span>
                  <div style={{ width: '34px', height: '34px', overflow: 'hidden', border: `2px solid ${isMe ? COLOR : 'rgba(255,255,255,0.12)'}`, flexShrink: 0 }}>
                    {portrait ? <img src={portrait} alt={slug} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.85rem', letterSpacing: '2px', color: isMe ? COLOR : 'rgba(255,255,255,0.65)', textShadow: isMe ? `0 0 8px ${COLOR}` : 'none' }}>
                      {isMe ? t('room.you') : name.toUpperCase().slice(0, 12)}
                    </div>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.38rem', letterSpacing: '1px', color: 'rgba(255,255,255,0.2)', marginTop: '2px' }}>
                      {acc}% {t('room.precision')}
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.3rem', letterSpacing: '2px', color: isFirst ? COLOR_WIN : isMe ? COLOR : 'rgba(255,255,255,0.4)', textShadow: isFirst ? `0 0 10px ${COLOR_WIN}` : 'none' }}>
                    {score}
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.52rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.18)' }}>
            {t('room.questions_mode', { n: totalQuestions, mode: gameMode.toUpperCase() })}
          </div>

          {newAchievements.length > 0 && myRank === 0 && (
            <div style={{ width: '100%', maxWidth: '400px', padding: '14px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.48rem', letterSpacing: '4px', color: '#f59e0b' }}>
                {t('play.achievement_unlocked')}
              </div>
              {newAchievements.map(a => (
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
          )}

          {/* Rematch */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
            {!rematchWaiting ? (
              <button onClick={sendRematch} style={{ ...backBtnStyle, border: '1px solid #00f0ff', color: '#00f0ff', textShadow: '0 0 8px rgba(0,240,255,0.4)', padding: '12px 40px', fontSize: '1.1rem' }}>
                {t('room.rematch')}
              </button>
            ) : (
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
                {rematchVotes < rematchNeeded
                  ? t('multi.rematch_votes', { n: rematchVotes, total: rematchNeeded })
                  : t('room.rematch_waiting')
                }
              </div>
            )}
            {rematchVotes > 0 && !rematchWaiting && (
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.5rem', letterSpacing: '2px', color: '#00f0ff', opacity: 0.6 }}>
                {t('multi.rematch_votes', { n: rematchVotes, total: rematchNeeded })}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              <button onClick={() => router.push('/multi')} style={backBtnStyle}>{t('room.lobby')}</button>
              <button onClick={() => router.push('/')} style={{ ...backBtnStyle, border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.4)', textShadow: 'none' }}>{t('room.home')}</button>
            </div>
          </div>

        </div>
      )
    }

    return null
  }

  return (
    <>
      <Navbar />
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)', padding: '24px 20px' }}>
        {renderContent()}
      </main>

      {/* Player left notification */}
      {leftNote && (
        <div style={{
          position: 'fixed', top: '72px', left: '50%', transform: 'translateX(-50%)',
          fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '3px',
          color: COLOR_LOS, background: 'rgba(4,0,12,0.92)', padding: '8px 20px',
          border: `1px solid ${COLOR_LOS}44`, zIndex: 200, whiteSpace: 'nowrap',
          boxShadow: `0 0 16px ${COLOR_LOS}22`,
        }}>
          {leftNote}
        </div>
      )}

      {/* Countdown overlay */}
      {countdown > 0 && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(4,0,12,0.65)',
          pointerEvents: 'none',
        }}>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(8rem, 22vw, 14rem)',
            lineHeight: 1,
            color: '#ffe000',
            textShadow: '0 0 40px #ffe000, 0 0 80px rgba(255,224,0,0.5), 0 0 120px rgba(255,224,0,0.2)',
            letterSpacing: '-4px',
          }}>
            {countdown}
          </div>
        </div>
      )}
    </>
  )
}

function CenteredMsg({ children, color }: { children: React.ReactNode; color: string }) {
  return <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.75rem', letterSpacing: '4px', color, textShadow: `0 0 10px ${color}55` }}>{children}</div>
}

function Scoreboard({ scores, playerName, avatars, color, youLabel }: { scores: { [k: string]: number }; playerName: string; avatars: Record<string, string>; color: string; youLabel: string }) {
  const entries = Object.entries(scores)
  if (!entries.length) return null
  const sorted = [...entries].sort(([,a],[,b]) => b - a).slice(0, 4)
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {sorted.map(([name, score]) => {
        const isMe    = name === playerName
        const slug    = avatars[name] || 'ryu'
        const portrait = getFighterPortrait(slug)
        return (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '22px', height: '22px', overflow: 'hidden', border: `1px solid ${isMe ? color : 'rgba(255,255,255,0.2)'}`, flexShrink: 0 }}>
              {portrait
                ? <img src={portrait} alt={slug} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>{name[0]}</span>
              }
            </div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', letterSpacing: '1px', color: isMe ? color : 'rgba(255,255,255,0.35)', textShadow: isMe ? `0 0 8px ${color}` : 'none' }}>{score}</div>
          </div>
        )
      })}
    </div>
  )
}

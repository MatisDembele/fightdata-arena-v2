'use client'
import { useEffect, useRef, useState, use } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useLanguage } from '@/lib/i18n'
import { getFighterPortrait } from '@/lib/portraits'

const WS_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/^http/, 'ws')

type Phase = 'connecting' | 'waiting' | 'vs' | 'playing' | 'result' | 'gameover' | 'error'

interface Question {
  move_name: string
  section: string
  gif_url?: string
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

export default function MultiRoom({ params }: { params: Promise<{ room: string }> }) {
  const { room }     = use(params)
  const searchParams = useSearchParams()
  const router       = useRouter()
  const playerName   = searchParams.get('name') || 'Joueur'
  const playerAvatar = searchParams.get('avatar') || 'ryu'
  const { t } = useLanguage()

  const wsRef = useRef<WebSocket | null>(null)

  const [phase, setPhase]                       = useState<Phase>('connecting')
  const [players, setPlayers]                   = useState<string[]>([])
  const [question, setQuestion]                 = useState<Question | null>(null)
  const [questionNumber, setQuestionNumber]     = useState(0)
  const [totalQuestions, setTotalQuestions]     = useState(5)
  const [selected, setSelected]                 = useState<string | null>(null)
  const [correctAnswer, setCorrectAnswer]       = useState<string | null>(null)
  const [onBlockValue, setOnBlockValue]         = useState<string | null>(null)
  const [playerAnswers, setPlayerAnswers]       = useState<Record<string, string>>({})
  const [scores, setScores]                     = useState<Scores>({})
  const [winner, setWinner]                     = useState<string | null>(null)
  const [opponentAnswered, setOpponentAnswered] = useState(false)
  const [pointsEarned, setPointsEarned]         = useState<Record<string, number>>({})
  const [correctCounts, setCorrectCounts]       = useState<Record<string, number>>({})
  const [avatars, setAvatars]                   = useState<Record<string, string>>({})
  const [vsPlayers, setVsPlayers]               = useState<string[]>([])
  const [error, setError]                       = useState('')
  const [gameMode, setGameMode]                 = useState('startup')

  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/api/multi/ws/${room}/${encodeURIComponent(playerName)}?avatar=${playerAvatar}`)
    wsRef.current = ws

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)

      if (msg.type === 'room_joined' || msg.type === 'player_joined') {
        setPlayers(msg.players)
        if (msg.avatars) setAvatars(msg.avatars)
      }
      if (msg.type === 'waiting') setPhase('waiting')
      if (msg.type === 'vs') {
        setVsPlayers(msg.players)
        if (msg.avatars) setAvatars(msg.avatars)
        setPhase('vs')
      }
      if (msg.type === 'question') {
        setQuestion(msg.question)
        setGameMode(msg.game_mode || msg.question.game_mode || 'startup')
        setQuestionNumber(msg.question_number)
        setTotalQuestions(msg.total)
        setSelected(null); setCorrectAnswer(null)
        setOnBlockValue(null); setPlayerAnswers({})
        setPointsEarned({}); setOpponentAnswered(false); setPhase('playing')
      }
      if (msg.type === 'opponent_answered') setOpponentAnswered(true)
      if (msg.type === 'answer_result') {
        setCorrectAnswer(msg.correct_answer)
        setPlayerAnswers(msg.player_answers)
        setScores(msg.scores)
        setPointsEarned(msg.points_earned ?? {})
        setOnBlockValue(msg.on_block_value ?? null)
        setGameMode(msg.game_mode || gameMode)
        setPhase('result')
      }
      if (msg.type === 'game_over') {
        setScores(msg.scores)
        setWinner(msg.winner)
        setCorrectCounts(msg.correct_counts ?? {})
        if (msg.avatars) setAvatars(msg.avatars)
        setPhase('gameover')
      }
      if (msg.type === 'player_left') {
        setPlayers(msg.players)
        setError(t('room.opponent_left'))
        setPhase('error')
      }
      if (msg.type === 'error') { setError(msg.message); setPhase('error') }
    }

    ws.onerror  = () => { setError(t('room.ws_failed')); setPhase('error') }
    ws.onopen   = () => setPhase('waiting')
    return () => ws.close()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, playerName])

  function sendAnswer(value: string) {
    if (selected || !wsRef.current) return
    setSelected(value)
    wsRef.current.send(JSON.stringify({ type: 'answer', value }))
  }

  const opponent = players.find(p => p !== playerName)
  const isPunish = gameMode === 'punish'

  const choiceStyle = (choice: string): React.CSSProperties => {
    const base: React.CSSProperties = {
      padding: '11px 14px', width: '100%', textAlign: 'left',
      display: 'flex', alignItems: 'center', gap: '10px',
      border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.04)',
      fontFamily: "'Share Tech Mono', monospace", fontSize: '0.88rem',
      color: 'rgba(255,255,255,0.75)', cursor: selected ? 'default' : 'pointer',
      transition: 'all 0.15s',
    }
    if (!correctAnswer) return base
    if (choice === correctAnswer) return { ...base, background: 'rgba(74,222,128,0.12)', border: '1px solid #4ade80', color: '#4ade80' }
    if (choice === selected)      return { ...base, background: 'rgba(255,45,120,0.12)', border: '1px solid #ff2d78', color: '#ff2d78' }
    return { ...base, opacity: 0.3 }
  }

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
    if (isPunish) {
      const label = correctAnswer === 'punissable' ? t('room.punishable_label') : t('room.safe_label')
      const ob = onBlockValue ? ` (${t('room.on_block_prefix')}${onBlockValue})` : ''
      return isCorrect
        ? t('room.feedback_correct_punish', { move: question?.move_name ?? '', label, ob })
        : t('room.feedback_wrong_punish',   { move: question?.move_name ?? '', label, ob })
    }
    return isCorrect
      ? t('room.feedback_correct_startup', { answer: correctAnswer })
      : t('room.feedback_wrong_startup',   { answer: correctAnswer })
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
        <button onClick={() => router.push('/multi')} style={backBtnStyle}>{t('room.lobby')}</button>
      </div>
    )

    if (phase === 'waiting') return (
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', letterSpacing: '6px', color: '#fff' }}>
          ROOM — <span style={{ color: COLOR, textShadow: `0 0 12px ${COLOR}` }}>{room}</span>
        </div>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.3)' }}>{t('room.give_code')}</div>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>{t('room.waiting')}</div>
        <Players players={players} playerName={playerName} avatars={avatars} color={COLOR} youLabel={t('room.you')} />
      </div>
    )

    if (phase === 'vs') {
      const p1 = vsPlayers[0] ?? ''
      const p2 = vsPlayers[1] ?? ''
      const slug1 = avatars[p1] || 'ryu'
      const slug2 = avatars[p2] || 'ryu'
      const portrait1 = getFighterPortrait(slug1)
      const portrait2 = getFighterPortrait(slug2)
      return (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(4,0,12,0.97)',
          overflow: 'hidden',
        }}>
          {/* Diagonal split background */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, rgba(255,45,120,0.12) 0%, transparent 50%, rgba(0,240,255,0.1) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(-55deg, transparent, transparent 20px, rgba(255,255,255,0.012) 20px, rgba(255,255,255,0.012) 21px)' }} />

          {/* Player 1 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '120px', height: '120px', overflow: 'hidden', border: '3px solid #ff2d78', boxShadow: '0 0 30px rgba(255,45,120,0.5)', background: 'rgba(0,0,0,0.5)' }}>
              {portrait1 ? <img src={portrait1} alt={slug1} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
            </div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.2rem', letterSpacing: '4px', color: p1 === playerName ? '#ff2d78' : '#fff', textShadow: p1 === playerName ? '0 0 12px #ff2d78' : 'none' }}>
              {p1 === playerName ? t('room.you') : p1.toUpperCase().slice(0, 10)}
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.3)' }}>
              {slug1.toUpperCase()}
            </div>
          </div>

          {/* VS */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', position: 'relative', zIndex: 1, flexShrink: 0, padding: '0 16px' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(4rem, 12vw, 7rem)', letterSpacing: '8px', color: '#ffe000', textShadow: '0 0 30px #ffe000, 0 0 60px rgba(255,224,0,0.4)', lineHeight: 1 }}>VS</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '4px', color: 'rgba(255,255,255,0.2)' }}>ROOM {room}</div>
          </div>

          {/* Player 2 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '120px', height: '120px', overflow: 'hidden', border: '3px solid #00f0ff', boxShadow: '0 0 30px rgba(0,240,255,0.5)', background: 'rgba(0,0,0,0.5)' }}>
              {portrait2 ? <img src={portrait2} alt={slug2} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
            </div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.2rem', letterSpacing: '4px', color: p2 === playerName ? '#00f0ff' : '#fff', textShadow: p2 === playerName ? '0 0 12px #00f0ff' : 'none' }}>
              {p2 === playerName ? t('room.you') : p2.toUpperCase().slice(0, 10)}
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.3)' }}>
              {slug2.toUpperCase()}
            </div>
          </div>
        </div>
      )
    }

    if ((phase === 'playing' || phase === 'result') && question) return (
      <div style={{ width: '100%', maxWidth: '500px', minWidth: 0 }}>

        <div style={{ padding: '10px 18px', background: 'rgba(255,224,0,0.06)', borderBottom: `1px solid ${COLOR}28`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', letterSpacing: '4px', color: COLOR, textShadow: `0 0 8px ${COLOR}55` }}>
              Q{questionNumber}/{totalQuestions}
            </span>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '3px', color: '#ff2d78', marginLeft: '12px', opacity: 0.6 }}>
              {isPunish ? 'PUNISH' : 'STARTUP'}
            </span>
          </div>
          <Scoreboard scores={scores} playerName={playerName} avatars={avatars} color={COLOR} youLabel={t('room.you')} />
        </div>

        <div style={{ height: '180px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
          {question.gif_url
            ? <img src={question.gif_url} alt={question.move_name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
            : <span style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.15)', fontSize: '0.6rem', letterSpacing: '3px' }}>HITBOX PREVIEW</span>
          }
          {[
            { top: '7px', left: '7px', borderTop: `1px solid ${COLOR}`, borderLeft: `1px solid ${COLOR}` },
            { top: '7px', right: '7px', borderTop: `1px solid ${COLOR}`, borderRight: `1px solid ${COLOR}` },
            { bottom: '7px', left: '7px', borderBottom: `1px solid ${COLOR}`, borderLeft: `1px solid ${COLOR}` },
            { bottom: '7px', right: '7px', borderBottom: `1px solid ${COLOR}`, borderRight: `1px solid ${COLOR}` },
          ].map((s, i) => <div key={i} style={{ position: 'absolute', width: '10px', height: '10px', ...s }} />)}
        </div>

        <div style={{ padding: '14px 18px 10px' }}>
          <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', margin: 0 }}>
            {isPunish
              ? <><strong style={{ color: '#fff' }}>{question.move_name}</strong> {t('room.q_is_it')} <span style={{ color: COLOR_LOS }}>{t('room.q_punishable_on_block')}</span></>
              : <>{t('room.q_what_is')} <span style={{ color: COLOR }}>startup</span> {t('room.q_of')} <strong style={{ color: '#fff' }}>{question.move_name}</strong> ?</>
            }
          </p>
        </div>

        <div style={{ padding: '0 18px' }}>
          {!isPunish && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {question.choices.map((choice, i) => (
                <button key={choice} onClick={() => sendAnswer(choice)} style={choiceStyle(choice)}>
                  <span style={{ width: '20px', height: '20px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.18)', fontSize: '0.62rem' }}>{String.fromCharCode(65 + i)}</span>
                  {choice} frames
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
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '2px', color: opponentAnswered ? COLOR : 'rgba(255,255,255,0.2)', textAlign: 'center', transition: 'color 0.3s' }}>
              {selected
                ? opponentAnswered
                  ? t('room.both_answered')
                  : t('room.waiting_for', { name: (opponent || 'ADVERSAIRE').toUpperCase() })
                : opponentAnswered
                  ? t('room.opponent_answered', { name: (opponent || 'ADVERSAIRE').toUpperCase() })
                  : t('room.waiting_for', { name: (opponent || 'ADVERSAIRE').toUpperCase() })
              }
            </div>
          )}
          {phase === 'result' && correctAnswer && (() => {
            const myPts = pointsEarned[playerName] ?? 0
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

    if (phase === 'gameover') {
      const myScore  = scores[playerName] ?? 0
      const oppEntry = Object.entries(scores).find(([n]) => n !== playerName)
      const oppName  = oppEntry?.[0] ?? 'Adversaire'
      const oppScore = oppEntry?.[1] ?? 0
      const isWin       = winner === playerName
      const isDraw      = winner === 'draw'
      const myCorrect   = correctCounts[playerName] ?? 0
      const oppCorrect  = correctCounts[oppName] ?? 0
      const accuracy    = Math.round((myCorrect / totalQuestions) * 100)
      const oppAccuracy = Math.round((oppCorrect / totalQuestions) * 100)

      return (
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '28px', alignItems: 'center' }}>

          <div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 'clamp(3rem, 10vw, 5rem)',
              letterSpacing: '10px', lineHeight: 1,
              color: isDraw ? COLOR : isWin ? COLOR_WIN : COLOR_LOS,
              textShadow: `0 0 20px ${isDraw ? COLOR : isWin ? COLOR_WIN : COLOR_LOS}, 0 0 50px ${isDraw ? COLOR : isWin ? COLOR_WIN : COLOR_LOS}55`,
            }}>
              {isDraw ? t('room.draw') : isWin ? t('room.victory') : t('room.defeat')}
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '4px', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>
              {isDraw ? t('room.draw_msg') : isWin ? t('room.well_played') : t('room.better_luck')}
            </div>
          </div>

          <div className="gameover-scores">
            <div className="gameover-score-cell" style={{ background: isWin ? 'rgba(74,222,128,0.06)' : isDraw ? 'rgba(255,224,0,0.06)' : 'rgba(255,255,255,0.03)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2.5rem, 10vw, 3.5rem)', letterSpacing: '2px', color: isWin ? COLOR_WIN : isDraw ? COLOR : 'rgba(255,255,255,0.5)', textShadow: isWin ? `0 0 20px ${COLOR_WIN}` : isDraw ? `0 0 20px ${COLOR}` : 'none' }}>{myScore}</div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>{t('room.you')}</div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.5rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.2)', marginTop: '4px' }}>{accuracy}% {t('room.precision')}</div>
            </div>
            <div className="gameover-score-cell" style={{ background: !isWin && !isDraw ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.03)' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2.5rem, 10vw, 3.5rem)', letterSpacing: '2px', color: !isWin && !isDraw ? COLOR_WIN : 'rgba(255,255,255,0.5)', textShadow: !isWin && !isDraw ? `0 0 20px ${COLOR_WIN}` : 'none' }}>{oppScore}</div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>{oppName.toUpperCase().slice(0, 8)}</div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.5rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.2)', marginTop: '4px' }}>{oppAccuracy}% {t('room.precision')}</div>
            </div>
          </div>

          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.2)' }}>
            {t('room.questions_mode', { n: totalQuestions, mode: gameMode.toUpperCase() })}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => router.push('/multi')} style={backBtnStyle}>{t('room.replay')}</button>
            <button onClick={() => router.push('/')} style={{ ...backBtnStyle, border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.4)', textShadow: 'none' }}>{t('room.home')}</button>
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
    </>
  )
}

function CenteredMsg({ children, color }: { children: React.ReactNode; color: string }) {
  return <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.75rem', letterSpacing: '4px', color, textShadow: `0 0 10px ${color}55` }}>{children}</div>
}

function Players({ players, playerName, avatars, color, youLabel }: { players: string[]; playerName: string; avatars: Record<string, string>; color: string; youLabel: string }) {
  return (
    <div style={{ display: 'flex', gap: '32px', marginTop: '8px' }}>
      {[0, 1].map(i => {
        const name    = players[i]
        const slug    = name ? (avatars[name] || 'ryu') : null
        const portrait = slug ? getFighterPortrait(slug) : null
        const isMe    = name === playerName
        return (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{
              width: '56px', height: '56px', overflow: 'hidden',
              border: `2px solid ${name ? (isMe ? color : 'rgba(255,255,255,0.3)') : 'rgba(255,255,255,0.08)'}`,
              background: 'rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: name && isMe ? `0 0 16px ${color}44` : 'none',
            }}>
              {portrait
                ? <img src={portrait} alt={slug!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', color: 'rgba(255,255,255,0.15)' }}>?</span>
              }
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.52rem', letterSpacing: '2px', marginTop: '6px', color: name ? (isMe ? color : 'rgba(255,255,255,0.5)') : 'rgba(255,255,255,0.15)' }}>
              {name ? (isMe ? youLabel : name.toUpperCase().slice(0, 10)) : '---'}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Scoreboard({ scores, playerName, avatars, color, youLabel }: { scores: { [k: string]: number }; playerName: string; avatars: Record<string, string>; color: string; youLabel: string }) {
  const entries = Object.entries(scores)
  if (!entries.length) return null
  return (
    <div style={{ display: 'flex', gap: '12px' }}>
      {entries.map(([name, score]) => {
        const isMe    = name === playerName
        const slug    = avatars[name] || 'ryu'
        const portrait = getFighterPortrait(slug)
        return (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '24px', height: '24px', overflow: 'hidden', border: `1px solid ${isMe ? color : 'rgba(255,255,255,0.2)'}`, flexShrink: 0 }}>
              {portrait
                ? <img src={portrait} alt={slug} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>{name[0]}</span>
              }
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.3rem', letterSpacing: '2px', color: isMe ? color : 'rgba(255,255,255,0.4)', textShadow: isMe ? `0 0 10px ${color}` : 'none' }}>{score}</div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.45rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.25)' }}>{isMe ? youLabel : name.toUpperCase().slice(0, 6)}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

'use client'
import { useEffect, useRef, useState, use } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

const WS_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/^http/, 'ws')

type Phase = 'connecting' | 'waiting' | 'playing' | 'result' | 'gameover' | 'error'

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
  const [error, setError]                       = useState('')
  const [gameMode, setGameMode]                 = useState('startup')

  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/api/multi/ws/${room}/${encodeURIComponent(playerName)}`)
    wsRef.current = ws

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)

      if (msg.type === 'room_joined' || msg.type === 'player_joined') {
        setPlayers(msg.players)
      }
      if (msg.type === 'waiting')  setPhase('waiting')
      if (msg.type === 'question') {
        setQuestion(msg.question)
        setGameMode(msg.game_mode || msg.question.game_mode || 'startup')
        setQuestionNumber(msg.question_number)
        setTotalQuestions(msg.total)
        setSelected(null); setCorrectAnswer(null)
        setOnBlockValue(null); setPlayerAnswers({})
        setOpponentAnswered(false); setPhase('playing')
      }
      if (msg.type === 'opponent_answered') setOpponentAnswered(true)
      if (msg.type === 'answer_result') {
        setCorrectAnswer(msg.correct_answer)
        setPlayerAnswers(msg.player_answers)
        setScores(msg.scores)
        setOnBlockValue(msg.on_block_value ?? null)
        setGameMode(msg.game_mode || gameMode)
        setPhase('result')
      }
      if (msg.type === 'game_over') {
        setScores(msg.scores)
        setWinner(msg.winner)
        setPhase('gameover')
      }
      if (msg.type === 'player_left') {
        setPlayers(msg.players)
        setError('Ton adversaire a quitté la partie.')
        setPhase('error')
      }
      if (msg.type === 'error') { setError(msg.message); setPhase('error') }
    }

    ws.onerror  = () => { setError('Connexion WebSocket échouée.'); setPhase('error') }
    ws.onopen   = () => setPhase('waiting')
    return () => ws.close()
  }, [room, playerName])

  function sendAnswer(value: string) {
    if (selected || !wsRef.current) return
    setSelected(value)
    wsRef.current.send(JSON.stringify({ type: 'answer', value }))
  }

  const opponent = players.find(p => p !== playerName)
  const isPunish = gameMode === 'punish'

  // ── Styles QCM ──────────────────────────────────────────────────────────────
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

  // ── Styles Punish ────────────────────────────────────────────────────────────
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

  // ── Feedback texte ────────────────────────────────────────────────────────────
  const feedbackText = () => {
    if (!correctAnswer || !selected) return ''
    const correct = selected === correctAnswer
    if (isPunish) {
      const label = correctAnswer === 'punissable' ? 'PUNISSABLE' : 'SAFE'
      const ob = onBlockValue ? ` (on block : ${onBlockValue})` : ''
      return correct ? `✓ Correct ! ${question?.move_name} est ${label}${ob}` : `✗ Raté ! ${question?.move_name} est ${label}${ob}`
    }
    return correct ? `✓ Correct ! Startup : ${correctAnswer} frames.` : `✗ Raté ! Réponse : ${correctAnswer} frames.`
  }

  // ── Rendu par phase ─────────────────────────────────────────────────────────

  const backBtnStyle: React.CSSProperties = {
    background: 'none', border: `1px solid ${COLOR}`, color: COLOR,
    fontFamily: "'Bebas Neue', sans-serif", fontSize: '1rem', letterSpacing: '4px',
    padding: '10px 28px', cursor: 'pointer', textShadow: `0 0 8px ${COLOR}55`,
  }

  const renderContent = () => {

    if (phase === 'connecting') return <CenteredMsg color={COLOR}>CONNEXION...</CenteredMsg>

    if (phase === 'error') return (
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", color: COLOR_LOS, letterSpacing: '3px', fontSize: '0.8rem' }}>{error}</div>
        <button onClick={() => router.push('/multi')} style={backBtnStyle}>← LOBBY</button>
      </div>
    )

    if (phase === 'waiting') return (
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', letterSpacing: '6px', color: '#fff' }}>
          ROOM — <span style={{ color: COLOR, textShadow: `0 0 12px ${COLOR}` }}>{room}</span>
        </div>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.3)' }}>DONNE CE CODE À TON ADVERSAIRE</div>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>EN ATTENTE D&apos;UN ADVERSAIRE...</div>
        <Players players={players} playerName={playerName} color={COLOR} />
      </div>
    )

    if ((phase === 'playing' || phase === 'result') && question) return (
      <div style={{ width: '100%', maxWidth: '500px' }}>

        {/* Header */}
        <div style={{ padding: '10px 18px', background: 'rgba(255,224,0,0.06)', borderBottom: `1px solid ${COLOR}28`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', letterSpacing: '4px', color: COLOR, textShadow: `0 0 8px ${COLOR}55` }}>
              Q{questionNumber}/{totalQuestions}
            </span>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '3px', color: isPunish ? '#ff2d78' : '#ff2d78', marginLeft: '12px', opacity: 0.6 }}>
              {isPunish ? 'PUNISH' : 'STARTUP'}
            </span>
          </div>
          <Scoreboard scores={scores} playerName={playerName} color={COLOR} />
        </div>

        {/* GIF */}
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

        {/* Question */}
        <div style={{ padding: '14px 18px 10px' }}>
          <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', margin: 0 }}>
            {isPunish
              ? <><strong style={{ color: '#fff' }}>{question.move_name}</strong> est-il <span style={{ color: COLOR_LOS }}>punissable on block ?</span></>
              : <>Quel est le <span style={{ color: COLOR }}>startup</span> de <strong style={{ color: '#fff' }}>{question.move_name}</strong> ?</>
            }
          </p>
        </div>

        {/* Réponses */}
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
                💀 PUNISSABLE
                <div style={{ fontSize: '0.55rem', letterSpacing: '2px', marginTop: '4px', opacity: 0.6 }}>{'≤ -4 ON BLOCK'}</div>
              </button>
              <button onClick={() => sendAnswer('safe')} disabled={!!selected} style={punishBtnStyle('safe')}>
                ✓ SAFE
                <div style={{ fontSize: '0.55rem', letterSpacing: '2px', marginTop: '4px', opacity: 0.6 }}>{'-3 À +∞ ON BLOCK'}</div>
              </button>
            </div>
          )}
        </div>

        {/* Statut + feedback */}
        <div style={{ padding: '12px 18px 18px' }}>
          {phase === 'playing' && (
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '2px', color: opponentAnswered ? COLOR : 'rgba(255,255,255,0.2)', textAlign: 'center', transition: 'color 0.3s' }}>
              {selected
                ? opponentAnswered ? 'LES DEUX ONT RÉPONDU — RÉSULTAT...' : `EN ATTENTE DE ${(opponent || 'ADVERSAIRE').toUpperCase()}...`
                : opponentAnswered ? `${(opponent || 'ADVERSAIRE').toUpperCase()} A RÉPONDU !` : `EN ATTENTE DE ${(opponent || 'ADVERSAIRE').toUpperCase()}...`
              }
            </div>
          )}
          {phase === 'result' && correctAnswer && (
            <div style={{ padding: '9px 14px', background: selected === correctAnswer ? 'rgba(74,222,128,0.1)' : 'rgba(255,45,120,0.1)', border: `1px solid ${selected === correctAnswer ? '#4ade80' : '#ff2d78'}`, fontFamily: "'Rajdhani', sans-serif", fontSize: '0.9rem', fontWeight: 700, color: selected === correctAnswer ? '#4ade80' : '#ff2d78' }}>
              {feedbackText()}
            </div>
          )}
        </div>
      </div>
    )

    if (phase === 'gameover') {
      const myScore  = scores[playerName] ?? 0
      const oppEntry = Object.entries(scores).find(([n]) => n !== playerName)
      const oppName  = oppEntry?.[0] ?? 'Adversaire'
      const oppScore = oppEntry?.[1] ?? 0
      const isWin    = winner === playerName
      const isDraw   = winner === 'draw'
      const accuracy = Math.round((myScore / totalQuestions) * 100)

      return (
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '28px', alignItems: 'center' }}>

          {/* Titre résultat */}
          <div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 'clamp(3rem, 10vw, 5rem)',
              letterSpacing: '10px', lineHeight: 1,
              color: isDraw ? COLOR : isWin ? COLOR_WIN : COLOR_LOS,
              textShadow: `0 0 20px ${isDraw ? COLOR : isWin ? COLOR_WIN : COLOR_LOS}, 0 0 50px ${isDraw ? COLOR : isWin ? COLOR_WIN : COLOR_LOS}55`,
            }}>
              {isDraw ? 'ÉGALITÉ' : isWin ? 'VICTOIRE' : 'DÉFAITE'}
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '4px', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>
              {isDraw ? 'MATCH NUL !' : isWin ? 'BIEN JOUÉ !' : 'MEILLEURE CHANCE LA PROCHAINE FOIS'}
            </div>
          </div>

          {/* Scores */}
          <div style={{ display: 'flex', gap: '0', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            {/* Moi */}
            <div style={{ padding: '24px 36px', background: isWin ? 'rgba(74,222,128,0.06)' : isDraw ? 'rgba(255,224,0,0.06)' : 'rgba(255,255,255,0.03)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '3.5rem', letterSpacing: '2px', color: isWin ? COLOR_WIN : isDraw ? COLOR : 'rgba(255,255,255,0.5)', textShadow: isWin ? `0 0 20px ${COLOR_WIN}` : isDraw ? `0 0 20px ${COLOR}` : 'none' }}>{myScore}</div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>TOI</div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.5rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.2)', marginTop: '4px' }}>{accuracy}% PRÉCISION</div>
            </div>
            {/* Adversaire */}
            <div style={{ padding: '24px 36px', background: !isWin && !isDraw ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.03)' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '3.5rem', letterSpacing: '2px', color: !isWin && !isDraw ? COLOR_WIN : 'rgba(255,255,255,0.5)', textShadow: !isWin && !isDraw ? `0 0 20px ${COLOR_WIN}` : 'none' }}>{oppScore}</div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>{oppName.toUpperCase().slice(0, 8)}</div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.5rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.2)', marginTop: '4px' }}>{Math.round((oppScore / totalQuestions) * 100)}% PRÉCISION</div>
            </div>
          </div>

          {/* Détail des questions */}
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.2)' }}>
            {totalQuestions} QUESTIONS — MODE {gameMode.toUpperCase()}
          </div>

          {/* Boutons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => router.push('/multi')} style={backBtnStyle}>REJOUER</button>
            <button onClick={() => router.push('/')} style={{ ...backBtnStyle, border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.4)', textShadow: 'none' }}>ACCUEIL</button>
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

function Players({ players, playerName, color }: { players: string[]; playerName: string; color: string }) {
  return (
    <div style={{ display: 'flex', gap: '24px', marginTop: '8px' }}>
      {[0, 1].map(i => (
        <div key={i} style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: `1px solid ${players[i] ? color : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.3rem', color: players[i] ? color : 'rgba(255,255,255,0.1)', boxShadow: players[i] ? `0 0 12px ${color}44` : 'none' }}>
            {players[i] ? players[i][0].toUpperCase() : '?'}
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '2px', marginTop: '6px', color: players[i] ? (players[i] === playerName ? color : 'rgba(255,255,255,0.5)') : 'rgba(255,255,255,0.15)' }}>
            {players[i] ? (players[i] === playerName ? 'TOI' : players[i].toUpperCase()) : '---'}
          </div>
        </div>
      ))}
    </div>
  )
}

function Scoreboard({ scores, playerName, color }: { scores: { [k: string]: number }; playerName: string; color: string }) {
  const entries = Object.entries(scores)
  if (!entries.length) return null
  return (
    <div style={{ display: 'flex', gap: '16px' }}>
      {entries.map(([name, score]) => (
        <div key={name} style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', letterSpacing: '2px', color: name === playerName ? color : 'rgba(255,255,255,0.4)', textShadow: name === playerName ? `0 0 10px ${color}` : 'none' }}>{score}</div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.5rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.25)' }}>{name === playerName ? 'TOI' : name.toUpperCase().slice(0, 6)}</div>
        </div>
      ))}
    </div>
  )
}

'use client'
import { useEffect, useRef, useState, use } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

const WS_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
  .replace(/^http/, 'ws')

type Phase = 'connecting' | 'waiting' | 'playing' | 'result' | 'gameover' | 'error'

interface Question {
  move_name: string
  section: string
  gif_url?: string
  question: string
  choices: string[]
  fighter_slug: string
}

interface Scores { [name: string]: number }

export default function MultiRoom({ params }: { params: Promise<{ room: string }> }) {
  const { room } = use(params)
  const searchParams = useSearchParams()
  const router = useRouter()
  const playerName = searchParams.get('name') || 'Joueur'

  const wsRef = useRef<WebSocket | null>(null)

  const [phase, setPhase]                     = useState<Phase>('connecting')
  const [players, setPlayers]                 = useState<string[]>([])
  const [question, setQuestion]               = useState<Question | null>(null)
  const [questionNumber, setQuestionNumber]   = useState(0)
  const [totalQuestions, setTotalQuestions]   = useState(5)
  const [selected, setSelected]               = useState<string | null>(null)
  const [correctAnswer, setCorrectAnswer]     = useState<string | null>(null)
  const [playerAnswers, setPlayerAnswers]     = useState<Record<string, string>>({})
  const [scores, setScores]                   = useState<Scores>({})
  const [winner, setWinner]                   = useState<string | null>(null)
  const [opponentAnswered, setOpponentAnswered] = useState(false)
  const [error, setError]                     = useState('')

  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/api/multi/ws/${room}/${encodeURIComponent(playerName)}`)
    wsRef.current = ws

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)

      if (msg.type === 'room_joined' || msg.type === 'player_joined') {
        setPlayers(msg.players)
      }
      if (msg.type === 'waiting') {
        setPhase('waiting')
      }
      if (msg.type === 'question') {
        setQuestion(msg.question)
        setQuestionNumber(msg.question_number)
        setTotalQuestions(msg.total)
        setSelected(null)
        setCorrectAnswer(null)
        setPlayerAnswers({})
        setOpponentAnswered(false)
        setPhase('playing')
      }
      if (msg.type === 'opponent_answered') {
        setOpponentAnswered(true)
      }
      if (msg.type === 'answer_result') {
        setCorrectAnswer(msg.correct_answer)
        setPlayerAnswers(msg.player_answers)
        setScores(msg.scores)
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
      if (msg.type === 'error') {
        setError(msg.message)
        setPhase('error')
      }
    }

    ws.onerror = () => {
      setError('Connexion WebSocket échouée.')
      setPhase('error')
    }

    ws.onopen = () => setPhase('waiting')

    return () => ws.close()
  }, [room, playerName])

  function sendAnswer(value: string) {
    if (selected || !wsRef.current) return
    setSelected(value)
    wsRef.current.send(JSON.stringify({ type: 'answer', value }))
  }

  const COLOR = '#ffe000'
  const COLOR_ALT = '#ff6a00'

  const opponent = players.find(p => p !== playerName)

  // ── Styles ──────────────────────────────────────────────────────────────────

  const choiceStyle = (choice: string): React.CSSProperties => {
    const base: React.CSSProperties = {
      padding: '11px 14px', width: '100%', textAlign: 'left',
      display: 'flex', alignItems: 'center', gap: '10px',
      border: '1px solid rgba(255,255,255,0.09)',
      background: 'rgba(255,255,255,0.04)',
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: '0.88rem', color: 'rgba(255,255,255,0.75)',
      cursor: selected ? 'default' : 'pointer',
      transition: 'all 0.15s',
    }
    if (!correctAnswer) return base
    if (choice === correctAnswer) return { ...base, background: 'rgba(74,222,128,0.12)', border: '1px solid #4ade80', color: '#4ade80' }
    if (choice === selected) return { ...base, background: 'rgba(255,45,120,0.12)', border: '1px solid #ff2d78', color: '#ff2d78' }
    return { ...base, opacity: 0.3 }
  }

  // ── Rendu par phase ─────────────────────────────────────────────────────────

  const renderContent = () => {
    if (phase === 'connecting') return (
      <CenteredMsg color={COLOR}>CONNEXION...</CenteredMsg>
    )

    if (phase === 'error') return (
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", color: '#ff2d78', letterSpacing: '3px', fontSize: '0.8rem' }}>
          {error || 'Une erreur est survenue.'}
        </div>
        <button onClick={() => router.push('/multi')} style={backBtnStyle}>← LOBBY</button>
      </div>
    )

    if (phase === 'waiting') return (
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem',
          letterSpacing: '6px', color: '#fff',
        }}>ROOM — <span style={{ color: COLOR, textShadow: `0 0 12px ${COLOR}` }}>{room}</span></div>
        <div style={{
          fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem',
          letterSpacing: '3px', color: 'rgba(255,255,255,0.3)',
        }}>DONNE CE CODE À TON ADVERSAIRE</div>
        <div style={{
          fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem',
          letterSpacing: '2px', color: 'rgba(255,255,255,0.4)',
          marginTop: '12px',
        }}>EN ATTENTE D&apos;UN ADVERSAIRE...</div>
        <Players players={players} playerName={playerName} color={COLOR} />
      </div>
    )

    if ((phase === 'playing' || phase === 'result') && question) return (
      <div style={{ width: '100%', maxWidth: '500px' }}>

        {/* Header */}
        <div style={{
          padding: '10px 18px',
          background: 'rgba(255,224,0,0.06)',
          borderBottom: `1px solid ${COLOR}28`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', letterSpacing: '4px',
            color: COLOR, textShadow: `0 0 8px ${COLOR}55`,
          }}>QUESTION {questionNumber}/{totalQuestions}</span>
          <Scoreboard scores={scores} playerName={playerName} color={COLOR} />
        </div>

        {/* GIF */}
        <div style={{
          height: '180px', background: 'rgba(255,255,255,0.03)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', position: 'relative',
        }}>
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
        <div style={{ padding: '16px 18px 12px' }}>
          <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
            Quel est le <span style={{ color: COLOR }}>startup</span> de <strong style={{ color: '#fff' }}>{question.move_name}</strong> ?
          </p>
        </div>

        {/* Choix */}
        <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {question.choices.map((choice, i) => (
            <button key={choice} onClick={() => sendAnswer(choice)} style={choiceStyle(choice)}>
              <span style={{
                width: '20px', height: '20px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.18)', fontSize: '0.62rem',
              }}>{String.fromCharCode(65 + i)}</span>
              {choice} frames
            </button>
          ))}
        </div>

        {/* Statut adversaire + feedback */}
        <div style={{ padding: '12px 18px 18px' }}>
          {phase === 'playing' && (
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '0.6rem', letterSpacing: '2px',
              color: opponentAnswered ? '#ffe000' : 'rgba(255,255,255,0.2)',
              textAlign: 'center', transition: 'color 0.3s',
            }}>
              {opponentAnswered ? `${opponent || 'Adversaire'} A RÉPONDU` : `EN ATTENTE DE ${(opponent || 'ADVERSAIRE').toUpperCase()}...`}
            </div>
          )}
          {phase === 'result' && (
            <div style={{
              padding: '9px 14px',
              background: selected === correctAnswer ? 'rgba(74,222,128,0.1)' : 'rgba(255,45,120,0.1)',
              border: `1px solid ${selected === correctAnswer ? '#4ade80' : '#ff2d78'}`,
              fontFamily: "'Rajdhani', sans-serif", fontSize: '0.9rem', fontWeight: 700,
              color: selected === correctAnswer ? '#4ade80' : '#ff2d78',
            }}>
              {selected === correctAnswer
                ? `✓ Correct ! Startup : ${correctAnswer} frames.`
                : `✗ Raté ! Réponse : ${correctAnswer} frames.`}
            </div>
          )}
        </div>
      </div>
    )

    if (phase === 'gameover') return (
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.5rem',
          letterSpacing: '8px', color: '#fff',
          textShadow: `0 0 16px ${COLOR}, 0 0 40px ${COLOR}55`,
        }}>GAME OVER</div>

        {winner === 'draw'
          ? <div style={{ fontFamily: "'Share Tech Mono', monospace", letterSpacing: '4px', color: '#ffe000', fontSize: '0.85rem' }}>ÉGALITÉ !</div>
          : winner === playerName
          ? <div style={{ fontFamily: "'Share Tech Mono', monospace", letterSpacing: '4px', color: '#4ade80', fontSize: '0.85rem' }}>TU AS GAGNÉ !</div>
          : <div style={{ fontFamily: "'Share Tech Mono', monospace", letterSpacing: '4px', color: '#ff2d78', fontSize: '0.85rem' }}>TU AS PERDU</div>
        }

        <div style={{ display: 'flex', gap: '32px' }}>
          {Object.entries(scores).map(([name, score]) => (
            <div key={name} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif", fontSize: '3rem', letterSpacing: '2px',
                color: name === winner ? COLOR : 'rgba(255,255,255,0.4)',
                textShadow: name === winner ? `0 0 20px ${COLOR}` : 'none',
              }}>{score}</div>
              <div style={{
                fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem',
                letterSpacing: '3px', color: 'rgba(255,255,255,0.3)',
              }}>{name === playerName ? 'TOI' : name.toUpperCase()}</div>
            </div>
          ))}
        </div>

        <button onClick={() => router.push('/multi')} style={backBtnStyle}>REJOUER</button>
      </div>
    )

    return null
  }

  const backBtnStyle: React.CSSProperties = {
    background: 'none', border: `1px solid ${COLOR}`,
    color: COLOR, fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '1rem', letterSpacing: '4px',
    padding: '10px 28px', cursor: 'pointer',
    textShadow: `0 0 8px ${COLOR}55`,
  }

  return (
    <>
      <Navbar />
      <main style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: 'calc(100vh - 60px)',
        padding: '24px 20px',
      }}>
        {renderContent()}
      </main>
    </>
  )
}

function CenteredMsg({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div style={{
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: '0.75rem', letterSpacing: '4px',
      color, textShadow: `0 0 10px ${color}55`,
    }}>{children}</div>
  )
}

function Players({ players, playerName, color }: { players: string[]; playerName: string; color: string }) {
  return (
    <div style={{ display: 'flex', gap: '24px', marginTop: '8px' }}>
      {[0, 1].map(i => (
        <div key={i} style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px', height: '48px',
            border: `1px solid ${players[i] ? color : 'rgba(255,255,255,0.1)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.3rem',
            color: players[i] ? color : 'rgba(255,255,255,0.1)',
            boxShadow: players[i] ? `0 0 12px ${color}44` : 'none',
          }}>
            {players[i] ? players[i][0].toUpperCase() : '?'}
          </div>
          <div style={{
            fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem',
            letterSpacing: '2px', marginTop: '6px',
            color: players[i] ? (players[i] === playerName ? color : 'rgba(255,255,255,0.5)') : 'rgba(255,255,255,0.15)',
          }}>
            {players[i] ? (players[i] === playerName ? 'TOI' : players[i].toUpperCase()) : '---'}
          </div>
        </div>
      ))}
    </div>
  )
}

function Scoreboard({ scores, playerName, color }: { scores: Scores; playerName: string; color: string }) {
  const entries = Object.entries(scores)
  if (!entries.length) return null
  return (
    <div style={{ display: 'flex', gap: '16px' }}>
      {entries.map(([name, score]) => (
        <div key={name} style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', letterSpacing: '2px',
            color: name === playerName ? color : 'rgba(255,255,255,0.4)',
            textShadow: name === playerName ? `0 0 10px ${color}` : 'none',
          }}>{score}</div>
          <div style={{
            fontFamily: "'Share Tech Mono', monospace", fontSize: '0.5rem',
            letterSpacing: '2px', color: 'rgba(255,255,255,0.25)',
          }}>{name === playerName ? 'TOI' : name.toUpperCase().slice(0, 6)}</div>
        </div>
      ))}
    </div>
  )
}

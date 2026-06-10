'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { track } from '@vercel/analytics'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const MODES = [
  { id: 'startup', label: 'STARTUP', sub: 'QCM 4 choix', color: '#ff2d78', desc: 'Devine le startup de chaque move en 4 choix.' },
  { id: 'punish',  label: 'PUNISH',  sub: 'Punissable ou safe ?', color: '#ffe000', desc: 'Le move est-il punissable on block ?' },
]

export default function MultiLobby() {
  const router = useRouter()
  const [name, setName]           = useState('')
  const [code, setCode]           = useState('')
  const [step, setStep]           = useState<'idle' | 'create' | 'join'>('idle')
  const [gameMode, setGameMode]   = useState('startup')
  const [loading, setLoading]     = useState(false)
  const [slowLoad, setSlowLoad]   = useState(false)
  const [error, setError]         = useState('')

  async function handleCreate() {
    if (!name.trim()) return setError('Entre ton pseudo.')
    setLoading(true); setSlowLoad(false); setError('')
    const timer = setTimeout(() => setSlowLoad(true), 4000)
    try {
      const res = await fetch(`${API_URL}/api/multi/rooms?game_mode=${gameMode}`, { method: 'POST' })
      const data = await res.json()
      clearTimeout(timer)
      track('multi_game_created', { mode: gameMode })
      router.push(`/multi/${data.room_code}?name=${encodeURIComponent(name.trim())}&mode=${gameMode}`)
    } catch {
      clearTimeout(timer)
      setError('Erreur réseau.')
      setLoading(false); setSlowLoad(false)
    }
  }

  function handleJoin() {
    if (!name.trim()) return setError('Entre ton pseudo.')
    if (!code.trim()) return setError('Entre un code de room.')
    track('multi_game_joined')
    router.push(`/multi/${code.trim().toUpperCase()}?name=${encodeURIComponent(name.trim())}`)
  }

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
    color: '#fff', fontFamily: "'Share Tech Mono', monospace",
    fontSize: '0.85rem', letterSpacing: '2px', padding: '12px 16px',
    outline: 'none', width: '100%', textTransform: 'uppercase' as const,
  }

  const btnStyle = (color: string, active = false): React.CSSProperties => ({
    background: active ? `${color}18` : 'none',
    border: `1px solid ${active ? color : 'rgba(255,255,255,0.15)'}`,
    color: active ? color : 'rgba(255,255,255,0.4)',
    fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.95rem', letterSpacing: '4px',
    padding: '10px 0', cursor: 'pointer', transition: 'all 0.2s',
    textShadow: active ? `0 0 8px ${color}55` : 'none',
    flex: 1,
  })

  const activeMode = MODES.find(m => m.id === gameMode)!

  return (
    <>
      <Navbar />
      <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)' }}>
        <div style={{ width: '100%', maxWidth: '420px', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Titre */}
          <div style={{ textAlign: 'center', marginBottom: '4px' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.5rem', letterSpacing: '8px', color: '#fff', textShadow: '0 0 12px #ffe000, 0 0 30px #ffe00055' }}>MULTIJOUEUR</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '4px', color: 'rgba(255,255,255,0.25)', marginTop: '6px' }}>QUIZ EN TEMPS RÉEL — 5 QUESTIONS</div>
          </div>

          {/* Pseudo */}
          <input style={inputStyle} placeholder="TON PSEUDO" value={name} onChange={e => setName(e.target.value)} maxLength={16} />

          {/* Code room (mode join) */}
          {step === 'join' && (
            <input style={inputStyle} placeholder="CODE DE ROOM" value={code}
              onChange={e => setCode(e.target.value.toUpperCase())} maxLength={4} autoFocus />
          )}

          {/* Sélecteur de mode (mode create) */}
          {step === 'create' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.25)' }}>MODE DE JEU</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {MODES.map(m => (
                  <button key={m.id} onClick={() => setGameMode(m.id)} style={btnStyle(m.color, gameMode === m.id)}>
                    <div>{m.label}</div>
                    <div style={{ fontSize: '0.5rem', letterSpacing: '2px', marginTop: '3px', opacity: 0.7 }}>{m.sub}</div>
                  </button>
                ))}
              </div>
              <div style={{ fontFamily: "'Rajdhani', monospace", fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.5px' }}>
                {activeMode.desc}
              </div>
            </div>
          )}

          {/* Erreur */}
          {error && <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', letterSpacing: '2px', color: '#ff2d78', textAlign: 'center' }}>{error}</div>}

          {/* Boutons principaux */}
          {step === 'idle' && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{ ...btnStyle('#ffe000'), flex: 1, fontSize: '1.1rem' }} onClick={() => { setStep('create'); setError('') }}>CRÉER</button>
              <button style={{ ...btnStyle('#00f0ff'), flex: 1, fontSize: '1.1rem' }} onClick={() => { setStep('join'); setError('') }}>REJOINDRE</button>
            </div>
          )}

          {step === 'create' && (
            <button
              style={{ background: 'none', border: '1px solid #ffe000', color: '#ffe000', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', letterSpacing: '4px', padding: '12px', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.5 : 1, transition: 'all 0.2s' }}
              onClick={handleCreate} disabled={loading}
            >
              {loading ? (slowLoad ? 'RÉVEIL DU SERVEUR...' : 'CRÉATION...') : 'CRÉER LA ROOM'}
            </button>
          )}

          {step === 'join' && (
            <button style={{ background: 'none', border: '1px solid #00f0ff', color: '#00f0ff', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', letterSpacing: '4px', padding: '12px', cursor: 'pointer' }} onClick={handleJoin}>
              REJOINDRE
            </button>
          )}

          {step !== 'idle' && (
            <button onClick={() => { setStep('idle'); setError(''); setCode('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
              ← RETOUR
            </button>
          )}

        </div>
      </main>
    </>
  )
}

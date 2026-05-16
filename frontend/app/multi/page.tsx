'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function MultiLobby() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [mode, setMode] = useState<'idle' | 'create' | 'join'>('idle')
  const [loading, setLoading] = useState(false)
  const [slowLoad, setSlowLoad] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!name.trim()) return setError('Entre ton pseudo.')
    setLoading(true)
    setSlowLoad(false)
    setError('')
    const timer = setTimeout(() => setSlowLoad(true), 4000)
    try {
      const res = await fetch(`${API_URL}/api/multi/rooms`, { method: 'POST' })
      const data = await res.json()
      clearTimeout(timer)
      router.push(`/multi/${data.room_code}?name=${encodeURIComponent(name.trim())}`)
    } catch {
      clearTimeout(timer)
      setError('Erreur réseau.')
      setLoading(false)
      setSlowLoad(false)
    }
  }

  function handleJoin() {
    if (!name.trim()) return setError('Entre ton pseudo.')
    if (!code.trim()) return setError('Entre un code de room.')
    router.push(`/multi/${code.trim().toUpperCase()}?name=${encodeURIComponent(name.trim())}`)
  }

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#fff',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '0.85rem',
    letterSpacing: '2px',
    padding: '12px 16px',
    outline: 'none',
    width: '100%',
    textTransform: 'uppercase' as const,
  }

  const btnStyle = (color: string): React.CSSProperties => ({
    background: 'none',
    border: `1px solid ${color}`,
    color: color,
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '1.1rem',
    letterSpacing: '4px',
    padding: '12px 32px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textShadow: `0 0 8px ${color}55`,
  })

  return (
    <>
      <Navbar />
      <main style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: 'calc(100vh - 60px)',
      }}>
        <div style={{ width: '100%', maxWidth: '400px', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '2.5rem', letterSpacing: '8px',
              color: '#fff',
              textShadow: '0 0 12px #ffe000, 0 0 30px #ffe00055',
            }}>MULTIJOUEUR</div>
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '0.6rem', letterSpacing: '4px',
              color: 'rgba(255,255,255,0.25)', marginTop: '6px',
            }}>QUIZ EN TEMPS RÉEL — 5 QUESTIONS</div>
          </div>

          <input
            style={inputStyle}
            placeholder="TON PSEUDO"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={16}
          />

          {mode === 'join' && (
            <input
              style={inputStyle}
              placeholder="CODE DE ROOM"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              maxLength={4}
              autoFocus
            />
          )}

          {error && (
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '0.65rem', letterSpacing: '2px',
              color: '#ff2d78', textAlign: 'center',
            }}>{error}</div>
          )}

          {mode === 'idle' && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{ ...btnStyle('#ffe000'), flex: 1 }} onClick={() => { setMode('create'); setError('') }}>
                CRÉER
              </button>
              <button style={{ ...btnStyle('#00f0ff'), flex: 1 }} onClick={() => { setMode('join'); setError('') }}>
                REJOINDRE
              </button>
            </div>
          )}

          {mode === 'create' && (
            <button
              style={{ ...btnStyle('#ffe000'), width: '100%', opacity: loading ? 0.5 : 1 }}
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? (slowLoad ? 'RÉVEIL DU SERVEUR...' : 'CRÉATION...') : 'CRÉER LA ROOM'}
            </button>
          )}

          {mode === 'join' && (
            <button style={{ ...btnStyle('#00f0ff'), width: '100%' }} onClick={handleJoin}>
              REJOINDRE
            </button>
          )}

          {mode !== 'idle' && (
            <button
              onClick={() => { setMode('idle'); setError(''); setCode('') }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.6rem', letterSpacing: '3px',
                color: 'rgba(255,255,255,0.25)', textAlign: 'center',
              }}
            >← RETOUR</button>
          )}

        </div>
      </main>
    </>
  )
}

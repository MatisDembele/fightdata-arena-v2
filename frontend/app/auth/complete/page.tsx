'use client'
export const dynamic = 'force-static'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'

export default function AuthCompletePage() {
  const { login } = useAuth()
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token      = params.get('token')
    const id         = params.get('id')
    const username   = params.get('username')
    const discord_id = params.get('discord_id')
    const avatar     = params.get('avatar') || null

    if (!token || !id || !username || !discord_id) {
      window.location.href = '/?auth=error'
      return
    }

    login(token, {
      id: parseInt(id),
      username,
      discord_id,
      avatar: avatar || null,
    }).then(() => {
      window.location.href = '/profile'
    }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : String(err))
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) {
    return (
      <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '16px', padding: '24px' }}>
        <div style={{ fontSize: '1.5rem' }}>⚠</div>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", color: '#f43f5e', letterSpacing: '3px', fontSize: '0.65rem' }}>CONNEXION ÉCHOUÉE</div>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.4)', fontSize: '0.6rem', maxWidth: '420px', textAlign: 'center', wordBreak: 'break-all' }}>{error}</div>
        <button onClick={() => { window.location.href = '/' }} style={{ marginTop: '8px', padding: '8px 20px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '2px' }}>
          ← RETOUR
        </button>
      </main>
    )
  }

  return (
    <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '32px', height: '32px', border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid #5865F2', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.3)', letterSpacing: '4px', fontSize: '0.6rem' }}>CONNECTING...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </main>
  )
}

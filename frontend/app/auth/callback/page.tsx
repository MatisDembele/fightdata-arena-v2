'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useAuth } from '@/components/AuthProvider'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function CallbackInner() {
  const router = useRouter()
  const params = useSearchParams()
  const { login } = useAuth()
  const [status, setStatus] = useState<'connecting' | 'error'>('connecting')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const code        = params.get('code')
    const redirectUri = params.get('redirect_uri')

    if (!code || !redirectUri) {
      setErrorMsg('Paramètres manquants (code ou redirect_uri absent).')
      setStatus('error')
      return
    }

    async function doAuth() {
      try {
        const controller = new AbortController()
        const tid = setTimeout(() => controller.abort(), 30000)
        let res: Response
        try {
          const url = `${API_URL}/api/auth/discord/callback?code=${encodeURIComponent(code!)}&redirect_uri=${encodeURIComponent(redirectUri!)}`
          res = await fetch(url, { signal: controller.signal })
        } finally {
          clearTimeout(tid)
        }

        if (!res.ok) {
          const body = await res.text().catch(() => '')
          throw new Error(`Backend ${res.status}: ${body.slice(0, 120)}`)
        }

        const data = await res.json() as {
          token: string
          user: { id: number; username: string; discord_id: string; avatar: string | null }
        }

        await login(data.token, {
          id: data.user.id,
          username: data.user.username,
          discord_id: data.user.discord_id,
          avatar: data.user.avatar,
        })

        router.replace('/profile')
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setErrorMsg(msg)
        setStatus('error')
      }
    }

    doAuth()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (status === 'error') {
    return (
      <main style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', flexDirection: 'column', gap: '16px', padding: '24px',
      }}>
        <div style={{ fontSize: '1.5rem' }}>⚠</div>
        <div style={{
          fontFamily: "'Share Tech Mono', monospace", color: '#f43f5e',
          letterSpacing: '3px', fontSize: '0.65rem',
        }}>CONNEXION ÉCHOUÉE</div>
        <div style={{
          fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.7)',
          fontSize: '0.6rem', letterSpacing: '1px', maxWidth: '420px', textAlign: 'center',
          lineHeight: 1.6, wordBreak: 'break-all',
        }}>{errorMsg}</div>
        <button
          onClick={() => router.replace('/')}
          style={{
            marginTop: '8px', padding: '8px 20px',
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.65)', cursor: 'pointer',
            fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '2px',
          }}
        >← RETOUR</button>
      </main>
    )
  }

  return (
    <main style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', flexDirection: 'column', gap: '16px',
    }}>
      <div style={{
        width: '32px', height: '32px',
        border: '2px solid rgba(255,255,255,0.1)',
        borderTop: '2px solid #5865F2',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <div style={{
        fontFamily: "'Share Tech Mono', monospace",
        color: 'rgba(255,255,255,0.7)',
        letterSpacing: '4px',
        fontSize: '0.6rem',
      }}>
        CONNECTING...
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </main>
  )
}

export default function AuthCallbackPage() {
  return <Suspense><CallbackInner /></Suspense>
}

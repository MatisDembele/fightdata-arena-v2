'use client'
// Discord OAuth landing page — registered as redirect_uri in Discord Developer Portal.
// This is a STATIC client page (no Vercel serverless function), so there is zero
// Vercel timeout risk. The backend call happens entirely in the browser.
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useAuth } from '@/components/AuthProvider'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function ConnectInner() {
  const router = useRouter()
  const params = useSearchParams()
  const { login } = useAuth()
  const [status,   setStatus]   = useState<'connecting' | 'error'>('connecting')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const code  = params.get('code')
    const error = params.get('error')

    if (error || !code) {
      router.replace('/?auth=cancelled')
      return
    }

    const redirectUri = `${window.location.origin}/connect`

    async function doAuth() {
      try {
        const controller = new AbortController()
        const tid = setTimeout(() => controller.abort(), 30000)
        let res: Response
        try {
          res = await fetch(
            `${API_URL}/api/auth/discord/callback?code=${encodeURIComponent(code!)}&redirect_uri=${encodeURIComponent(redirectUri)}`,
            { signal: controller.signal },
          )
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
        <div style={{ fontFamily: "'Share Tech Mono', monospace", color: '#f43f5e', letterSpacing: '3px', fontSize: '0.65rem' }}>
          CONNEXION ÉCHOUÉE
        </div>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.4)', fontSize: '0.6rem', letterSpacing: '1px', maxWidth: '420px', textAlign: 'center', lineHeight: 1.6, wordBreak: 'break-all' }}>
          {errorMsg}
        </div>
        <button
          onClick={() => router.replace('/')}
          style={{ marginTop: '8px', padding: '8px 20px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '2px' }}
        >
          ← RETOUR
        </button>
      </main>
    )
  }

  return (
    <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '32px', height: '32px', border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid #5865F2', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.3)', letterSpacing: '4px', fontSize: '0.6rem' }}>
        CONNECTING...
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </main>
  )
}

export default function ConnectPage() {
  return <Suspense><ConnectInner /></Suspense>
}

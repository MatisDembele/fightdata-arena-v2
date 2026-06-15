'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useAuth } from '@/components/AuthProvider'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function CallbackInner() {
  const router = useRouter()
  const params = useSearchParams()
  const { login } = useAuth()

  useEffect(() => {
    const code        = params.get('code')
    const redirectUri = params.get('redirect_uri')

    if (!code || !redirectUri) {
      router.replace('/?auth=error')
      return
    }

    async function doAuth() {
      try {
        const url = `${API_URL}/api/auth/discord/callback?code=${encodeURIComponent(code!)}&redirect_uri=${encodeURIComponent(redirectUri!)}`
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) throw new Error('Backend auth failed')

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
      } catch {
        router.replace('/?auth=error')
      }
    }

    doAuth()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        color: 'rgba(255,255,255,0.3)',
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

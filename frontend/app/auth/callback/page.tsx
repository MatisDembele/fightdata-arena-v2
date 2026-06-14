'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useAuth } from '@/components/AuthProvider'

function CallbackInner() {
  const router = useRouter()
  const params = useSearchParams()
  const { login } = useAuth()

  useEffect(() => {
    const token    = params.get('token')
    const uid      = params.get('uid')
    const username = params.get('username')
    const did      = params.get('did')
    const avatar   = params.get('avatar')

    if (token && uid && username && did) {
      login(token, { id: Number(uid), username, discord_id: did, avatar: avatar ?? null }).then(() => {
        router.replace('/profile')
      })
    } else {
      router.replace('/?auth=error')
    }
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

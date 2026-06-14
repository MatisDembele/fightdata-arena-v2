'use client'
import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { track } from '@vercel/analytics'
import { useLanguage } from '@/lib/i18n'
import { getFighterPortrait } from '@/lib/portraits'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const FIGHTERS = [
  'ryu','luke','jamie','chunli','guile','kimberly',
  'juri','ken','blanka','dhalsim','ehonda','deejay',
  'manon','marisa','jp','zangief','lily','cammy',
  'rashid','aki','ed','akuma','mbison','terry',
  'mai','elena','sagat','cviper','alex','ingrid',
]

function MultiLobbyContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [name, setName]       = useState('')
  const [avatar, setAvatar]   = useState('ryu')
  const [code, setCode]       = useState('')
  const [joining, setJoining] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [slowLoad, setSlowLoad] = useState(false)
  const [error, setError]       = useState('')
  const { t } = useLanguage()

  useEffect(() => {
    const storedName   = localStorage.getItem('fda_pseudo') || ''
    const storedAvatar = localStorage.getItem('fda_avatar') || 'ryu'
    if (storedName)   setName(storedName)
    if (storedAvatar) setAvatar(storedAvatar)
    const roomParam = searchParams.get('room')
    if (roomParam) { setCode(roomParam.toUpperCase()); setJoining(true) }
  }, [searchParams])

  function persistPlayer(n: string, av: string) {
    localStorage.setItem('fda_pseudo', n)
    localStorage.setItem('fda_avatar', av)
  }

  async function handleCreate() {
    if (!name.trim()) return setError(t('multi.err_name'))
    persistPlayer(name.trim(), avatar)
    setLoading(true); setSlowLoad(false); setError('')
    const timer = setTimeout(() => setSlowLoad(true), 4000)
    try {
      const res = await fetch(`${API_URL}/api/multi/rooms`, { method: 'POST' })
      const data = await res.json()
      clearTimeout(timer)
      track('multi_game_created')
      router.push(`/multi/${data.room_code}?name=${encodeURIComponent(name.trim())}&avatar=${avatar}`)
    } catch {
      clearTimeout(timer)
      setError(t('multi.err_network'))
      setLoading(false); setSlowLoad(false)
    }
  }

  function handleJoin() {
    if (!name.trim()) return setError(t('multi.err_name'))
    if (!code.trim()) return setError(t('multi.err_code'))
    persistPlayer(name.trim(), avatar)
    track('multi_game_joined')
    router.push(`/multi/${code.trim().toUpperCase()}?name=${encodeURIComponent(name.trim())}&avatar=${avatar}`)
  }

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
    color: '#fff', fontFamily: "'Share Tech Mono', monospace",
    fontSize: '0.85rem', letterSpacing: '2px', padding: '12px 16px',
    outline: 'none', width: '100%', textTransform: 'uppercase' as const,
  }

  const btnPrimary = (color: string): React.CSSProperties => ({
    background: `${color}15`,
    border: `1px solid ${color}`,
    color: color,
    fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', letterSpacing: '4px',
    padding: '14px 0', cursor: loading ? 'default' : 'pointer', transition: 'all 0.2s',
    textShadow: `0 0 8px ${color}55`,
    flex: 1, opacity: loading ? 0.5 : 1,
  })

  const btnSecondary = (color: string): React.CSSProperties => ({
    background: 'none',
    border: `1px solid rgba(255,255,255,0.15)`,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', letterSpacing: '4px',
    padding: '14px 0', cursor: 'pointer', transition: 'all 0.2s',
    flex: 1,
  })

  return (
    <>
      <Navbar />
      <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)' }}>
        <div style={{ width: '100%', maxWidth: '480px', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

          <div style={{ textAlign: 'center', marginBottom: '4px' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.5rem', letterSpacing: '8px', color: '#fff', textShadow: '0 0 12px #ffe000, 0 0 30px #ffe00055' }}>{t('multi.title')}</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.52rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.2)', marginTop: '6px' }}>{t('multi.subtitle')}</div>
          </div>

          {/* Pseudo */}
          <input
            style={inputStyle}
            placeholder={t('multi.your_name')}
            value={name}
            onChange={e => setName(e.target.value.slice(0, 12))}
            maxLength={12}
          />

          {/* Avatar picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.25)' }}>{t('multi.choose_avatar')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '4px' }}>
              {FIGHTERS.map(slug => {
                const isSelected = avatar === slug
                const portrait   = getFighterPortrait(slug)
                return (
                  <button
                    key={slug}
                    onClick={() => setAvatar(slug)}
                    title={slug.toUpperCase()}
                    style={{
                      padding: 0, border: `2px solid ${isSelected ? '#ffe000' : 'rgba(255,255,255,0.08)'}`,
                      background: isSelected ? 'rgba(255,224,0,0.12)' : 'rgba(255,255,255,0.03)',
                      cursor: 'pointer', transition: 'all 0.15s', aspectRatio: '1',
                      boxShadow: isSelected ? '0 0 10px rgba(255,224,0,0.4)' : 'none',
                      overflow: 'hidden',
                    }}
                  >
                    {portrait
                      ? <img src={portrait} alt={slug} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      : <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.5rem', color: 'rgba(255,255,255,0.4)' }}>{slug[0].toUpperCase()}</span>
                    }
                  </button>
                )
              })}
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '3px', color: '#ffe000', textAlign: 'center', opacity: 0.7 }}>
              {avatar.toUpperCase()}
            </div>
          </div>

          {/* Join code input */}
          {joining && (
            <input style={inputStyle} placeholder={t('multi.room_code')} value={code}
              onChange={e => setCode(e.target.value.toUpperCase())} maxLength={4} autoFocus />
          )}

          {error && (
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', letterSpacing: '2px', color: '#ff2d78', textAlign: 'center' }}>{error}</div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {!joining ? (
              <>
                <button style={btnPrimary('#ffe000')} onClick={handleCreate} disabled={loading}>
                  {loading ? (slowLoad ? t('multi.waking_server') : t('multi.creating')) : t('multi.create')}
                </button>
                <button style={btnSecondary('#00f0ff')} onClick={() => { setJoining(true); setError('') }}>
                  {t('multi.join')}
                </button>
              </>
            ) : (
              <>
                <button style={btnPrimary('#00f0ff')} onClick={handleJoin}>
                  {t('multi.join')}
                </button>
                <button style={btnSecondary('#ffe000')} onClick={() => { setJoining(false); setError(''); setCode('') }}>
                  {t('multi.back')}
                </button>
              </>
            )}
          </div>

        </div>
      </main>
    </>
  )
}

export default function MultiLobby() {
  return (
    <Suspense fallback={null}>
      <MultiLobbyContent />
    </Suspense>
  )
}

'use client'
import { useState, useEffect, useCallback } from 'react'
import Icon, { type IconName } from '@/components/Icon'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const TOKEN_KEY = 'fda_admin_token'

interface Stats {
  users: { count: number; first: string | null; latest: string | null; recent: { username: string; created_at: string | null }[] }
  plays: { global: number; global_distinct_players: number; daily: number; weekly: number; survival: number; flash: number }
  feedback: { count: number; recent: { category: string; message: string; contact: string | null; lang: string | null; created_at: string | null }[] }
  data: { fighters: number; moves: number }
}

const CAT_ICON: Record<string, IconName> = { mode: 'gamepad', feature: 'sparkle', bug: 'bug', other: 'chat' }
const CAT_COLOR: Record<string, string> = { mode: '#00f0ff', feature: '#a3e635', bug: '#ff2d78', other: '#c084fc' }

async function load(token: string): Promise<Stats> {
  const res = await fetch(`${API_URL}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (res.status === 401) throw { kind: 'unauthorized' }
  if (res.status === 503) throw { kind: 'disabled' }
  if (!res.ok) throw { kind: 'error', status: res.status }
  return res.json()
}

function fmtDate(s: string | null): string {
  if (!s) return '—'
  const d = new Date(s)
  return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function Tile({ label, value, color = '#00f0ff' }: { label: string; value: number | string; color?: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '16px 18px', minWidth: 0 }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', letterSpacing: '1px', color, textShadow: `0 0 14px ${color}55`, lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-2)', color: 'rgba(255,255,255,0.35)', marginTop: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
    </div>
  )
}

export default function AdminDashboard() {
  const [data, setData]   = useState<Stats | null>(null)
  const [phase, setPhase] = useState<'locked' | 'loading' | 'ready'>('locked')
  const [pw, setPw]       = useState('')
  const [err, setErr]     = useState('')

  const attempt = useCallback(async (token: string) => {
    setPhase('loading'); setErr('')
    try {
      const d = await load(token)
      sessionStorage.setItem(TOKEN_KEY, token)
      setData(d); setPhase('ready')
    } catch (e) {
      sessionStorage.removeItem(TOKEN_KEY)
      setPhase('locked')
      const kind = (e as { kind?: string })?.kind
      setErr(
        kind === 'unauthorized' ? 'Mot de passe incorrect.' :
        kind === 'disabled'     ? 'Admin désactivé : définis ADMIN_TOKEN sur Render.' :
                                  "Impossible de joindre l'API."
      )
    }
  }, [])

  useEffect(() => {
    const t = sessionStorage.getItem(TOKEN_KEY)
    if (t) attempt(t)
  }, [attempt])

  const lock = () => { sessionStorage.removeItem(TOKEN_KEY); setData(null); setPw(''); setPhase('locked') }

  // ── Locked / loading gate ────────────────────────────────────────────────
  if (phase !== 'ready' || !data) {
    return (
      <main style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#070010' }}>
        <form
          onSubmit={e => { e.preventDefault(); if (pw.trim()) attempt(pw.trim()) }}
          style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', letterSpacing: '5px', color: '#fff', textShadow: '0 0 16px #00f0ff55' }}>ADMIN</div>
          <input
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            placeholder="MOT DE PASSE"
            autoFocus
            style={{ padding: '11px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', outline: 'none', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.8rem', letterSpacing: '2px' }}
          />
          <button
            type="submit"
            disabled={!pw.trim() || phase === 'loading'}
            style={{ padding: '11px', background: pw.trim() ? 'linear-gradient(90deg, #0050ff, #00f0ff)' : 'rgba(255,255,255,0.05)', border: 'none', cursor: pw.trim() ? 'pointer' : 'default', fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', letterSpacing: '3px', color: pw.trim() ? '#001018' : 'rgba(255,255,255,0.2)' }}
          >
            {phase === 'loading' ? 'CONNEXION…' : 'ENTRER'}
          </button>
          {err && <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-1)', color: '#ff2d78', lineHeight: 1.5 }}>{err}</div>}
        </form>
      </main>
    )
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  const { users, plays, feedback, data: d } = data
  return (
    <main style={{ minHeight: '100dvh', background: '#070010', padding: '28px 18px 60px' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '26px' }}>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', letterSpacing: '6px', color: '#fff', textShadow: '0 0 18px #00f0ff55' }}>FDA ADMIN</div>
          <button onClick={lock} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', padding: '6px 14px', fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-2)' }}>VERROUILLER</button>
        </div>

        {/* Users */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color: 'rgba(255,255,255,0.3)' }}>COMPTES DISCORD</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
            <Tile label="COMPTES" value={users.count} />
            <Tile label="1ER COMPTE" value={fmtDate(users.first)} color="#a3e635" />
            <Tile label="DERNIER" value={fmtDate(users.latest)} color="#a3e635" />
          </div>
          {users.recent.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
              {users.recent.map((u, i) => (
                <span key={i} style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', padding: '3px 8px' }}>{u.username}</span>
              ))}
            </div>
          )}
        </section>

        {/* Plays */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color: 'rgba(255,255,255,0.3)' }}>PARTIES SOUMISES</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
            <Tile label="GLOBAL" value={plays.global} color="#ff2d78" />
            <Tile label="JOUEURS GLOBAL" value={plays.global_distinct_players} color="#ff2d78" />
            <Tile label="DAILY" value={plays.daily} color="#00ff88" />
            <Tile label="WEEKLY" value={plays.weekly} color="#ff6a00" />
            <Tile label="SURVIE" value={plays.survival} color="#ffe000" />
            <Tile label="FLASH" value={plays.flash} color="#e879f9" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
            <Tile label="PERSONNAGES" value={d.fighters} color="rgba(255,255,255,0.6)" />
            <Tile label="MOVES" value={d.moves} color="rgba(255,255,255,0.6)" />
          </div>
        </section>

        {/* Feedback */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color: 'rgba(255,255,255,0.3)' }}>FEEDBACK ({feedback.count})</div>
          {feedback.recent.length === 0 ? (
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', color: 'rgba(255,255,255,0.25)', padding: '8px 0' }}>Aucun message reçu pour le moment.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {feedback.recent.map((f, i) => {
                const color = CAT_COLOR[f.category] ?? '#c084fc'
                return (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderLeft: `2px solid ${color}`, border: '1px solid rgba(255,255,255,0.07)', borderLeftWidth: '2px', borderLeftColor: color, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <Icon name={CAT_ICON[f.category] ?? 'chat'} size={14} color={color} />
                      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-1)', color, textTransform: 'uppercase' }}>{f.category}</span>
                      <span style={{ flex: 1 }} />
                      {f.lang && <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', color: 'rgba(255,255,255,0.3)' }}>{f.lang}</span>}
                      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', color: 'rgba(255,255,255,0.3)' }}>{fmtDate(f.created_at)}</span>
                    </div>
                    <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.9rem', fontWeight: 500, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{f.message}</div>
                    {f.contact && <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.4)' }}>contact : {f.contact}</div>}
                  </div>
                )
              })}
            </div>
          )}
        </section>

      </div>
    </main>
  )
}

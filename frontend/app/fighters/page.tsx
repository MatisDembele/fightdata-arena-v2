'use client'
import { useState, useEffect, useMemo } from 'react'
import Navbar from '@/components/Navbar'
import Container from '@/components/Container'
import PageHeader from '@/components/PageHeader'
import FighterCards from '@/components/FighterCards'
import FrameStepper from '@/components/FrameStepper'
import { getFighters, getFighterMoves } from '@/lib/api'
import { getFighterPortrait, getFighterColor } from '@/lib/portraits'
import { PHASE_COLOR } from '@/lib/sheet'
import type { Fighter, Move } from '@/types'

const COL_COLOR = '#00f0ff'

// Frame-data columns. The startup / active / recovery triplet is colour-keyed to the
// hitbox stepper's phase timeline so the table and the gif read as one system.
type Col = { key: keyof Move; label: string; w: string; color?: string; kind?: 'name' | 'onblock' }
const COLS: Col[] = [
  { key: 'move_name', label: 'MOVE',     w: 'minmax(160px, 2.4fr)', kind: 'name' },
  { key: 'startup',   label: 'STARTUP',  w: '80px',  color: PHASE_COLOR.startup },
  { key: 'active',    label: 'ACTIVE',   w: '76px',  color: PHASE_COLOR.active },
  { key: 'recovery',  label: 'RECOVERY', w: '90px',  color: PHASE_COLOR.recovery },
  { key: 'on_block',  label: 'ON BLOCK', w: '86px',  kind: 'onblock' },
  { key: 'on_hit',    label: 'ON HIT',   w: '76px' },
  { key: 'damage',    label: 'DAMAGE',   w: '84px' },
  { key: 'guard',     label: 'GUARD',    w: '78px' },
]
// Mobile keeps the most-scanned columns; the rest live one tap away in the stepper modal.
const MOBILE_KEYS = new Set<keyof Move>(['move_name', 'startup', 'on_block'])

function onBlockColor(val: string | undefined | null): string {
  if (!val) return 'rgba(255,255,255,0.4)'
  const n = parseInt(String(val).replace('+', ''))
  if (isNaN(n)) return 'rgba(255,255,255,0.55)'
  if (n <= -4) return '#ff2d78'   // punishable
  if (n >= 1)  return '#4ade80'   // plus
  return '#ffe000'                // neutral / safe-ish
}

function useIsDesktop(bp = 860) {
  const [d, setD] = useState(false)
  useEffect(() => {
    const m = window.matchMedia(`(min-width:${bp}px)`)
    const u = () => setD(m.matches); u()
    m.addEventListener('change', u); return () => m.removeEventListener('change', u)
  }, [bp])
  return d
}

export default function FightersPage() {
  const [fighters,      setFighters]      = useState<Fighter[]>([])
  const [selected,      setSelected]      = useState<Fighter | null>(null)
  const [moves,         setMoves]         = useState<Move[]>([])
  const [loadingList,   setLoadingList]   = useState(true)
  const [loadingMoves,  setLoadingMoves]  = useState(false)
  const [search,        setSearch]        = useState('')
  const [moveSearch,    setMoveSearch]    = useState('')
  const [activeSection, setActiveSection] = useState('ALL')
  const [stepMove,      setStepMove]      = useState<Move | null>(null)
  const isDesktop = useIsDesktop()

  useEffect(() => {
    getFighters().then(setFighters).catch(() => {}).finally(() => setLoadingList(false))
  }, [])

  const selectFighter = async (f: Fighter) => {
    setSelected(f); setMoves([]); setMoveSearch(''); setActiveSection('ALL'); setLoadingMoves(true)
    try { setMoves(await getFighterMoves(f.slug)) } catch { /* silent */ }
    finally { setLoadingMoves(false) }
  }

  const sections = useMemo(() => [...new Set(moves.map(m => m.section))].filter(Boolean), [moves])
  const filtered = useMemo(() => moves.filter(m => {
    const okSection = activeSection === 'ALL' || m.section === activeSection
    const okSearch  = !moveSearch || m.move_name.toLowerCase().includes(moveSearch.toLowerCase())
    return okSection && okSearch
  }), [moves, activeSection, moveSearch])
  const filteredFighters = useMemo(
    () => fighters.filter(f => f.name.toLowerCase().includes(search.toLowerCase())),
    [fighters, search]
  )

  const color = selected ? getFighterColor(selected.slug) : COL_COLOR
  const cols = isDesktop ? COLS : COLS.filter(c => MOBILE_KEYS.has(c.key))
  const grid = cols.map(c => c.w).join(' ')

  // ── MOVE DATABASE ────────────────────────────────────────────────────────────
  if (selected) {
    return (
      <>
        <Navbar />
        <main style={{ minHeight: 'calc(100vh - 60px)', padding: '28px 0 64px' }}>
          <Container variant="data">

            {/* contextual header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px', flexWrap: 'wrap' }}>
              <button onClick={() => { setSelected(null); setMoves([]) }}
                style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '8px 14px', fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.85rem', letterSpacing: '2px', flexShrink: 0 }}>
                ← BACK
              </button>
              {getFighterPortrait(selected.slug) && (
                <div style={{ width: '46px', height: '46px', overflow: 'hidden', flexShrink: 0, border: `1px solid ${color}55` }}>
                  <img src={getFighterPortrait(selected.slug)!} alt={selected.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.5rem, 4vw, 2.1rem)', letterSpacing: '5px', color: '#fff', textShadow: `0 0 16px ${color}66`, lineHeight: 1 }}>
                  {selected.name.toUpperCase()}
                </div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color: 'rgba(255,255,255,0.65)', marginTop: '4px' }}>
                  {moves.length} MOVES · STREET FIGHTER 6
                </div>
              </div>
              <input value={moveSearch} onChange={e => setMoveSearch(e.target.value)} placeholder="SEARCH MOVE…"
                style={{ padding: '9px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.72rem', letterSpacing: '1px', width: isDesktop ? '200px' : '100%', boxSizing: 'border-box' }} />
            </div>

            {/* section tabs */}
            {sections.length > 1 && (
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                {['ALL', ...sections].map(s => {
                  const on = s === activeSection
                  return (
                    <button key={s} onClick={() => setActiveSection(s)}
                      style={{ padding: '6px 13px', background: on ? `${color}1f` : 'rgba(255,255,255,0.04)', border: `1px solid ${on ? color : 'rgba(255,255,255,0.1)'}`, color: on ? color : 'rgba(255,255,255,0.7)', cursor: 'pointer', fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-1)', transition: 'all 0.15s', textTransform: 'uppercase' }}>
                      {s}
                    </button>
                  )
                })}
              </div>
            )}

            {/* legend — makes the colour coding self-explanatory */}
            <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '14px', fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.6)' }}>
              <span style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Dot c={PHASE_COLOR.startup} t="STARTUP" /><Dot c={PHASE_COLOR.active} t="ACTIVE" /><Dot c={PHASE_COLOR.recovery} t="RECOVERY" />
              </span>
              <span style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                ON&nbsp;BLOCK: <Dot c="#ff2d78" t="PUNISH" /><Dot c="#4ade80" t="PLUS" /><Dot c="#ffe000" t="SAFE" />
              </span>
              <span style={{ color: color }}>▶ click a move → hitbox frame by frame</span>
            </div>

            {/* table */}
            {loadingMoves ? (
              <div style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.7)', letterSpacing: '4px', padding: '48px 0', textAlign: 'center' }}>LOADING…</div>
            ) : (
              <div>
                {/* sticky header row */}
                <div style={{ display: 'grid', gridTemplateColumns: grid, gap: '8px', padding: '10px 14px', position: 'sticky', top: 0, zIndex: 2, background: 'rgba(8,4,16,0.96)', backdropFilter: 'blur(6px)', borderBottom: `1px solid ${color}44` }}>
                  {cols.map(c => (
                    <div key={String(c.key)} style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-1)', color: c.color ?? (c.kind === 'name' ? color : 'rgba(255,255,255,0.55)'), textAlign: c.kind === 'name' ? 'left' : 'center', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                      {c.label}
                    </div>
                  ))}
                </div>

                {/* rows */}
                {filtered.map((move, i) => (
                  <div key={i} onClick={() => setStepMove(move)} title="View hitbox frame by frame"
                    style={{ display: 'grid', gridTemplateColumns: grid, gap: '8px', padding: '9px 14px', alignItems: 'center', background: i % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.12s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${color}16` }}
                    onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'transparent' }}>
                    {cols.map(c => {
                      if (c.kind === 'name') return (
                        <div key="n" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.92rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color, fontSize: '0.55rem', flexShrink: 0 }}>▶</span>{move.move_name}
                        </div>
                      )
                      const raw = move[c.key] as string | null | undefined
                      const isOB = c.kind === 'onblock'
                      return (
                        <div key={String(c.key)} style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.78rem', letterSpacing: '0.5px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          color: raw == null ? 'rgba(255,255,255,0.22)' : isOB ? onBlockColor(raw) : (c.color ?? 'rgba(255,255,255,0.82)') }}>
                          {raw ?? '—'}
                        </div>
                      )
                    })}
                  </div>
                ))}

                {filtered.length === 0 && (
                  <div style={{ padding: '40px', textAlign: 'center', fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color: 'rgba(255,255,255,0.6)' }}>
                    NO MOVES FOUND
                  </div>
                )}
              </div>
            )}
          </Container>
        </main>
        {stepMove && (
          <FrameStepper key={`${selected.slug}-${stepMove.move_name}`} char={selected.slug} move={stepMove} color={color} onClose={() => setStepMove(null)} />
        )}
      </>
    )
  }

  // ── FIGHTER PICKER ───────────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <main style={{ minHeight: 'calc(100vh - 60px)', padding: '40px 0 64px' }}>
        <Container variant="tool">
          <PageHeader title="FRAME DATA" subtitle="STREET FIGHTER 6 // SELECT A FIGHTER" accent={`${COL_COLOR}55`} />

          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="SEARCH FIGHTER…"
            style={{ width: '100%', padding: '12px 18px', marginBottom: '22px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.78rem', letterSpacing: '2px', boxSizing: 'border-box' }} />

          {loadingList ? (
            <div style={{ textAlign: 'center', padding: '60px', fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.7)', letterSpacing: '4px' }}>LOADING…</div>
          ) : (
            // SF6 character-select tiling: parallelograms interlock (each card's left
            // slant nests into the previous card's right slant via a -SLANT margin).
            <FighterCards
              fighters={filteredFighters}
              onPick={s => { const f = fighters.find(x => x.slug === s); if (f) selectFighter(f) }}
            />
          )}
        </Container>
      </main>
    </>
  )
}

function Dot({ c, t }: { c: string; t: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
      <span style={{ width: '8px', height: '8px', background: c, borderRadius: '50%', flexShrink: 0 }} />{t}
    </span>
  )
}

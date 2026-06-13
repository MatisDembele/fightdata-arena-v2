'use client'
import { useState, useEffect, useMemo } from 'react'
import Navbar from '@/components/Navbar'
import { getFighters, getFighterMoves } from '@/lib/api'
import { getFighterPortrait, getFighterColor } from '@/lib/portraits'
import type { Fighter, Move } from '@/types'

const COL_COLOR = '#00f0ff'

const COLS: { key: keyof Move; label: string; width: string }[] = [
  { key: 'move_name',   label: 'MOVE',     width: 'minmax(120px, 2fr)' },
  { key: 'startup',     label: 'STARTUP',  width: '72px' },
  { key: 'on_block',    label: 'ON BLOCK', width: '80px' },
  { key: 'on_hit',      label: 'ON HIT',   width: '72px' },
  { key: 'damage',      label: 'DAMAGE',   width: '80px' },
  { key: 'guard',       label: 'GUARD',    width: '80px' },
]

function onBlockColor(val: string | undefined): string {
  if (!val) return 'rgba(255,255,255,0.45)'
  const n = parseInt(val.replace('+', ''))
  if (isNaN(n)) return 'rgba(255,255,255,0.45)'
  if (n <= -4) return '#ff2d78'
  if (n >= 1)  return '#4ade80'
  return '#ffe000'
}

export default function FightersPage() {
  const [fighters,       setFighters]       = useState<Fighter[]>([])
  const [selected,       setSelected]       = useState<Fighter | null>(null)
  const [moves,          setMoves]          = useState<Move[]>([])
  const [loadingList,    setLoadingList]    = useState(true)
  const [loadingMoves,   setLoadingMoves]   = useState(false)
  const [search,         setSearch]         = useState('')
  const [moveSearch,     setMoveSearch]     = useState('')
  const [activeSection,  setActiveSection]  = useState('ALL')

  useEffect(() => {
    getFighters()
      .then(setFighters)
      .catch(() => {})
      .finally(() => setLoadingList(false))
  }, [])

  const selectFighter = async (f: Fighter) => {
    setSelected(f)
    setMoves([])
    setMoveSearch('')
    setActiveSection('ALL')
    setLoadingMoves(true)
    try {
      const data = await getFighterMoves(f.slug)
      setMoves(data)
    } catch { /* silent */ }
    finally { setLoadingMoves(false) }
  }

  const sections = useMemo(() => {
    const raw = [...new Set(moves.map(m => m.section))].filter(Boolean)
    return raw
  }, [moves])

  const filtered = useMemo(() => {
    return moves.filter(m => {
      const matchSection = activeSection === 'ALL' || m.section === activeSection
      const matchSearch  = !moveSearch || m.move_name.toLowerCase().includes(moveSearch.toLowerCase())
      return matchSection && matchSearch
    })
  }, [moves, activeSection, moveSearch])

  const filteredFighters = useMemo(() =>
    fighters.filter(f => f.name.toLowerCase().includes(search.toLowerCase())),
    [fighters, search]
  )

  const color = selected ? getFighterColor(selected.slug) : COL_COLOR

  // ── MOVE TABLE ───────────────────────────────────────────────────────────────
  if (selected) {
    return (
      <>
        <Navbar />
        <main style={{ display: 'flex', flexDirection: 'column', padding: '24px 16px 60px', minHeight: 'calc(100vh - 60px)' }}>
          <div style={{ maxWidth: '900px', width: '100%', margin: '0 auto' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <button
                onClick={() => { setSelected(null); setMoves([]) }}
                style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '7px 14px', fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.85rem', letterSpacing: '2px', flexShrink: 0 }}
              >← BACK</button>

              {getFighterPortrait(selected.slug) && (
                <div style={{ width: '44px', height: '44px', overflow: 'hidden', flexShrink: 0, border: `1px solid ${color}44` }}>
                  <img src={getFighterPortrait(selected.slug)!} alt={selected.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.4rem, 4vw, 2rem)', letterSpacing: '5px', color: '#fff', textShadow: `0 0 14px ${color}55`, lineHeight: 1 }}>
                  {selected.name.toUpperCase()}
                </div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.45rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.25)', marginTop: '4px' }}>
                  {moves.length} MOVES · STREET FIGHTER 6
                </div>
              </div>

              <input
                value={moveSearch}
                onChange={e => setMoveSearch(e.target.value)}
                placeholder="SEARCH MOVE..."
                style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', letterSpacing: '1px', width: '160px', flexShrink: 0 }}
              />
            </div>

            {/* Section tabs */}
            {sections.length > 1 && (
              <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
                {['ALL', ...sections].map(s => {
                  const active = s === activeSection
                  return (
                    <button key={s} onClick={() => setActiveSection(s)} style={{ padding: '5px 12px', background: active ? `${color}18` : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? color : 'rgba(255,255,255,0.08)'}`, color: active ? color : 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.48rem', letterSpacing: '1px', transition: 'all 0.15s', textTransform: 'uppercase' }}>
                      {s}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Table */}
            {loadingMoves ? (
              <div style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.3)', letterSpacing: '4px', padding: '40px 0', textAlign: 'center' }}>LOADING...</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                {/* Header row */}
                <div style={{ display: 'grid', gridTemplateColumns: COLS.map(c => c.width).join(' '), gap: '1px', background: 'rgba(255,255,255,0.04)', padding: '8px 12px', marginBottom: '2px', borderBottom: `1px solid ${color}33` }}>
                  {COLS.map(col => (
                    <div key={col.key} style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.42rem', letterSpacing: '2px', color: color, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {col.label}
                    </div>
                  ))}
                </div>

                {/* Data rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  {filtered.map((move, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: COLS.map(c => c.width).join(' '), gap: '1px', padding: '8px 12px', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {move.move_name}
                      </div>
                      <Cell val={move.startup} />
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', letterSpacing: '1px', color: onBlockColor(move.on_block), textAlign: 'center' }}>
                        {move.on_block ?? '—'}
                      </div>
                      <Cell val={move.on_hit} />
                      <Cell val={move.damage} />
                      <Cell val={move.guard} small />
                    </div>
                  ))}
                </div>

                {filtered.length === 0 && (
                  <div style={{ padding: '32px', textAlign: 'center', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.2)' }}>
                    NO MOVES FOUND
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </>
    )
  }

  // ── FIGHTER PICKER ───────────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 16px 60px', minHeight: 'calc(100vh - 60px)' }}>
        <div style={{ width: '100%', maxWidth: '900px' }}>

          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2rem, 5vw, 3rem)', letterSpacing: '8px', color: '#fff', textShadow: `0 0 20px ${COL_COLOR}55`, lineHeight: 1 }}>
              FRAME DATA
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.52rem', letterSpacing: '4px', color: 'rgba(255,255,255,0.2)', marginTop: '6px' }}>
              STREET FIGHTER 6 // SELECT A FIGHTER
            </div>
          </div>

          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="SEARCH FIGHTER..."
            style={{ width: '100%', padding: '11px 18px', marginBottom: '20px', background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.1)`, color: '#fff', outline: 'none', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.75rem', letterSpacing: '2px', boxSizing: 'border-box' }}
          />

          {loadingList ? (
            <div style={{ textAlign: 'center', padding: '60px', fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.3)', letterSpacing: '4px' }}>LOADING...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '6px' }}>
              {filteredFighters.map(fighter => {
                const portrait = getFighterPortrait(fighter.slug)
                const fc       = getFighterColor(fighter.slug)
                return (
                  <button
                    key={fighter.slug}
                    onClick={() => selectFighter(fighter)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.07)`, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.15s', padding: 0 }}
                    onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = fc; el.style.boxShadow = `0 0 12px ${fc}33`; el.style.background = `${fc}12` }}
                    onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = 'rgba(255,255,255,0.07)'; el.style.boxShadow = 'none'; el.style.background = 'rgba(255,255,255,0.03)' }}
                  >
                    <div style={{ width: '100%', height: '90px', background: `linear-gradient(180deg, ${fc}28, ${fc}0d)`, overflow: 'hidden' }}>
                      {portrait && <img src={portrait} alt={fighter.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />}
                    </div>
                    <div style={{ padding: '6px 4px', fontFamily: "'Rajdhani', sans-serif", fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', textAlign: 'center' }}>
                      {fighter.name}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </>
  )
}

function Cell({ val, small }: { val?: string; small?: boolean }) {
  return (
    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: small ? '0.55rem' : '0.65rem', letterSpacing: '1px', color: val ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
      {val ?? '—'}
    </div>
  )
}

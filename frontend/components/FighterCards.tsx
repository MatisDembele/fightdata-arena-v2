'use client'
import type { CSSProperties } from 'react'
import { getFighterPortrait, getFighterColor } from '@/lib/portraits'

// SF6 character-select tiling. The select_character PNGs are already slanted
// parallelograms (character + name baked in): a 338px-wide parallelogram inside the
// 575px image. So we just show the image and overlap the cards so the slants tile
// côte-à-côte, minus a GAP for breathing room.
const RATIO = 338 / 575
const GAP = 14
const SLANT = 16
const PARALLELOGRAM = `polygon(${SLANT}px 0, 100% 0, calc(100% - ${SLANT}px) 100%, 0 100%)`

export type FighterLike = { slug: string; name?: string }

export default function FighterCards({
  fighters, onPick, selected, width = 150, style,
}: {
  fighters: FighterLike[]
  onPick: (slug: string) => void
  selected?: readonly string[]   // pass for single- or multi-select (highlight + ✓)
  width?: number
  style?: CSSProperties
}) {
  const overlap = Math.round(width * (1 - RATIO)) - GAP
  const sel = selected ? new Set(selected) : null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', rowGap: '14px', columnGap: 0, paddingLeft: `${overlap}px`, ...style }}>
      {fighters.map(f => {
        const portrait = getFighterPortrait(f.slug)
        const fc = getFighterColor(f.slug)
        const name = f.name || f.slug.toUpperCase()
        const isSel = sel?.has(f.slug) ?? false
        const rest = isSel ? `drop-shadow(0 0 10px ${fc}) brightness(1.08)` : 'none'
        return (
          <button key={f.slug} type="button" onClick={() => onPick(f.slug)} aria-label={name} aria-pressed={selected ? isSel : undefined}
            style={{ position: 'relative', width: `${width}px`, marginLeft: `-${overlap}px`, background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 0, transition: 'filter 0.15s', filter: rest, zIndex: isSel ? 2 : undefined }}
            onMouseEnter={e => { e.currentTarget.style.filter = `drop-shadow(0 0 12px ${fc}cc) brightness(1.12)`; e.currentTarget.style.zIndex = '3' }}
            onMouseLeave={e => { e.currentTarget.style.filter = rest; e.currentTarget.style.zIndex = isSel ? '2' : 'auto' }}>
            {portrait ? (
              <img src={portrait} alt="" loading="lazy" style={{ display: 'block', width: '100%', height: 'auto' }} onError={e => { (e.target as HTMLImageElement).style.visibility = 'hidden' }} />
            ) : (
              <div style={{ clipPath: PARALLELOGRAM, WebkitClipPath: PARALLELOGRAM, height: `${Math.round(width * 625 / 575)}px`, background: `linear-gradient(160deg, ${fc}44, ${fc}12)`, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 20px 10px' }}>
                <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#fff', lineHeight: 1.2 }}>{name}</span>
              </div>
            )}
            {isSel && (
              <span aria-hidden style={{ position: 'absolute', top: '7%', right: '15%', width: '22px', height: '22px', background: fc, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, lineHeight: 1 }}>✓</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

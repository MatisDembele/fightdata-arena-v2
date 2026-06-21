// Frame-stepper assets (sprite sheet + per-frame phase map) for the hitbox viewer.
//
// These are produced by SF6-GIFMaker (tools/build_sheets.py) and uploaded to the SAME R2/CDN
// bucket as the gifs, under a STABLE key derived from the move:
//   <CDN>/gifs/<char>/<char>-<slug>.sheet.webp     one image, a grid of every frame-data frame
//   <CDN>/gifs/<char>/<char>-<slug>.frames.json     { layout + per-frame startup/active/recovery }
//
// The slug is derived the SAME way as the Python tooling (gen_frametotals.py): from gif_path when
// present, else from the move name. That matters because the moves we generate (specials, supers,
// throws…) are exactly the ones whose FDA gif_path is EMPTY. The viewer then probes frames.json;
// if it 404s, the caller falls back to the animated gif. So this is additive and risk-free.

import type { Move } from '@/types'

const CDN = process.env.NEXT_PUBLIC_GIF_CDN

export type Phase = 'startup' | 'active' | 'recovery'

export interface FrameMeta {
  char: string
  slug: string
  count: number
  cols: number
  rows: number
  frame_w: number
  frame_h: number
  fps: number
  startup: number
  active: number
  recovery: number
  total_frames: number
  phase: Phase[]
}

// keep in lockstep with tools/gen_frametotals.py
const STRENGTH: [string, string][] = [
  ['light punch', 'lp'], ['medium punch', 'mp'], ['heavy punch', 'hp'],
  ['light kick', 'lk'], ['medium kick', 'mk'], ['heavy kick', 'hk'], ['overdrive', 'od'],
]
const VARIANT_SUFFIX =
  /-(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|june|july)\d{4}$|-aa$|-\d+(?:\.\d+)?$/i

function stem(p: string): string {
  const base = p.split('/').pop() || p
  const dot = base.lastIndexOf('.')
  return dot > 0 ? base.slice(0, dot) : base
}

export function slugFromGifPath(gifPath: string, char: string): string {
  let s = stem(gifPath)
  if (s.startsWith(`${char}-`)) s = s.slice(char.length + 1)
  return s.replace(VARIANT_SUFFIX, '')
}

export function slugFromName(name: string): string {
  const low = name.toLowerCase()
  let suffix: string | undefined
  for (const [k, v] of STRENGTH) {
    if (low.includes(`(${k})`)) { suffix = v; break }
  }
  // "(Denjin Charge)" / "(Denjin Charge + Overdrive)" variants use the sheets'
  // denjin marker (hadoken-denjin, hadoken-denjin-od) — not a strength. The
  // "(" guard avoids matching the standalone "Denjin Charge" move (-> denjin-charge).
  if (low.includes('(denjin')) suffix = low.includes('overdrive') ? 'denjin-od' : 'denjin'
  let base = name.replace(/\(.*?\)/g, '').trim().toLowerCase()
  base = base.replace(/\bsenpu-?kyaku\b/g, '')   // Tatsumaki Senpu-kyaku -> tatsumaki
  base = base.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  if (base === 'forward-throw') base = 'throw'    // sheets: throw (forward) / back-throw
  return suffix ? `${base}-${suffix}` : base
}

export function moveSlug(move: Move, char: string): string {
  return move.gif_path ? slugFromGifPath(move.gif_path, char) : slugFromName(move.move_name)
}

// First integer in a frame-data string ('16 (18)' -> 16, '...' -> default). Mirrors the Python.
export function firstInt(s?: string | null, dflt = 0): number {
  if (s == null) return dflt
  const m = String(s).match(/-?\d+/)
  return m ? parseInt(m[0], 10) : dflt
}

// Per-frame phase labels (1-based) when frames.json isn't reachable: derive from the move's own
// startup/active numbers; everything after startup+active is recovery. Matches build_sheets.py.
export function computePhases(count: number, startup: number, active: number): Phase[] {
  const sEnd = Math.max(0, startup)
  const aEnd = sEnd + Math.max(0, active)
  const out: Phase[] = []
  for (let i = 1; i <= count; i++) {
    out.push(i <= sEnd ? 'startup' : i <= aEnd ? 'active' : 'recovery')
  }
  return out
}

// CDN URLs for a move's sprite sheet + frames.json, or null when no CDN is configured.
export function sheetUrls(char: string, move: Move): { sheet: string; meta: string } | null {
  if (!CDN) return null
  const slug = moveSlug(move, char)
  if (!slug) return null
  const base = `${CDN}/gifs/${char}/${char}-${slug}`
  return { sheet: `${base}.sheet.webp`, meta: `${base}.frames.json` }
}

export const PHASE_COLOR: Record<Phase, string> = {
  startup: '#29b6f6',   // blue
  active: '#ff3d6e',    // red
  recovery: '#ffc400',  // amber
}
export const PHASE_LABEL: Record<Phase, string> = {
  startup: 'STARTUP', active: 'ACTIVE', recovery: 'RECOVERY',
}

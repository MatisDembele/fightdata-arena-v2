'use client'
// Precise frame-by-frame hitbox viewer. Loads a sprite sheet (one image, all frame-data frames)
// + frames.json from the CDN and lets you step frame by frame, each frame coloured by its phase
// (startup / active / recovery) — the same frame data shown in the table. Falls back to the
// animated gif when a move has no sprite sheet yet, so it is safe to open on any move.

import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react'
import type { Move } from '@/types'
import { sheetUrls, firstInt, computePhases, PHASE_COLOR, PHASE_LABEL, type FrameMeta } from '@/lib/sheet'
import { primaryGifSrc } from '@/lib/gif'

type Status = 'loading' | 'ready' | 'none'

export default function FrameStepper({
  char, move, color, onClose,
}: { char: string; move: Move; color: string; onClose: () => void }) {
  const urls = sheetUrls(char, move)
  const [meta, setMeta] = useState<FrameMeta | null>(null)
  // Mounted fresh per move (parent passes a key), so the initial status is derived, not reset in
  // the effect (avoids synchronous setState-in-effect).
  const [status, setStatus] = useState<Status>(urls ? 'loading' : 'none')
  const [frame, setFrame] = useState(0)            // 0-based
  const [playing, setPlaying] = useState(false)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // ── load sheet + meta ────────────────────────────────────────────────
  // Existence is probed via the IMAGE load (no CORS needed — we only draw it, never read pixels).
  // frames.json is authoritative but optional (it needs CORS); when unreachable we derive the grid
  // from total_frames + the move's startup/active so the stepper still works.
  useEffect(() => {
    let cancelled = false
    if (!urls) return
    imgRef.current = null

    const metaPromise: Promise<FrameMeta | null> = fetch(urls.meta)
      .then(r => (r.ok ? r.json() : null)).catch(() => null)

    const img = new Image()
    img.onload = async () => {
      if (cancelled) return
      const fm = await metaPromise
      const su = firstInt(move.startup), ac = firstInt(move.active), rc = firstInt(move.recovery)
      const count = (fm?.count && fm.count > 0) ? fm.count : firstInt(move.total_frames)
      if (!count || count < 1) { setStatus('none'); return }       // no way to slice the sheet
      const cols = fm?.cols || Math.max(1, Math.ceil(Math.sqrt(count)))
      const rows = fm?.rows || Math.ceil(count / cols)
      const frame_w = fm?.frame_w || Math.round(img.naturalWidth / cols)
      const frame_h = fm?.frame_h || Math.round(img.naturalHeight / rows)
      const phase = (fm?.phase && fm.phase.length === count) ? fm.phase : computePhases(count, su, ac)
      if (cancelled) return
      imgRef.current = img
      setMeta({
        char, slug: '', count, cols, rows, frame_w, frame_h,
        fps: fm?.fps || 10, startup: su, active: ac, recovery: rc, total_frames: count, phase,
      })
      setFrame(0); setStatus('ready')
    }
    img.onerror = () => { if (!cancelled) setStatus('none') }
    img.src = urls.sheet
    return () => { cancelled = true }
  }, [urls?.meta, urls?.sheet]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── draw the current frame ───────────────────────────────────────────
  const draw = useCallback(() => {
    const c = canvasRef.current, img = imgRef.current, m = meta
    if (!c || !img || !m) return
    const ctx = c.getContext('2d'); if (!ctx) return
    const sx = (frame % m.cols) * m.frame_w
    const sy = Math.floor(frame / m.cols) * m.frame_h
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.drawImage(img, sx, sy, m.frame_w, m.frame_h, 0, 0, c.width, c.height)
  }, [frame, meta])

  useEffect(() => { draw() }, [draw])

  // ── playback ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playing || !meta) return
    const id = setInterval(() => setFrame(f => (f + 1) % meta.count), 1000 / Math.max(1, meta.fps))
    return () => clearInterval(id)
  }, [playing, meta])

  const step = useCallback((d: number) => {
    setPlaying(false)
    setFrame(f => { const m = meta; if (!m) return f; return Math.min(m.count - 1, Math.max(0, f + d)) })
  }, [meta])

  // ── keyboard ─────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (!meta) return
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1) }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1) }
      else if (e.key === ' ') { e.preventDefault(); setPlaying(p => !p) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [meta, step, onClose])

  const phase = meta ? meta.phase[frame] : undefined
  const gifFallback = status === 'none' ? primaryGifSrc(move.gif_url, move.gif_path) : undefined

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '760px', maxHeight: '92vh', overflowY: 'auto', background: '#0b0d10', border: `1px solid ${color}55`, boxShadow: `0 0 40px ${color}22`, padding: '18px 18px 22px' }}
      >
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem', letterSpacing: '3px', color: '#fff', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {move.move_name.toUpperCase()}
            </div>
            {move.input && (
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', letterSpacing: '1px', color: 'rgba(255,255,255,0.55)', marginTop: '3px' }}>{move.input}</div>
            )}
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '4px 10px', fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', letterSpacing: '2px' }}>✕</button>
        </div>

        {/* frame-data summary chips (from the table data) */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <Chip label="STARTUP" value={move.startup} c={PHASE_COLOR.startup} />
          <Chip label="ACTIVE" value={move.active} c={PHASE_COLOR.active} />
          <Chip label="RECOVERY" value={move.recovery} c={PHASE_COLOR.recovery} />
          <Chip label="ON BLOCK" value={move.on_block} c="#9aa" />
          <Chip label="ON HIT" value={move.on_hit} c="#9aa" />
        </div>

        {/* viewport */}
        <div style={{ position: 'relative', width: '100%', background: '#05070a', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '220px' }}>
          {status === 'loading' && (
            <div style={{ fontFamily: "'Share Tech Mono', monospace", letterSpacing: '4px', color: 'rgba(255,255,255,0.6)', padding: '60px 0' }}>LOADING…</div>
          )}
          {status === 'ready' && meta && (
            <canvas
              ref={canvasRef}
              width={meta.frame_w}
              height={meta.frame_h}
              style={{ width: '100%', maxWidth: `${meta.frame_w}px`, height: 'auto', display: 'block', imageRendering: 'auto' }}
            />
          )}
          {status === 'none' && (
            gifFallback
              ? <img src={gifFallback} alt={move.move_name} style={{ width: '100%', maxWidth: '100%', height: 'auto', display: 'block' }} />
              : <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.72rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '50px 20px' }}>NO HITBOX PREVIEW YET</div>
          )}
          {status === 'none' && gifFallback && (
            <div style={{ position: 'absolute', top: 6, right: 8, fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '1px', color: 'rgba(255,255,255,0.4)' }}>ANIMATED (no step data)</div>
          )}
        </div>

        {/* stepper controls (only when we have frames) */}
        {status === 'ready' && meta && (
          <>
            {/* frame + phase readout */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', gap: '10px' }}>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.8rem', letterSpacing: '1px', color: 'rgba(255,255,255,0.85)' }}>
                FRAME <span style={{ color }}>{frame + 1}</span> / {meta.count}
              </div>
              {phase && (
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', letterSpacing: '3px', color: PHASE_COLOR[phase] }}>
                  {PHASE_LABEL[phase]}
                </div>
              )}
            </div>

            {/* phase timeline — one cell per frame, click to jump */}
            <div style={{ display: 'flex', gap: '1px', marginTop: '8px', height: '20px', cursor: 'pointer' }}>
              {meta.phase.map((p, i) => (
                <div
                  key={i}
                  onClick={() => { setPlaying(false); setFrame(i) }}
                  title={`Frame ${i + 1} — ${PHASE_LABEL[p]}`}
                  style={{
                    flex: 1,
                    background: PHASE_COLOR[p],
                    opacity: i === frame ? 1 : 0.34,
                    outline: i === frame ? '2px solid #fff' : 'none',
                    outlineOffset: '-2px',
                    transition: 'opacity 0.1s',
                  }}
                />
              ))}
            </div>

            {/* scrubber */}
            <input
              type="range"
              min={0}
              max={meta.count - 1}
              value={frame}
              onChange={e => { setPlaying(false); setFrame(Number(e.target.value)) }}
              style={{ width: '100%', marginTop: '12px', accentColor: color }}
            />

            {/* buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
              <Btn onClick={() => step(-1)} c={color}>◀ PREV</Btn>
              <Btn onClick={() => setPlaying(p => !p)} c={color} wide>{playing ? '❚❚ PAUSE' : '▶ PLAY'}</Btn>
              <Btn onClick={() => step(1)} c={color}>NEXT ▶</Btn>
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.58rem', letterSpacing: '1px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: '10px' }}>
              ← → STEP · SPACE PLAY · ESC CLOSE
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Chip({ label, value, c }: { label: string; value?: string; c: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 10px', border: `1px solid ${c}44`, background: `${c}10`, minWidth: '58px' }}>
      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.5rem', letterSpacing: '1px', color: 'rgba(255,255,255,0.5)' }}>{label}</span>
      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', letterSpacing: '1px', color: c, lineHeight: 1.1 }}>{value ?? '—'}</span>
    </div>
  )
}

function Btn({ onClick, c, children, wide }: { onClick: () => void; c: string; children: ReactNode; wide?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{ background: `${c}14`, border: `1px solid ${c}`, color: '#fff', cursor: 'pointer', padding: wide ? '8px 22px' : '8px 14px', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.72rem', letterSpacing: '1px' }}
    >
      {children}
    </button>
  )
}

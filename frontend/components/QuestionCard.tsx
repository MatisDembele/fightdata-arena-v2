'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import type { ReactNode, CSSProperties } from 'react'
import { gifSources } from '@/lib/gif'

export function makeChoiceStyle(
  choice: string,
  answer: string | null | undefined,
  selected: string | null,
  isIdle: boolean
): CSSProperties {
  const base: CSSProperties = {
    padding: '9px 14px', width: '100%', textAlign: 'left',
    display: 'flex', alignItems: 'center', gap: '10px',
    border: '1px solid rgba(255,255,255,0.09)',
    background: 'rgba(255,255,255,0.04)',
    transition: 'all 0.15s',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '0.88rem', color: 'rgba(255,255,255,0.75)',
    cursor: isIdle ? 'pointer' : 'default',
  }
  if (isIdle) return base
  if (choice === answer)   return { ...base, background: 'rgba(74,222,128,0.12)', border: '1px solid #4ade80', color: '#4ade80', boxShadow: '0 0 12px rgba(74,222,128,0.2)' }
  if (choice === selected) return { ...base, background: 'rgba(255,45,120,0.12)', border: '1px solid #ff2d78', color: '#ff2d78' }
  return { ...base, opacity: 0.3 }
}

interface GifSectionProps {
  gifUrl?: string
  gifPath?: string
  moveName: string
  color: string
  fallback?: string
  input?: string
  section?: string
  /** When true, the GIF area shrinks to share available height (no-scroll quiz layout). */
  flexible?: boolean
}

// Converts UFD's textual command (e.g. "Down, Down-Forward, Forward + Light Punch")
// into compact arrow notation ("↓ ↘ →  +  LP"). Unknown tokens pass through.
const DIR_MAP: Record<string, string> = {
  'down-forward': '↘', 'down-back': '↙', 'up-forward': '↗', 'up-back': '↖',
  'down': '↓', 'up': '↑', 'forward': '→', 'back': '←', 'neutral': 'N',
}
const BTN_MAP: Record<string, string> = {
  'light punch': 'LP', 'medium punch': 'MP', 'heavy punch': 'HP',
  'light kick': 'LK', 'medium kick': 'MK', 'heavy kick': 'HK',
  'all punches': 'PPP', 'all kicks': 'KKK', 'punch': 'P', 'kick': 'K',
}
export function formatInput(input: string): string {
  const plus = input.lastIndexOf('+')
  const motionRaw = plus >= 0 ? input.slice(0, plus) : input
  const buttonRaw = plus >= 0 ? input.slice(plus + 1).trim() : ''
  const dirs = motionRaw.split(',').map(s => s.trim()).filter(Boolean)
    .map(d => DIR_MAP[d.toLowerCase()] ?? d).join(' ')
  const btn = BTN_MAP[buttonRaw.toLowerCase()] ?? buttonRaw
  return [dirs, btn].filter(Boolean).join('   +   ')
}

function titleSection(s?: string): string {
  if (!s) return 'NO PREVIEW'
  return s.replace(/[_.]/g, ' ').trim().toUpperCase()
}

export function GifSection({ gifUrl, gifPath, moveName, color, fallback = 'HITBOX PREVIEW', input, section, flexible }: GifSectionProps) {
  // Optimized WebP (CDN) first, then original gif_url, then local API path.
  const sources = useMemo(() => gifSources(gifUrl, gifPath), [gifUrl, gifPath])
  const imgRef = useRef<HTMLImageElement>(null)
  const [srcIdx, setSrcIdx] = useState(0)
  const [loaded, setLoaded] = useState(false)

  // Reset to the best source when the move changes
  useEffect(() => {
    setSrcIdx(0)
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) setLoaded(true)
    else setLoaded(false)
  }, [gifUrl, gifPath])

  const src = sources[srcIdx]

  const corners: CSSProperties[] = [
    { top: '7px', left: '7px', borderTop: `1px solid ${color}`, borderLeft: `1px solid ${color}` },
    { top: '7px', right: '7px', borderTop: `1px solid ${color}`, borderRight: `1px solid ${color}` },
    { bottom: '7px', left: '7px', borderBottom: `1px solid ${color}`, borderLeft: `1px solid ${color}` },
    { bottom: '7px', right: '7px', borderBottom: `1px solid ${color}`, borderRight: `1px solid ${color}` },
  ]
  const containerStyle: CSSProperties = flexible
    ? { flex: '1 1 0', minHeight: 0, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }
    : { minHeight: '180px', height: '100%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }
  return (
    <div style={containerStyle}>
      {src ? (
        <>
          {!loaded && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.4s infinite',
            }} />
          )}
          <img
            ref={imgRef}
            src={src}
            alt={moveName}
            fetchPriority="high"
            onLoad={() => setLoaded(true)}
            onError={() => { if (srcIdx < sources.length - 1) { setSrcIdx(srcIdx + 1); setLoaded(false) } }}
            style={{
              maxHeight: '100%', maxWidth: '100%', objectFit: 'contain',
              opacity: loaded ? 1 : 0,
              transition: 'opacity 0.25s ease',
            }}
          />
        </>
      ) : input ? (
        // No hitbox GIF for this move (special/super/throw) — show the command instead.
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '20px' }}>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.28)', fontSize: '0.55rem', letterSpacing: '4px' }}>
            {titleSection(section)}
          </span>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", color, fontSize: 'clamp(1.4rem, 5vw, 2.2rem)', letterSpacing: '2px', textShadow: `0 0 16px ${color}66`, textAlign: 'center', lineHeight: 1.3 }}>
            {formatInput(input)}
          </span>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.2)', fontSize: '0.5rem', letterSpacing: '3px' }}>
            INPUT
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '20px' }}>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', letterSpacing: '3px', textAlign: 'center' }}>
            {titleSection(section)}
          </span>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.15)', fontSize: '0.55rem', letterSpacing: '3px' }}>{fallback}</span>
        </div>
      )}
      {corners.map((s, i) => (
        <div key={i} style={{ position: 'absolute', width: '10px', height: '10px', ...s }} />
      ))}
    </div>
  )
}

interface QuestionCardProps {
  gifUrl?: string
  gifPath?: string
  moveName: string
  color: string
  header: ReactNode
  questionText: ReactNode
  choices: ReactNode
  feedback: ReactNode
  style?: CSSProperties
}

export default function QuestionCard({
  gifUrl, gifPath, moveName, color,
  header, questionText, choices, feedback,
  style,
}: QuestionCardProps) {
  return (
    <div style={{ width: '100%', maxWidth: '500px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)', ...style }}>
      {header}
      <GifSection gifUrl={gifUrl} gifPath={gifPath} moveName={moveName} color={color} />
      <div style={{ padding: '16px 18px 12px' }}>{questionText}</div>
      <div style={{ padding: '0 18px' }}>{choices}</div>
      <div style={{ padding: '12px 18px 18px' }}>{feedback}</div>
    </div>
  )
}

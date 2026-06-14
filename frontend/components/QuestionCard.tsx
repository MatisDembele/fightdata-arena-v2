'use client'
import { useState, useEffect, useRef } from 'react'
import type { ReactNode, CSSProperties } from 'react'

export function makeChoiceStyle(
  choice: string,
  answer: string | null | undefined,
  selected: string | null,
  isIdle: boolean
): CSSProperties {
  const base: CSSProperties = {
    padding: '11px 14px', width: '100%', textAlign: 'left',
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface GifSectionProps {
  gifUrl?: string
  gifPath?: string
  moveName: string
  color: string
  fallback?: string
}

export function GifSection({ gifUrl, gifPath, moveName, color, fallback = 'HITBOX PREVIEW' }: GifSectionProps) {
  // gif_url (CDN/prod URL) takes priority; gif_path is the local API fallback
  const src = gifUrl || (gifPath ? `${API_URL}/${gifPath}` : undefined)
  const imgRef = useRef<HTMLImageElement>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Skip skeleton if image is already in browser cache
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true)
    } else {
      setLoaded(false)
    }
  }, [src])

  const corners: CSSProperties[] = [
    { top: '7px', left: '7px', borderTop: `1px solid ${color}`, borderLeft: `1px solid ${color}` },
    { top: '7px', right: '7px', borderTop: `1px solid ${color}`, borderRight: `1px solid ${color}` },
    { bottom: '7px', left: '7px', borderBottom: `1px solid ${color}`, borderLeft: `1px solid ${color}` },
    { bottom: '7px', right: '7px', borderBottom: `1px solid ${color}`, borderRight: `1px solid ${color}` },
  ]
  return (
    <div style={{ height: '180px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
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
            style={{
              maxHeight: '100%', maxWidth: '100%', objectFit: 'contain',
              opacity: loaded ? 1 : 0,
              transition: 'opacity 0.25s ease',
            }}
          />
        </>
      ) : (
        <span style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.15)', fontSize: '0.6rem', letterSpacing: '3px' }}>{fallback}</span>
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

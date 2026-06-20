import { CSSProperties } from 'react'

/**
 * Shared page header so every top-level page title is rendered at the exact
 * same size, tracking and rhythm — keeps headers aligned across pages.
 * `accent` only tints the title glow (each page keeps its own colour).
 */
export default function PageHeader({
  title,
  subtitle,
  accent = 'rgba(255,224,0,0.3)',
  style,
}: {
  title: string
  subtitle?: string
  accent?: string
  style?: CSSProperties
}) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '32px', ...style }}>
      <h1 style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 'clamp(2rem, 6vw, 3rem)',
        letterSpacing: '8px',
        lineHeight: 1,
        color: '#fff',
        margin: 0,
        textShadow: `0 0 20px ${accent}`,
        transition: 'text-shadow 0.4s',
      }}>{title}</h1>
      {subtitle && (
        <p style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 'var(--fs-xs)',
          letterSpacing: 'var(--ls-3)',
          color: 'rgba(255,255,255,0.65)',
          margin: '8px 0 0',
        }}>{subtitle}</p>
      )}
    </div>
  )
}

'use client'
import { usePathname } from 'next/navigation'

const PAGE_COLORS: { prefix: string; color: string; colorAlt: string }[] = [
  { prefix: '/quiz',        color: '#ff2d78', colorAlt: '#9b1fff' },
  { prefix: '/challenges',  color: '#00ff88', colorAlt: '#00b894' },
  { prefix: '/multi',       color: '#ffe000', colorAlt: '#ff6a00' },
  { prefix: '/profile',     color: '#c084fc', colorAlt: '#7c3aed' },
]

export default function PageBackground() {
  const path = usePathname()

  if (path === '/') return null

  const entry = PAGE_COLORS.find(
    ({ prefix }) => path === prefix || path.startsWith(prefix + '/')
  )
  if (!entry) return null

  const { color, colorAlt } = entry

  return (
    <>
      {/* Gradient horizontal coloré — même style que la bande centrale de l'accueil */}
      <div
        key={color}
        style={{
          position: 'fixed', inset: 0, zIndex: 0,
          background: `linear-gradient(90deg, ${colorAlt}30, ${color}20, ${colorAlt}30)`,
          animation: 'fadeIn 0.35s ease',
        }}
      />
      {/* Diagonales */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'repeating-linear-gradient(-55deg, transparent, transparent 20px, rgba(255,255,255,0.015) 20px, rgba(255,255,255,0.015) 21px)',
        pointerEvents: 'none',
      }} />
      {/* Ligne lumineuse haute */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '2px', zIndex: 2,
        background: `linear-gradient(90deg, transparent, ${color}, ${colorAlt}, transparent)`,
        boxShadow: `0 0 16px ${color}`,
      }} />
      {/* Ligne lumineuse basse */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: '2px', zIndex: 2,
        background: `linear-gradient(90deg, transparent, ${colorAlt}, ${color}, transparent)`,
        boxShadow: `0 0 16px ${colorAlt}`,
      }} />
    </>
  )
}

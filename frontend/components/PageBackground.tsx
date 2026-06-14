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
    <div
      key={color}
      style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: `
          radial-gradient(ellipse 80% 60% at 20% 50%, ${colorAlt} 0%, transparent 60%),
          radial-gradient(ellipse 70% 70% at 80% 30%, ${color} 0%, transparent 55%),
          radial-gradient(ellipse 60% 50% at 60% 80%, ${colorAlt} 0%, transparent 50%),
          linear-gradient(135deg, #0d0010 0%, #1a0030 40%, #0d0015 100%)
        `,
        animation: 'fadeIn 0.35s ease',
      }}
    />
  )
}

import type { ReactNode, CSSProperties } from 'react'

// Shared responsive width system ("gabarits") so pages exploit desktop width
// consistently instead of each picking an arbitrary phone-sized column.
//   reading — prose (frame-data, privacy, intros): narrow, for readability.
//   tool    — selection / config (quiz, play config, challenges): uses the width.
//   data    — dense data / tables (stats, multi, leaderboards): widest.
const WIDTHS = { reading: '760px', tool: '1140px', data: '1320px' } as const

export default function Container({
  variant = 'tool',
  children,
  style,
}: {
  variant?: keyof typeof WIDTHS
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: WIDTHS[variant],
        marginInline: 'auto',
        paddingInline: 'clamp(16px, 4vw, 32px)',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

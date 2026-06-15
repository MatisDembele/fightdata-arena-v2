import type { CSSProperties, ReactNode } from 'react'

// Monochrome line-icon set (24×24, inherits color via currentColor) replacing
// the emoji set across the app — consistent stroke weight, neon-friendly.
export type IconName =
  | 'startup' | 'onblock' | 'onhit' | 'recovery' | 'damage' | 'active'
  | 'classic' | 'survival' | 'hardcore' | 'input' | 'fighter' | 'custom'
  | 'flash' | 'punish' | 'random' | 'duel' | 'mistakes'

const PATHS: Record<IconName, ReactNode> = {
  // ── Stats ──
  startup: (<>
    <path d="M9 2h6" /><path d="M12 5v0" /><circle cx="12" cy="13" r="8" /><path d="M12 13V9" />
  </>),
  onblock: (<path d="M12 3l7 3v5.5c0 4.3-3 7.4-7 8.5-4-1.1-7-4.2-7-8.5V6l7-3z" />),
  onhit: (<path fill="currentColor" stroke="none" d="M12 2l1.9 6.6L20 10l-6.1 1.4L12 18l-1.9-6.6L4 10l6.1-1.4L12 2z" />),
  recovery: (<>
    <path d="M6 3h12" /><path d="M6 21h12" /><path d="M7 3h10l-5 8z" /><path d="M7 21h10l-5-8z" />
  </>),
  damage: (<>
    <path d="M12 3a7 7 0 0 0-7 7c0 2 1 3.6 2 4.6V18a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-3.4c1-1 2-2.6 2-4.6a7 7 0 0 0-7-7z" />
    <circle cx="9" cy="10.5" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="10.5" r="1.1" fill="currentColor" stroke="none" />
    <path d="M10 19v-2M12 19v-2M14 19v-2" />
  </>),
  active: (<path d="M3 12h4l2.5 7 4-15 2.5 8h4" />),

  // ── Variants ──
  classic: (<>
    <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </>),
  survival: (<path fill="currentColor" stroke="none" d="M12 21l-1.5-1.4C5.4 15 2 11.9 2 8.2 2 5.4 4.2 3.2 7 3.2c1.7 0 3.3.8 4.2 2.1.9-1.3 2.5-2.1 4.2-2.1 2.8 0 5 2.2 5 5 0 3.7-3.4 6.8-8.5 11.4L12 21z" />),
  hardcore: (<path fill="currentColor" stroke="none" d="M12 2c.6 3-1.2 4.3-2.4 6.1C8.4 9.8 8.3 11.4 9.2 12.6c.3-1 1-1.7 1.7-2.2.4 2.2 2.1 3.2 2.1 5.4a4 4 0 0 1-8 .2c0-3.3 2.4-4.7 2.6-8C7.7 5.6 9.6 3.6 12 2z" />),
  input: (<>
    <rect x="3" y="7" width="18" height="11" rx="1.5" />
    <path d="M7 11h.01M11 11h.01M15 11h.01M8 15h8" />
  </>),
  fighter: (<><circle cx="12" cy="8" r="4" /><path d="M5 21v-1a7 7 0 0 1 14 0v1" /></>),
  custom: (<>
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" />
  </>),

  // ── Special ──
  flash: (<path fill="currentColor" stroke="none" d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />),
  punish: (<>
    <circle cx="12" cy="12" r="8" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </>),
  random: (<>
    <rect x="4" y="4" width="16" height="16" rx="2.5" />
    <circle cx="8.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="8.5" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
  </>),
  duel: (<>
    <path d="M4 4l10 10M20 4L10 14" />
    <path d="M14 14l3 3M10 14l-3 3" />
  </>),
  mistakes: (<><path d="M21 12a9 9 0 1 1-2.6-6.4" /><path d="M21 4v4h-4" /></>),
}

export default function Icon({
  name, size = 20, color, strokeWidth = 1.8, style,
}: {
  name: IconName
  size?: number
  color?: string
  strokeWidth?: number
  style?: CSSProperties
}) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false"
      style={{ color, display: 'block', flexShrink: 0, ...style }}
    >
      {PATHS[name]}
    </svg>
  )
}

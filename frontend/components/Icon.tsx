import type { CSSProperties, ReactNode } from 'react'

// Monochrome line-icon set (24×24, inherits color via currentColor) replacing
// the emoji set across the app — consistent stroke weight, neon-friendly.
export type IconName =
  | 'startup' | 'onblock' | 'onhit' | 'recovery' | 'damage' | 'active'
  | 'classic' | 'survival' | 'hardcore' | 'input' | 'fighter' | 'custom'
  | 'flash' | 'punish' | 'random' | 'duel' | 'mistakes'
  // achievements
  | 'fist' | 'calendar' | 'crown' | 'trophy' | 'medal' | 'globe'
  | 'book' | 'flask' | 'diamond' | 'infinity' | 'check' | 'cross'
  // expressive / ui
  | 'flame' | 'soundOn' | 'soundOff' | 'skull' | 'gamepad'
  | 'sparkle' | 'bug' | 'chat'

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

  // ── Achievements ──
  fist: (<>
    <path d="M7 10V7.5a1.5 1.5 0 0 1 3 0V10M10 10V6.5a1.5 1.5 0 0 1 3 0V10M13 10V7.5a1.5 1.5 0 0 1 3 0V13a5 5 0 0 1-5 5h-1a6 6 0 0 1-6-6 1.5 1.5 0 0 1 3 0" />
  </>),
  calendar: (<>
    <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9.5h18" />
    <path d="M8 3v4M16 3v4" /><path d="M12 14h.01" />
  </>),
  crown: (<>
    <path d="M3 8l3.5 3.5L12 5l5.5 6.5L21 8l-1.8 11H4.8L3 8z" /><path d="M4.8 19h14.4" />
  </>),
  trophy: (<>
    <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
    <path d="M7 6H4.5a2.5 2.5 0 0 0 2.7 4M17 6h2.5a2.5 2.5 0 0 1-2.7 4" />
    <path d="M12 14v4M8.5 21h7M9.5 18h5" />
  </>),
  medal: (<>
    <path d="M8.5 3l3.5 5.5L15.5 3" /><circle cx="12" cy="15" r="6" />
    <path d="M12 12.5l1 2 2 .2-1.5 1.4.4 2-1.9-1-1.9 1 .4-2L9 14.7l2-.2z" fill="currentColor" stroke="none" />
  </>),
  globe: (<>
    <circle cx="12" cy="12" r="9" /><path d="M3 12h18" />
    <path d="M12 3c-3.5 3.5-3.5 14.5 0 18M12 3c3.5 3.5 3.5 14.5 0 18" />
  </>),
  book: (<>
    <path d="M5 4h12a2 2 0 0 1 2 2v13H7a2 2 0 0 0-2 2V4z" /><path d="M5 19a2 2 0 0 1 2-2h12" />
  </>),
  flask: (<>
    <path d="M9 3h6M10 3v6.5L5.2 18A1.6 1.6 0 0 0 6.6 20.4h10.8A1.6 1.6 0 0 0 18.8 18L14 9.5V3" />
    <path d="M7.5 14h9" />
  </>),
  diamond: (<><path d="M12 3l9 7-9 11L3 10l9-7z" /><path d="M3 10h18M9 3l3 18M15 3l-3 18" /></>),
  infinity: (<path d="M7 9a3 3 0 1 0 0 6c2.5 0 3.5-2 5-3s2.5-3 5-3a3 3 0 1 1 0 6c-2.5 0-3.5-2-5-3s-2.5-3-5-3z" />),
  check: (<path d="M5 13l4 4L19 7" strokeWidth="2.4" />),
  cross: (<path d="M6.5 6.5l11 11M17.5 6.5l-11 11" strokeWidth="2.4" />),

  // ── Expressive / UI ──
  flame: (<path fill="currentColor" stroke="none" d="M12 2.5c2.6 3 4.6 5.4 4.6 8.7a4.6 4.6 0 0 1-9.2 0c0-1.4.5-2.6 1.4-3.5-.1 1 .3 1.8 1.1 2.2.5-2.2-.4-4 .2-5.4.4-1 1.1-1.8 1.9-2z" />),
  soundOn: (<>
    <path d="M4 9v6h3.5l5 4V5l-5 4H4z" />
    <path d="M16 8.5a5 5 0 0 1 0 7M18.8 6a8 8 0 0 1 0 12" />
  </>),
  soundOff: (<>
    <path d="M4 9v6h3.5l5 4V5l-5 4H4z" />
    <path d="M16.5 9.5l5 5M21.5 9.5l-5 5" />
  </>),
  skull: (<>
    <path d="M12 3a8 8 0 0 0-5 14.3V20a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2.7A8 8 0 0 0 12 3z" />
    <circle cx="9" cy="11.5" r="1.7" fill="currentColor" stroke="none" />
    <circle cx="15" cy="11.5" r="1.7" fill="currentColor" stroke="none" />
    <path d="M12 15l-1 2.2h2L12 15z" fill="currentColor" stroke="none" />
    <path d="M10.5 21v-2.2M13.5 21v-2.2" />
  </>),
  gamepad: (<>
    <rect x="2.5" y="7.5" width="19" height="9.5" rx="4.75" />
    <path d="M7 11v3M5.5 12.5h3" />
    <circle cx="15.6" cy="11.4" r="1" fill="currentColor" stroke="none" />
    <circle cx="18.2" cy="13.4" r="1" fill="currentColor" stroke="none" />
  </>),
  sparkle: (<>
    <path fill="currentColor" stroke="none" d="M12 3l1.5 5L19 9.5l-5.5 1.5L12 16l-1.5-5L5 9.5 10.5 8 12 3z" />
    <path fill="currentColor" stroke="none" d="M18.5 14l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1z" />
  </>),
  bug: (<>
    <path d="M9 7.5a3 3 0 0 1 6 0" /><path d="M9.5 6L8 4.5M14.5 6L16 4.5" />
    <rect x="7.5" y="7.5" width="9" height="11" rx="4.5" /><path d="M12 8.5v9" />
    <path d="M7.5 10.5l-3.5-1M16.5 10.5l3.5-1M7.5 14H4M16.5 14H20M7.5 17.5l-3 1.5M16.5 17.5l3 1.5" />
  </>),
  chat: (<path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9.5L5 20.5V16H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />),
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

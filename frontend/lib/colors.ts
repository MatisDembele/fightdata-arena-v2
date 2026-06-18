// Semantic colour tokens — single source of truth for frame-data meaning and
// expressive icon accents. Mode colours live in lib/constants.ts (MODE_COLORS).

/** Frame-data meaning — matches the quiz/table colour code. */
export const STAT = {
  safe:    '#4ade80', // advantage / safe
  neutral: '#ffe000', // even
  punish:  '#ff2d78', // punishable
} as const

/** Accent colours for expressive icons (podium, combo, punish flavour). */
export const ACCENT = {
  gold:   '#ffd24a',
  silver: '#cdd3da',
  bronze: '#d8915a',
  combo:  '#ff6a00', // streak / combo flame
  skull:  '#ff2d78', // punish skull
} as const

/** Gold / silver / bronze by podium index (0-based). */
export const PODIUM = [ACCENT.gold, ACCENT.silver, ACCENT.bronze] as const

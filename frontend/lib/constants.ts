export const MODE_COLORS: Record<string, string> = {
  random:    '#c77dff',
  allrandom: '#ff2d78',
  fighter:   '#00f0ff',
  input:     '#9b1fff',
  punish:    '#ffe000',
  hardcore:  '#ff6a00',
  survival:  '#4ade80',
  damage:    '#f59e0b',
  onblock:   '#00b4d8',
  active:    '#a855f7',
  custom:    '#c77dff',
  mistakes:  '#f43f5e',
  duel:      '#14b8a6',
  flash:     '#e879f9',
  onhit:     '#f97316',
  recovery:  '#3b82f6',
}

export const MODE_COLORS_ALT: Record<string, string> = {
  random:    '#7b2fff',
  allrandom: '#9b1fff',
  fighter:   '#0050ff',
  input:     '#ff2d78',
  punish:    '#ff6a00',
  hardcore:  '#ff2d78',
  survival:  '#00f0ff',
  damage:    '#d97706',
  onblock:   '#0077b6',
  active:    '#7c3aed',
  custom:    '#7b2fff',
  mistakes:  '#be123c',
  duel:      '#0d9488',
  flash:     '#a855f7',
  onhit:     '#ea580c',
  recovery:  '#1d4ed8',
}

// Time-based per-question score, mirroring the multiplayer formula
// (app/main.py): up to 1000 points decaying with answer time, and a correct
// answer is always worth at least 100. A wrong/timed-out answer scores 0.
export function answerPoints(elapsedMs: number): number {
  return Math.max(100, Math.round(1000 - elapsedMs / 10))
}

export interface Rank {
  label: string
  color: string
  colorAlt: string
}

// SF6-style accuracy tiers — reworked thresholds (Master now reachable at 92%)
// with rounder steps and clearer, more distinct colours.
export function getRank(acc: number): Rank {
  if (acc >= 92) return { label: 'MASTER',   color: '#d64dff', colorAlt: '#9b1fff' }
  if (acc >= 80) return { label: 'DIAMOND',  color: '#46d8ff', colorAlt: '#1488e6' }
  if (acc >= 68) return { label: 'PLATINUM', color: '#74e0cf', colorAlt: '#2f9e8f' }
  if (acc >= 55) return { label: 'GOLD',     color: '#ffcf3a', colorAlt: '#e0a000' }
  if (acc >= 42) return { label: 'SILVER',   color: '#dfe6ef', colorAlt: '#a8b2c2' }
  if (acc >= 28) return { label: 'BRONZE',   color: '#d08a4e', colorAlt: '#9a5a26' }
  if (acc >= 15) return { label: 'IRON',     color: '#8a96a6', colorAlt: '#566273' }
  return                 { label: 'ROOKIE',   color: '#c0c7d0', colorAlt: '#828a96' }
}

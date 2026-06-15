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

export interface Rank {
  label: string
  color: string
  colorAlt: string
}

export function getRank(acc: number): Rank {
  if (acc === 100) return { label: 'MASTER',   color: '#cc44ff', colorAlt: '#9b1fff' }
  if (acc >= 88)   return { label: 'DIAMOND',  color: '#00ccff', colorAlt: '#0077ff' }
  if (acc >= 75)   return { label: 'PLATINUM', color: '#88bbee', colorAlt: '#4477cc' }
  if (acc >= 62)   return { label: 'GOLD',     color: '#ffd700', colorAlt: '#f0a800' }
  if (acc >= 50)   return { label: 'SILVER',   color: '#d8dde8', colorAlt: '#b0b8c8' }
  if (acc >= 37)   return { label: 'BRONZE',   color: '#cd7f32', colorAlt: '#a05020' }
  if (acc >= 25)   return { label: 'IRON',     color: '#8b7355', colorAlt: '#6b5a45' }
  return                  { label: 'ROOKIE',   color: '#c0c0c0', colorAlt: '#888888' }
}

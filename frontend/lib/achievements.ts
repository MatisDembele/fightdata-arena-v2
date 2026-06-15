import type { IconName } from '@/components/Icon'

export type Rarity = 'common' | 'rare' | 'epic' | 'master' | 'legendary'

export interface Achievement {
  id: string
  icon: IconName
  name: string
  desc: string
  rarity: Rarity
}

export const ACHIEVEMENTS: Achievement[] = [
  // ── COMMON ──
  { id: 'first_quiz',      icon: 'fist',     name: 'ROUND 1, FIGHT!',  desc: 'Complete your first quiz session.',           rarity: 'common' },
  { id: 'first_daily',     icon: 'calendar', name: 'RISE UP',          desc: 'Complete a Daily challenge.',                 rarity: 'common' },
  { id: 'first_punish',    icon: 'punish',   name: 'PUNISH COUNTER',   desc: 'Land a correct answer in PUNISH mode.',       rarity: 'common' },
  { id: 'first_input',     icon: 'input',    name: 'JUST FRAME',       desc: 'Land a correct answer in INPUT mode.',        rarity: 'common' },
  { id: 'first_multi_win', icon: 'duel',     name: 'YOU WIN',          desc: 'Win your first multiplayer match.',           rarity: 'common' },
  { id: 'first_onblock',   icon: 'onblock',  name: 'DRIVE PARRY',      desc: 'Land a correct answer in ON BLOCK mode.',     rarity: 'common' },
  { id: 'first_onhit',     icon: 'onhit',    name: 'PUNISH WINDOW',    desc: 'Land a correct answer in ON HIT mode.',       rarity: 'common' },
  { id: 'first_recovery',  icon: 'startup',  name: 'WHIFF PUNISH',     desc: 'Land a correct answer in RECOVERY mode.',     rarity: 'common' },
  { id: 'first_weekly',    icon: 'calendar', name: 'WEEKEND WARRIOR',  desc: 'Complete your first Weekly challenge.',       rarity: 'common' },
  // ── RARE ──
  { id: 'perfect_random',   icon: 'onhit',    name: 'HADOKEN!',          desc: 'Score 10/10 in RANDOM mode.',                rarity: 'rare' },
  { id: 'perfect_daily',    icon: 'diamond',  name: 'PERFECT',           desc: 'Score 10/10 on a Daily challenge.',          rarity: 'rare' },
  { id: 'perfect_hardcore', icon: 'flash',    name: 'FLASH KICK',        desc: 'Score 10/10 in HARDCORE mode.',              rarity: 'rare' },
  { id: 'perfect_damage',   icon: 'damage',   name: 'CRITICAL ART',      desc: 'Score 10/10 in DAMAGE mode.',                rarity: 'rare' },
  { id: 'onblock_ace',      icon: 'onblock',  name: 'SHIMMY',            desc: 'Score 10/10 in ON BLOCK mode.',              rarity: 'rare' },
  { id: 'onhit_ace',        icon: 'onhit',    name: 'DRIVE RUSH',        desc: 'Score 10/10 in ON HIT mode.',                rarity: 'rare' },
  { id: 'custom_perfect',   icon: 'book',     name: 'MATCHUP KNOWLEDGE', desc: '100% accuracy in a CUSTOM session (10+ Q).', rarity: 'rare' },
  { id: 'all_modes',        icon: 'classic',  name: 'BATTLE HUB',        desc: 'Play all 7 original quiz modes.',            rarity: 'rare' },
  { id: 'streak_3',         icon: 'hardcore', name: 'TARGET COMBO ×3',   desc: 'Reach a 3-day Daily streak.',                rarity: 'rare' },
  { id: 'survival_10',      icon: 'survival', name: 'SECOND WIND',       desc: 'Survive 10 questions in SURVIVAL mode.',     rarity: 'rare' },
  { id: 'hot_streak_10',    icon: 'hardcore', name: '10-HIT COMBO',      desc: 'Hit a 10-hit combo in one session.',         rarity: 'rare' },
  { id: 'bison_tuesday',    icon: 'calendar', name: 'FOR ME, IT WAS TUESDAY', desc: 'Play any quiz on a Tuesday.',           rarity: 'rare' },
  // ── EPIC ──
  { id: 'survival_25',   icon: 'onblock',  name: 'IRON BODY',      desc: 'Survive 25 questions in SURVIVAL mode.',      rarity: 'epic' },
  { id: 'onblock_master',icon: 'onblock',  name: 'FRAME TRAP',     desc: 'Score 20/20 in ON BLOCK mode.',               rarity: 'epic' },
  { id: 'fighter_main',  icon: 'medal',    name: 'MAIN CHARACTER', desc: 'Get 50 correct answers on one fighter.',      rarity: 'epic' },
  { id: 'multi_wins_10', icon: 'duel',     name: 'RANKED WARRIOR', desc: 'Win 10 multiplayer matches.',                 rarity: 'epic' },
  { id: 'streak_7',      icon: 'hardcore', name: 'TARGET COMBO ×7',desc: 'Reach a 7-day Daily streak.',                 rarity: 'epic' },
  { id: 'veteran_500',   icon: 'globe',    name: 'WORLD TOUR',     desc: 'Answer 500 total questions.',                 rarity: 'epic' },
  { id: 'hot_streak_20', icon: 'diamond',  name: '20-HIT COMBO',   desc: 'Hit a 20-hit combo in one session.',          rarity: 'epic' },
  { id: 'frame_perfect', icon: 'classic',  name: 'FRAME PERFECT',  desc: 'Finish a 20-question session with 20/20.',    rarity: 'epic' },
  // ── MASTER ──
  { id: 'survival_50',        icon: 'damage',   name: 'BURNOUT IMMUNE',  desc: 'Survive 50 questions in SURVIVAL mode.',   rarity: 'master' },
  { id: 'keyboard_warrior',   icon: 'input',    name: 'OPTION SELECT',   desc: 'Score 20/20 in INPUT mode.',               rarity: 'master' },
  { id: 'lightning_reflexes', icon: 'flash',    name: 'DRIVE IMPACT',    desc: 'Score 20/20 in HARDCORE mode.',            rarity: 'master' },
  { id: 'streak_30',          icon: 'hardcore', name: 'TARGET COMBO ×30',desc: 'Reach a 30-day Daily streak.',             rarity: 'master' },
  { id: 'hot_streak_30',      icon: 'infinity', name: 'INFINITE COMBO',  desc: 'Hit a 30-hit combo in one session.',       rarity: 'master' },
  { id: 'true_lab_monster',   icon: 'flask',    name: 'LAB MONSTER',     desc: 'Play all 10 quiz modes at least once.',    rarity: 'master' },
  // ── FLASH MODE ──
  { id: 'flash_debut', icon: 'flash',  name: 'QUICK RISE',     desc: 'Play your first Flash game.',                  rarity: 'common' },
  { id: 'flash_5',     icon: 'flash',  name: 'SONIC BOOM ×5',  desc: 'Score 5 correct in a single Flash game.',      rarity: 'rare' },
  { id: 'flash_10',    icon: 'flash',  name: 'LIGHTNING LEGS', desc: 'Score 10 correct in a single Flash game.',     rarity: 'epic' },
  { id: 'flash_20',    icon: 'damage', name: 'RAGING DEMON',   desc: 'Score 20 correct in a single Flash game.',     rarity: 'master' },
  // ── LEGENDARY ──
  { id: 'grandmaster',     icon: 'crown',  name: 'MASTER RANK',       desc: 'Answer 1000 total questions.',                 rarity: 'legendary' },
  { id: 'encyclopedia',    icon: 'globe',  name: 'THE WORLD WARRIOR', desc: 'Play all 30 fighters in FIGHTER mode.',        rarity: 'legendary' },
  { id: 'daily_champion',  icon: 'trophy', name: "WORLD'S STRONGEST", desc: 'Reach #1 on the Daily leaderboard.',           rarity: 'legendary' },
  { id: 'weekly_champion', icon: 'crown',  name: 'LEGENDARY RIVAL',   desc: 'Reach #1 on the Weekly leaderboard.',          rarity: 'legendary' },
]

export const RARITIES: Rarity[] = ['common', 'rare', 'epic', 'master', 'legendary']

export const RARITY_COLOR: Record<Rarity, string> = {
  common:    '#9ca3af',
  rare:      '#3b82f6',
  epic:      '#a855f7',
  master:    '#ff6a00',
  legendary: '#f59e0b',
}

export const RARITY_LABEL: Record<Rarity, string> = {
  common:    'COMMON',
  rare:      'RARE',
  epic:      'EPIC',
  master:    'MASTER',
  legendary: 'LEGENDARY',
}

// ── Lifetime ──────────────────────────────────────────────────────────────────

export interface Lifetime {
  questions: number
  totalCorrect: number
  punishCorrect: number
  multiWins: number
  fightersPlayed: string[]
  fighterCorrect: Record<string, number>
}

function defaultLifetime(): Lifetime {
  return { questions: 0, totalCorrect: 0, punishCorrect: 0, multiWins: 0, fightersPlayed: [], fighterCorrect: {} }
}

export function getLifetime(): Lifetime {
  if (typeof window === 'undefined') return defaultLifetime()
  try {
    const raw = localStorage.getItem('fda_lifetime')
    if (!raw) return defaultLifetime()
    const lt = JSON.parse(raw) as Record<string, unknown>
    return {
      questions:      typeof lt.questions      === 'number' ? lt.questions      : 0,
      totalCorrect:   typeof lt.totalCorrect   === 'number' ? lt.totalCorrect   : 0,
      punishCorrect:  typeof lt.punishCorrect  === 'number' ? lt.punishCorrect  : 0,
      multiWins:      typeof lt.multiWins      === 'number' ? lt.multiWins      : 0,
      fightersPlayed: Array.isArray(lt.fightersPlayed)       ? lt.fightersPlayed as string[] : [],
      fighterCorrect: (lt.fighterCorrect && typeof lt.fighterCorrect === 'object' && !Array.isArray(lt.fighterCorrect))
        ? lt.fighterCorrect as Record<string, number>
        : {},
    }
  } catch {
    localStorage.removeItem('fda_lifetime')
    return defaultLifetime()
  }
}

export interface LifetimeDelta {
  questions?: number
  totalCorrect?: number
  punishCorrect?: number
  multiWins?: number
  addFighter?: string
  addFighterCorrect?: { slug: string; correct: number }
}

export function updateLifetime(delta: LifetimeDelta): Lifetime {
  const lt = getLifetime()
  if (delta.questions)     lt.questions     += delta.questions
  if (delta.totalCorrect)  lt.totalCorrect  += delta.totalCorrect
  if (delta.punishCorrect) lt.punishCorrect += delta.punishCorrect
  if (delta.multiWins)     lt.multiWins     += delta.multiWins
  if (delta.addFighter && !lt.fightersPlayed.includes(delta.addFighter)) {
    lt.fightersPlayed.push(delta.addFighter)
  }
  if (delta.addFighterCorrect) {
    const { slug, correct } = delta.addFighterCorrect
    lt.fighterCorrect[slug] = (lt.fighterCorrect[slug] || 0) + correct
  }
  localStorage.setItem('fda_lifetime', JSON.stringify(lt))
  return lt
}

// ── Unlock helpers ────────────────────────────────────────────────────────────

export function getUnlocked(): Record<string, number> {
  if (typeof window === 'undefined') return {}
  const raw = localStorage.getItem('fda_achievements')
  return raw ? JSON.parse(raw) : {}
}

function tryUnlock(id: string, newly: Achievement[]): void {
  const current = getUnlocked()
  if (current[id]) return
  current[id] = Date.now()
  localStorage.setItem('fda_achievements', JSON.stringify(current))
  const a = ACHIEVEMENTS.find(x => x.id === id)
  if (a) newly.push(a)
}

function hasFighterKey(): boolean {
  for (let i = 0; i < localStorage.length; i++) {
    if (localStorage.key(i)?.startsWith('fda_best_fighter_')) return true
  }
  return false
}

function countFighterKeys(): number {
  let n = 0
  for (let i = 0; i < localStorage.length; i++) {
    if (localStorage.key(i)?.startsWith('fda_best_fighter_')) n++
  }
  return n
}

// ── Check & unlock ────────────────────────────────────────────────────────────

export interface CheckContext {
  mode?: string
  score?: number
  total?: number
  maxCombo?: number
  survived?: number
  slug?: string
  dailyScore?: number
  dailyRank?: number
  multiWon?: boolean
  weeklyScore?: number
  weeklyRank?: number
  flashScore?: number
}

export function checkAndUnlock(ctx: CheckContext): Achievement[] {
  if (typeof window === 'undefined') return []
  const newly: Achievement[] = []
  const lt = getLifetime()
  const u = (id: string) => tryUnlock(id, newly)
  const { mode, score, total, maxCombo, survived, dailyScore, dailyRank, multiWon, weeklyScore, weeklyRank, flashScore } = ctx

  // COMMON
  if (mode) u('first_quiz')
  if (dailyScore !== undefined) u('first_daily')
  if (mode === 'punish'  && score && score > 0) u('first_punish')
  if (mode === 'input'   && score && score > 0) u('first_input')
  if (mode === 'onblock'   && score && score > 0) u('first_onblock')
  if (mode === 'onhit'     && score && score > 0) u('first_onhit')
  if (mode === 'recovery'  && score && score > 0) u('first_recovery')
  if (multiWon) u('first_multi_win')
  if (weeklyScore !== undefined) u('first_weekly')

  // M. Bison: "For me, it was Tuesday." — any quiz played on a Tuesday (getDay() === 2)
  const playedSomething = mode || dailyScore !== undefined || weeklyScore !== undefined || flashScore !== undefined || multiWon
  if (playedSomething && new Date().getDay() === 2) u('bison_tuesday')

  // RARE — perfect scores
  if (mode === 'random'   && score === 10 && total === 10) u('perfect_random')
  if (dailyScore === 10)                                   u('perfect_daily')
  if (mode === 'hardcore' && score === 10 && total === 10) u('perfect_hardcore')
  if (mode === 'damage'   && score === 10 && total === 10) u('perfect_damage')
  if (mode === 'onblock'  && score === 10 && total === 10) u('onblock_ace')
  if (mode === 'onhit'   && score === 10 && total === 10) u('onhit_ace')
  if (mode === 'custom'   && total && total >= 10 && score === total) u('custom_perfect')

  // RARE — combos & survival
  if (maxCombo && maxCombo >= 10) u('hot_streak_10')
  if (survived && survived >= 10) u('survival_10')

  // RARE — original 7 modes
  const allModes7 = ['random', 'fighter', 'input', 'punish', 'hardcore', 'survival', 'damage']
  const played7 = allModes7.filter(m => {
    if (m === 'fighter')  return lt.fightersPlayed.length > 0 || hasFighterKey()
    if (m === 'survival') return !!localStorage.getItem('fda_survival_best')
    return !!localStorage.getItem(`fda_best_${m}`)
  })
  if (played7.length === allModes7.length) u('all_modes')

  // RARE — daily streak
  const streakRaw = localStorage.getItem('fda_daily_streak')
  if (streakRaw) {
    const streak = (JSON.parse(streakRaw) as { streak: number }).streak
    if (streak >= 3)  u('streak_3')
    if (streak >= 7)  u('streak_7')
    if (streak >= 30) u('streak_30')
  }

  // EPIC
  if (survived && survived >= 25)    u('survival_25')
  if (survived && survived >= 50)    u('survival_50')
  if (maxCombo && maxCombo >= 20)    u('hot_streak_20')
  if (maxCombo && maxCombo >= 30)    u('hot_streak_30')
  if (score === 20 && total === 20)  u('frame_perfect')
  if (lt.multiWins >= 10)            u('multi_wins_10')
  if (lt.questions >= 500)           u('veteran_500')
  if (Object.values(lt.fighterCorrect).some(c => c >= 50)) u('fighter_main')
  if (mode === 'onblock' && score === 20 && total === 20) u('onblock_master')

  // MASTER
  if (mode === 'input'    && score === 20 && total === 20) u('keyboard_warrior')
  if (mode === 'hardcore' && score === 20 && total === 20) u('lightning_reflexes')

  // MASTER — all 10 modes
  const allModes10 = ['random', 'fighter', 'input', 'punish', 'hardcore', 'survival', 'damage', 'onblock', 'custom']
  const played10 = allModes10.filter(m => {
    if (m === 'fighter')  return lt.fightersPlayed.length > 0 || hasFighterKey()
    if (m === 'survival') return !!localStorage.getItem('fda_survival_best')
    return !!localStorage.getItem(`fda_best_${m}`)
  })
  const weeklyPlayed = !!localStorage.getItem('fda_weekly_result')
  if (played10.length === allModes10.length && weeklyPlayed) u('true_lab_monster')

  // FLASH
  if (mode === 'flash') u('flash_debut')
  if (flashScore !== undefined && flashScore >= 5)  u('flash_5')
  if (flashScore !== undefined && flashScore >= 10) u('flash_10')
  if (flashScore !== undefined && flashScore >= 20) u('flash_20')

  // LEGENDARY
  if (lt.questions >= 1000) u('grandmaster')
  if (lt.fightersPlayed.length >= 30 || countFighterKeys() >= 30) u('encyclopedia')
  if (dailyRank === 1)   u('daily_champion')
  if (weeklyRank === 1)  u('weekly_champion')

  return newly
}

export type Rarity = 'common' | 'rare' | 'epic' | 'master' | 'legendary'

export interface Achievement {
  id: string
  icon: string
  name: string
  desc: string
  rarity: Rarity
}

export const ACHIEVEMENTS: Achievement[] = [
  // COMMON
  { id: 'first_quiz',      icon: '🩸', name: 'FIRST BLOOD',        desc: 'Complete your first quiz session.',           rarity: 'common' },
  { id: 'first_daily',     icon: '📅', name: 'DAILY PLAYER',       desc: 'Complete a daily challenge.',                 rarity: 'common' },
  { id: 'first_punish',    icon: '💀', name: 'PUNISHER',           desc: 'Get a correct answer in PUNISH mode.',        rarity: 'common' },
  { id: 'first_input',     icon: '⌨️', name: 'TYPE FIGHTER',       desc: 'Get a correct answer in INPUT mode.',         rarity: 'common' },
  { id: 'first_multi_win', icon: '⚔️', name: 'FIRST VICTORY',     desc: 'Win your first multiplayer match.',           rarity: 'common' },
  { id: 'first_onblock',   icon: '🛡️', name: 'BLOCK CHECKER',     desc: 'Get a correct answer in ON BLOCK mode.',      rarity: 'common' },
  { id: 'first_weekly',    icon: '📆', name: 'WEEK ONE',           desc: 'Complete your first weekly challenge.',       rarity: 'common' },
  // RARE
  { id: 'perfect_random',   icon: '🎯', name: 'STARTUP GOD',      desc: 'Score 10/10 in RANDOM mode.',                 rarity: 'rare' },
  { id: 'perfect_daily',    icon: '✨', name: 'PERFECT DAY',      desc: 'Score 10/10 on a daily challenge.',            rarity: 'rare' },
  { id: 'perfect_hardcore', icon: '⚡', name: 'SPEED DEMON',      desc: 'Score 10/10 in HARDCORE mode.',               rarity: 'rare' },
  { id: 'perfect_damage',   icon: '💥', name: 'DAMAGE DEALER',    desc: 'Score 10/10 in DAMAGE mode.',                 rarity: 'rare' },
  { id: 'onblock_ace',      icon: '🔒', name: 'BLOCK ACE',        desc: 'Score 10/10 in ON BLOCK mode.',               rarity: 'rare' },
  { id: 'custom_perfect',   icon: '🎨', name: 'MATCHUP READY',    desc: '100% accuracy in a CUSTOM session (10+ Q).',  rarity: 'rare' },
  { id: 'all_modes',        icon: '🧠', name: 'LAB MONSTER',      desc: 'Play all 7 original quiz modes.',             rarity: 'rare' },
  { id: 'streak_3',         icon: '🔥', name: 'DAILY ×3',         desc: 'Reach a 3-day daily streak.',                 rarity: 'rare' },
  { id: 'survival_10',      icon: '💪', name: 'SURVIVOR',         desc: 'Survive 10 questions in SURVIVAL mode.',      rarity: 'rare' },
  { id: 'hot_streak_10',    icon: '🌡️', name: 'ON FIRE',          desc: 'Hit a 10-hit combo in one session.',          rarity: 'rare' },
  // EPIC
  { id: 'survival_25',   icon: '🛡️', name: 'IRON WILL',          desc: 'Survive 25 questions in SURVIVAL mode.',      rarity: 'epic' },
  { id: 'onblock_master',icon: '🔐', name: 'FRAME TRAP',         desc: 'Score 20/20 in ON BLOCK mode.',               rarity: 'epic' },
  { id: 'fighter_main',  icon: '🏅', name: 'FIGHTER MAIN',       desc: 'Score 50 correct answers on one fighter.',    rarity: 'epic' },
  { id: 'multi_wins_10', icon: '⚔️', name: 'WARRIOR',            desc: 'Win 10 multiplayer matches.',                 rarity: 'epic' },
  { id: 'streak_7',      icon: '🔥', name: 'DAILY ×7',           desc: 'Reach a 7-day daily streak.',                 rarity: 'epic' },
  { id: 'veteran_500',   icon: '🌍', name: 'VETERAN',            desc: 'Answer 500 total questions.',                 rarity: 'epic' },
  { id: 'hot_streak_20', icon: '💎', name: 'FLAWLESS',           desc: 'Hit a 20-hit combo in one session.',          rarity: 'epic' },
  { id: 'frame_perfect', icon: '🎯', name: 'FRAME PERFECT',      desc: 'Finish a 20-question session with 20/20.',    rarity: 'epic' },
  // MASTER
  { id: 'survival_50',        icon: '☠️', name: 'UNDYING',          desc: 'Survive 50 questions in SURVIVAL mode.',   rarity: 'master' },
  { id: 'keyboard_warrior',   icon: '👑', name: 'KEYBOARD WARRIOR', desc: 'Score 20/20 in INPUT mode.',               rarity: 'master' },
  { id: 'lightning_reflexes', icon: '⚡', name: 'LIGHTNING REFLEX', desc: 'Score 20/20 in HARDCORE mode.',            rarity: 'master' },
  { id: 'streak_30',          icon: '🔥', name: 'DAILY ×30',        desc: 'Reach a 30-day daily streak.',             rarity: 'master' },
  { id: 'hot_streak_30',      icon: '🤖', name: 'PERFECT MACHINE',  desc: 'Hit a 30-hit combo in one session.',       rarity: 'master' },
  { id: 'true_lab_monster',   icon: '🔬', name: 'TRUE LAB MONSTER', desc: 'Play all 10 quiz modes at least once.',    rarity: 'master' },
  // LEGENDARY
  { id: 'grandmaster',     icon: '👑', name: 'GRANDMASTER',     desc: 'Answer 1000 total questions.',                 rarity: 'legendary' },
  { id: 'encyclopedia',    icon: '📚', name: 'ENCYCLOPEDIA',    desc: 'Play all 30 fighters in FIGHTER mode.',        rarity: 'legendary' },
  { id: 'daily_champion',  icon: '🏆', name: 'DAILY CHAMPION',  desc: 'Reach #1 on the daily leaderboard.',           rarity: 'legendary' },
  { id: 'weekly_champion', icon: '🥇', name: 'WEEKLY CHAMPION', desc: 'Reach #1 on the weekly leaderboard.',          rarity: 'legendary' },
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
  const raw = localStorage.getItem('fda_lifetime')
  const lt = raw ? JSON.parse(raw) : {}
  return {
    questions:      lt.questions      || 0,
    totalCorrect:   lt.totalCorrect   || 0,
    punishCorrect:  lt.punishCorrect  || 0,
    multiWins:      lt.multiWins      || 0,
    fightersPlayed: lt.fightersPlayed || [],
    fighterCorrect: lt.fighterCorrect || {},
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
}

export function checkAndUnlock(ctx: CheckContext): Achievement[] {
  if (typeof window === 'undefined') return []
  const newly: Achievement[] = []
  const lt = getLifetime()
  const u = (id: string) => tryUnlock(id, newly)
  const { mode, score, total, maxCombo, survived, dailyScore, dailyRank, multiWon, weeklyScore, weeklyRank } = ctx

  // COMMON
  if (mode) u('first_quiz')
  if (dailyScore !== undefined) u('first_daily')
  if (mode === 'punish'  && score && score > 0) u('first_punish')
  if (mode === 'input'   && score && score > 0) u('first_input')
  if (mode === 'onblock' && score && score > 0) u('first_onblock')
  if (multiWon) u('first_multi_win')
  if (weeklyScore !== undefined) u('first_weekly')

  // RARE — perfect scores
  if (mode === 'random'   && score === 10 && total === 10) u('perfect_random')
  if (dailyScore === 10)                                   u('perfect_daily')
  if (mode === 'hardcore' && score === 10 && total === 10) u('perfect_hardcore')
  if (mode === 'damage'   && score === 10 && total === 10) u('perfect_damage')
  if (mode === 'onblock'  && score === 10 && total === 10) u('onblock_ace')
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

  // LEGENDARY
  if (lt.questions >= 1000) u('grandmaster')
  if (lt.fightersPlayed.length >= 30 || countFighterKeys() >= 30) u('encyclopedia')
  if (dailyRank === 1)   u('daily_champion')
  if (weeklyRank === 1)  u('weekly_champion')

  return newly
}

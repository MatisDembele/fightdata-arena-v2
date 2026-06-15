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

// Achievement DESCRIPTIONS are translated. NAMES stay as SF6 flavor (Hadoken!,
// Raging Demon, Drive Impact… are kept across all languages, like mode labels).
// English lives on each Achievement.desc; fr/es/ja overrides live here, keyed by id.
const ACH_DESC: Record<'fr' | 'es' | 'ja', Record<string, string>> = {
  fr: {
    first_quiz: 'Termine ta première session de quiz.',
    first_daily: 'Termine un défi Daily.',
    first_punish: 'Trouve une bonne réponse en mode PUNISH.',
    first_input: 'Trouve une bonne réponse en mode INPUT.',
    first_multi_win: 'Gagne ton premier match multijoueur.',
    first_onblock: 'Trouve une bonne réponse en mode ON BLOCK.',
    first_onhit: 'Trouve une bonne réponse en mode ON HIT.',
    first_recovery: 'Trouve une bonne réponse en mode RECOVERY.',
    first_weekly: 'Termine ton premier défi Weekly.',
    perfect_random: 'Fais 10/10 en mode RANDOM.',
    perfect_daily: 'Fais 10/10 sur un défi Daily.',
    perfect_hardcore: 'Fais 10/10 en mode HARDCORE.',
    perfect_damage: 'Fais 10/10 en mode DAMAGE.',
    onblock_ace: 'Fais 10/10 en mode ON BLOCK.',
    onhit_ace: 'Fais 10/10 en mode ON HIT.',
    custom_perfect: '100 % de précision dans une session CUSTOM (10+ Q).',
    all_modes: "Joue aux 7 modes de quiz d'origine.",
    streak_3: 'Atteins une série Daily de 3 jours.',
    survival_10: 'Survis à 10 questions en mode SURVIVAL.',
    hot_streak_10: 'Enchaîne un combo de 10 dans une session.',
    bison_tuesday: 'Joue à un quiz un mardi.',
    survival_25: 'Survis à 25 questions en mode SURVIVAL.',
    onblock_master: 'Fais 20/20 en mode ON BLOCK.',
    fighter_main: 'Obtiens 50 bonnes réponses sur un seul perso.',
    multi_wins_10: 'Gagne 10 matchs multijoueur.',
    streak_7: 'Atteins une série Daily de 7 jours.',
    veteran_500: 'Réponds à 500 questions au total.',
    hot_streak_20: 'Enchaîne un combo de 20 dans une session.',
    frame_perfect: 'Termine une session de 20 questions en 20/20.',
    survival_50: 'Survis à 50 questions en mode SURVIVAL.',
    keyboard_warrior: 'Fais 20/20 en mode INPUT.',
    lightning_reflexes: 'Fais 20/20 en mode HARDCORE.',
    streak_30: 'Atteins une série Daily de 30 jours.',
    hot_streak_30: 'Enchaîne un combo de 30 dans une session.',
    true_lab_monster: 'Joue aux 10 modes de quiz au moins une fois.',
    flash_debut: 'Joue ta première partie Flash.',
    flash_5: 'Fais 5 bonnes réponses dans une partie Flash.',
    flash_10: 'Fais 10 bonnes réponses dans une partie Flash.',
    flash_20: 'Fais 20 bonnes réponses dans une partie Flash.',
    grandmaster: 'Réponds à 1000 questions au total.',
    encyclopedia: 'Joue les 30 personnages en mode FIGHTER.',
    daily_champion: 'Atteins la 1re place du classement Daily.',
    weekly_champion: 'Atteins la 1re place du classement Weekly.',
  },
  es: {
    first_quiz: 'Completa tu primera sesión de quiz.',
    first_daily: 'Completa un reto Daily.',
    first_punish: 'Acierta una respuesta en el modo PUNISH.',
    first_input: 'Acierta una respuesta en el modo INPUT.',
    first_multi_win: 'Gana tu primer combate multijugador.',
    first_onblock: 'Acierta una respuesta en el modo ON BLOCK.',
    first_onhit: 'Acierta una respuesta en el modo ON HIT.',
    first_recovery: 'Acierta una respuesta en el modo RECOVERY.',
    first_weekly: 'Completa tu primer reto Weekly.',
    perfect_random: 'Consigue 10/10 en el modo RANDOM.',
    perfect_daily: 'Consigue 10/10 en un reto Daily.',
    perfect_hardcore: 'Consigue 10/10 en el modo HARDCORE.',
    perfect_damage: 'Consigue 10/10 en el modo DAMAGE.',
    onblock_ace: 'Consigue 10/10 en el modo ON BLOCK.',
    onhit_ace: 'Consigue 10/10 en el modo ON HIT.',
    custom_perfect: '100 % de precisión en una sesión CUSTOM (10+ P).',
    all_modes: 'Juega los 7 modos de quiz originales.',
    streak_3: 'Alcanza una racha Daily de 3 días.',
    survival_10: 'Sobrevive 10 preguntas en el modo SURVIVAL.',
    hot_streak_10: 'Encadena un combo de 10 en una sesión.',
    bison_tuesday: 'Juega cualquier quiz un martes.',
    survival_25: 'Sobrevive 25 preguntas en el modo SURVIVAL.',
    onblock_master: 'Consigue 20/20 en el modo ON BLOCK.',
    fighter_main: 'Consigue 50 respuestas correctas con un luchador.',
    multi_wins_10: 'Gana 10 combates multijugador.',
    streak_7: 'Alcanza una racha Daily de 7 días.',
    veteran_500: 'Responde 500 preguntas en total.',
    hot_streak_20: 'Encadena un combo de 20 en una sesión.',
    frame_perfect: 'Termina una sesión de 20 preguntas con 20/20.',
    survival_50: 'Sobrevive 50 preguntas en el modo SURVIVAL.',
    keyboard_warrior: 'Consigue 20/20 en el modo INPUT.',
    lightning_reflexes: 'Consigue 20/20 en el modo HARDCORE.',
    streak_30: 'Alcanza una racha Daily de 30 días.',
    hot_streak_30: 'Encadena un combo de 30 en una sesión.',
    true_lab_monster: 'Juega los 10 modos de quiz al menos una vez.',
    flash_debut: 'Juega tu primera partida Flash.',
    flash_5: 'Consigue 5 aciertos en una sola partida Flash.',
    flash_10: 'Consigue 10 aciertos en una sola partida Flash.',
    flash_20: 'Consigue 20 aciertos en una sola partida Flash.',
    grandmaster: 'Responde 1000 preguntas en total.',
    encyclopedia: 'Juega los 30 personajes en el modo FIGHTER.',
    daily_champion: 'Alcanza el #1 en la clasificación Daily.',
    weekly_champion: 'Alcanza el #1 en la clasificación Weekly.',
  },
  ja: {
    first_quiz: '初めてのクイズセッションをクリア。',
    first_daily: 'Dailyチャレンジをクリア。',
    first_punish: 'PUNISHモードで正解する。',
    first_input: 'INPUTモードで正解する。',
    first_multi_win: '初めてのマルチプレイ対戦に勝利。',
    first_onblock: 'ON BLOCKモードで正解する。',
    first_onhit: 'ON HITモードで正解する。',
    first_recovery: 'RECOVERYモードで正解する。',
    first_weekly: '初めてのWeeklyチャレンジをクリア。',
    perfect_random: 'RANDOMモードで10/10を取る。',
    perfect_daily: 'Dailyチャレンジで10/10を取る。',
    perfect_hardcore: 'HARDCOREモードで10/10を取る。',
    perfect_damage: 'DAMAGEモードで10/10を取る。',
    onblock_ace: 'ON BLOCKモードで10/10を取る。',
    onhit_ace: 'ON HITモードで10/10を取る。',
    custom_perfect: 'CUSTOMセッションで正答率100%（10問以上）。',
    all_modes: 'オリジナルの7モードすべてをプレイ。',
    streak_3: 'Dailyを3日連続で達成。',
    survival_10: 'SURVIVALモードで10問生き残る。',
    hot_streak_10: '1セッションで10コンボを決める。',
    bison_tuesday: '火曜日にクイズをプレイ。',
    survival_25: 'SURVIVALモードで25問生き残る。',
    onblock_master: 'ON BLOCKモードで20/20を取る。',
    fighter_main: '1キャラで50問正解する。',
    multi_wins_10: 'マルチプレイで10勝する。',
    streak_7: 'Dailyを7日連続で達成。',
    veteran_500: '累計500問に回答する。',
    hot_streak_20: '1セッションで20コンボを決める。',
    frame_perfect: '20問セッションを20/20でクリア。',
    survival_50: 'SURVIVALモードで50問生き残る。',
    keyboard_warrior: 'INPUTモードで20/20を取る。',
    lightning_reflexes: 'HARDCOREモードで20/20を取る。',
    streak_30: 'Dailyを30日連続で達成。',
    hot_streak_30: '1セッションで30コンボを決める。',
    true_lab_monster: '10モードすべてを最低1回プレイ。',
    flash_debut: '初めてのFlashをプレイ。',
    flash_5: '1回のFlashで5問正解する。',
    flash_10: '1回のFlashで10問正解する。',
    flash_20: '1回のFlashで20問正解する。',
    grandmaster: '累計1000問に回答する。',
    encyclopedia: 'FIGHTERモードで30キャラすべてをプレイ。',
    daily_champion: 'Dailyランキングで1位になる。',
    weekly_champion: 'Weeklyランキングで1位になる。',
  },
}

// Translated description for an achievement (English lives on Achievement.desc).
export function achDesc(a: Achievement, lang: string): string {
  if (lang === 'fr' || lang === 'es' || lang === 'ja') return ACH_DESC[lang][a.id] ?? a.desc
  return a.desc
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

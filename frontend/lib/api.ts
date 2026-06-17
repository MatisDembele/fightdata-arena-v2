import type { QuizQuestion } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Quiz endpoints accept ?with_gif=false to also include moves without a hitbox
// GIF (special moves, super arts, throws…). Default keeps GIF-only behaviour.
function quizUrl(path: string, withGif: boolean): string {
  return withGif ? `${API_URL}${path}` : `${API_URL}${path}?with_gif=false`
}

// Simple in-memory TTL cache for leaderboard endpoints (5 min)
const LB_TTL = 5 * 60 * 1000
const _lbCache: Record<string, { data: unknown; ts: number }> = {}

async function cachedGet<T>(key: string, url: string): Promise<T> {
  const now = Date.now()
  const hit = _lbCache[key]
  if (hit && now - hit.ts < LB_TTL) return hit.data as T
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Erreur ${key}`)
  const data = await res.json()
  _lbCache[key] = { data, ts: now }
  return data as T
}

export function invalidateLeaderboardCache(key: string): void {
  delete _lbCache[key]
}

function collectModeBests(): Record<string, unknown> {
  const bests: Record<string, unknown> = {}
  const modes = ['random','allrandom','fighter','input','punish','hardcore','damage','onblock','onhit','recovery','mistakes','duel']
  for (const m of modes) {
    const key = m === 'custom' ? 'fda_best_custom' : `fda_best_${m}`
    const raw = localStorage.getItem(key)
    if (raw) bests[m] = JSON.parse(raw)
  }
  const sv = localStorage.getItem('fda_survival_best')
  if (sv) bests['survival'] = JSON.parse(sv)
  const fl = localStorage.getItem('fda_flash_best')
  if (fl) bests['flash'] = JSON.parse(fl)
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith('fda_best_fighter_')) {
      const raw = localStorage.getItem(k)
      if (raw) bests[`fighter_${k.replace('fda_best_fighter_', '')}`] = JSON.parse(raw)
    }
  }
  return bests
}

export async function syncProfile(token: string): Promise<void> {
  if (typeof window === 'undefined') return
  await fetch(`${API_URL}/api/auth/sync`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      achievements: JSON.parse(localStorage.getItem('fda_achievements') || '{}'),
      lifetime:     JSON.parse(localStorage.getItem('fda_lifetime')     || '{}'),
      history:      JSON.parse(localStorage.getItem('fda_history')      || '[]'),
      mode_bests:   collectModeBests(),
      mistakes:     JSON.parse(localStorage.getItem('fda_mistakes')     || '{}'),
    }),
  })
}

export async function getFighters() {
  const res = await fetch(`${API_URL}/api/fighters/`)
  if (!res.ok) throw new Error('Erreur chargement fighters')
  return res.json()
}

export async function getFighter(slug: string) {
  const res = await fetch(`${API_URL}/api/fighters/${slug}`)
  if (!res.ok) throw new Error('Fighter introuvable')
  return res.json()
}

export async function getFighterMoves(slug: string, section?: string) {
  const url = section
    ? `${API_URL}/api/fighters/${slug}/moves?section=${section}`
    : `${API_URL}/api/fighters/${slug}/moves`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Erreur chargement moves')
  return res.json()
}

export async function getRandomQuiz(withGif = true) {
  const res = await fetch(quizUrl('/api/quiz/random', withGif))
  if (!res.ok) throw new Error('Erreur quiz')
  return res.json()
}

export async function getFighterQuiz(slug: string, withGif = true) {
  const res = await fetch(quizUrl(`/api/quiz/${slug}/startup`, withGif))
  if (!res.ok) throw new Error('Erreur quiz fighter')
  return res.json()
}

export async function getRandomPunish(withGif = true) {
  const res = await fetch(quizUrl('/api/quiz/random/punish', withGif))
  if (!res.ok) throw new Error('Erreur quiz punish')
  return res.json()
}

export async function getFighterPunish(slug: string, withGif = true) {
  const res = await fetch(quizUrl(`/api/quiz/${slug}/punish`, withGif))
  if (!res.ok) throw new Error('Erreur quiz punish fighter')
  return res.json()
}

export async function getRandomDamage(withGif = true) {
  const res = await fetch(quizUrl('/api/quiz/random/damage', withGif))
  if (!res.ok) throw new Error('Erreur quiz damage')
  return res.json()
}

export async function getRandomActive(withGif = true) {
  const res = await fetch(quizUrl('/api/quiz/random/active', withGif))
  if (!res.ok) throw new Error('Erreur quiz active')
  return res.json()
}

export async function getFighterActive(slug: string, withGif = true) {
  const res = await fetch(quizUrl(`/api/quiz/${slug}/active`, withGif))
  if (!res.ok) throw new Error('Erreur quiz active fighter')
  return res.json()
}

export async function getFighterRecovery(slug: string, withGif = true) {
  const res = await fetch(quizUrl(`/api/quiz/${slug}/recovery`, withGif))
  if (!res.ok) throw new Error('Erreur quiz recovery fighter')
  return res.json()
}

export async function getFighterOnBlock(slug: string, withGif = true) {
  const res = await fetch(quizUrl(`/api/quiz/${slug}/onblock`, withGif))
  if (!res.ok) throw new Error('Erreur quiz onblock fighter')
  return res.json()
}

export async function getFighterOnHit(slug: string, withGif = true) {
  const res = await fetch(quizUrl(`/api/quiz/${slug}/onhit`, withGif))
  if (!res.ok) throw new Error('Erreur quiz onhit fighter')
  return res.json()
}

export async function getFighterDamage(slug: string, withGif = true) {
  const res = await fetch(quizUrl(`/api/quiz/${slug}/damage`, withGif))
  if (!res.ok) throw new Error('Erreur quiz damage fighter')
  return res.json()
}

export async function getDailyQuiz(): Promise<QuizQuestion[]> {
  const res = await fetch(`${API_URL}/api/quiz/daily`)
  if (!res.ok) throw new Error('Erreur daily quiz')
  return res.json()
}

export async function submitDailyScore(player_name: string, score: number, accuracy: number, elapsed_seconds?: number) {
  const res = await fetch(`${API_URL}/api/daily/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player_name, score, accuracy, elapsed_seconds }),
  })
  if (!res.ok) throw new Error('Erreur submit score')
  return res.json()
}

export interface LeaderboardEntry {
  rank: number
  player_name: string
  score: number
  accuracy: number
  elapsed_seconds?: number
}

export async function getDailyLeaderboard(): Promise<LeaderboardEntry[]> {
  return cachedGet<LeaderboardEntry[]>('daily_lb', `${API_URL}/api/daily/leaderboard`)
}

export async function getRandomOnBlock(withGif = true) {
  const res = await fetch(quizUrl('/api/quiz/random/onblock', withGif))
  if (!res.ok) throw new Error('Erreur quiz on block')
  return res.json()
}

export async function getRandomOnHit(withGif = true) {
  const res = await fetch(quizUrl('/api/quiz/random/onhit', withGif))
  if (!res.ok) throw new Error('Erreur quiz on hit')
  return res.json()
}

export async function getRandomRecovery(withGif = true) {
  const res = await fetch(quizUrl('/api/quiz/random/recovery', withGif))
  if (!res.ok) throw new Error('Erreur quiz recovery')
  return res.json()
}

export async function getWeeklyQuiz(): Promise<QuizQuestion[]> {
  const res = await fetch(`${API_URL}/api/quiz/weekly`)
  if (!res.ok) throw new Error('Erreur weekly quiz')
  return res.json()
}

export async function submitWeeklyScore(player_name: string, score: number, accuracy: number, elapsed_seconds?: number) {
  const res = await fetch(`${API_URL}/api/weekly/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player_name, score, accuracy, elapsed_seconds }),
  })
  if (!res.ok) throw new Error('Erreur submit weekly score')
  return res.json()
}

export async function getWeeklyLeaderboard(): Promise<LeaderboardEntry[]> {
  return cachedGet<LeaderboardEntry[]>('weekly_lb', `${API_URL}/api/weekly/leaderboard`)
}

export interface GlobalLeaderboardEntry {
  rank: number
  player_name: string
  total_correct: number
  total_questions: number
}

export async function submitGlobalScore(player_name: string, correct: number, total: number) {
  const res = await fetch(`${API_URL}/api/global/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player_name, correct, total }),
  })
  if (!res.ok) throw new Error('Erreur submit global score')
  return res.json()
}

export async function getGlobalLeaderboard(): Promise<GlobalLeaderboardEntry[]> {
  return cachedGet<GlobalLeaderboardEntry[]>('global_lb', `${API_URL}/api/global/leaderboard`)
}

export interface FlashLeaderboardEntry {
  rank: number
  player_name: string
  best_score: number
}

export async function submitFlashScore(player_name: string, best_score: number) {
  const res = await fetch(`${API_URL}/api/flash/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player_name, best_score }),
  })
  if (!res.ok) throw new Error('Erreur submit flash score')
  return res.json()
}

export async function getFlashLeaderboard(): Promise<FlashLeaderboardEntry[]> {
  return cachedGet<FlashLeaderboardEntry[]>('flash_lb', `${API_URL}/api/flash/leaderboard`)
}

export interface SurvivalLeaderboardEntry {
  rank: number
  player_name: string
  best_score: number
}

export async function submitSurvivalScore(player_name: string, best_score: number) {
  const res = await fetch(`${API_URL}/api/survival/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player_name, best_score }),
  })
  if (!res.ok) throw new Error('Erreur submit survival score')
  return res.json()
}

export async function getSurvivalLeaderboard(): Promise<SurvivalLeaderboardEntry[]> {
  return cachedGet<SurvivalLeaderboardEntry[]>('survival_lb', `${API_URL}/api/survival/leaderboard`)
}

export async function getSeededQuiz(seed: string, n = 10): Promise<QuizQuestion[]> {
  const res = await fetch(`${API_URL}/api/quiz/seeded?seed=${encodeURIComponent(seed)}&n=${n}`)
  if (!res.ok) throw new Error('Erreur seeded quiz')
  return res.json()
}

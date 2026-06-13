import type { QuizQuestion } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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

export async function getRandomQuiz() {
  const res = await fetch(`${API_URL}/api/quiz/random`)
  if (!res.ok) throw new Error('Erreur quiz')
  return res.json()
}

export async function getFighterQuiz(slug: string) {
  const res = await fetch(`${API_URL}/api/quiz/${slug}/startup`)
  if (!res.ok) throw new Error('Erreur quiz fighter')
  return res.json()
}

export async function getRandomPunish() {
  const res = await fetch(`${API_URL}/api/quiz/random/punish`)
  if (!res.ok) throw new Error('Erreur quiz punish')
  return res.json()
}

export async function getFighterPunish(slug: string) {
  const res = await fetch(`${API_URL}/api/quiz/${slug}/punish`)
  if (!res.ok) throw new Error('Erreur quiz punish fighter')
  return res.json()
}

export async function getRandomDamage() {
  const res = await fetch(`${API_URL}/api/quiz/random/damage`)
  if (!res.ok) throw new Error('Erreur quiz damage')
  return res.json()
}

export async function getDailyQuiz(): Promise<QuizQuestion[]> {
  const res = await fetch(`${API_URL}/api/quiz/daily`)
  if (!res.ok) throw new Error('Erreur daily quiz')
  return res.json()
}

export async function submitDailyScore(player_name: string, score: number, accuracy: number) {
  const res = await fetch(`${API_URL}/api/daily/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player_name, score, accuracy }),
  })
  if (!res.ok) throw new Error('Erreur submit score')
  return res.json()
}

export interface LeaderboardEntry {
  rank: number
  player_name: string
  score: number
  accuracy: number
}

export async function getDailyLeaderboard(): Promise<LeaderboardEntry[]> {
  return cachedGet<LeaderboardEntry[]>('daily_lb', `${API_URL}/api/daily/leaderboard`)
}

export async function getRandomOnBlock() {
  const res = await fetch(`${API_URL}/api/quiz/random/onblock`)
  if (!res.ok) throw new Error('Erreur quiz on block')
  return res.json()
}

export async function getWeeklyQuiz(): Promise<QuizQuestion[]> {
  const res = await fetch(`${API_URL}/api/quiz/weekly`)
  if (!res.ok) throw new Error('Erreur weekly quiz')
  return res.json()
}

export async function submitWeeklyScore(player_name: string, score: number, accuracy: number) {
  const res = await fetch(`${API_URL}/api/weekly/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player_name, score, accuracy }),
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

export async function getSeededQuiz(seed: string, n = 10): Promise<QuizQuestion[]> {
  const res = await fetch(`${API_URL}/api/quiz/seeded?seed=${encodeURIComponent(seed)}&n=${n}`)
  if (!res.ok) throw new Error('Erreur seeded quiz')
  return res.json()
}

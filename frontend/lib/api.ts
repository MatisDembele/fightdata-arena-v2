import type { QuizQuestion } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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
  const res = await fetch(`${API_URL}/api/daily/leaderboard`)
  if (!res.ok) throw new Error('Erreur leaderboard')
  return res.json()
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
  const res = await fetch(`${API_URL}/api/weekly/leaderboard`)
  if (!res.ok) throw new Error('Erreur weekly leaderboard')
  return res.json()
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
  const res = await fetch(`${API_URL}/api/global/leaderboard`)
  if (!res.ok) throw new Error('Erreur global leaderboard')
  return res.json()
}

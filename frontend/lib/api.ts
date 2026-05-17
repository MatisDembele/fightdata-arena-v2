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

export async function getRandomQuiz(excludeIds: number[] = [], forceStartup = false) {
  const params = new URLSearchParams()
  if (excludeIds.length) params.set('exclude', excludeIds.join(','))
  if (forceStartup) params.set('force_type', 'startup')
  const res = await fetch(`${API_URL}/api/quiz/random?${params}`)
  if (!res.ok) throw new Error('Erreur quiz')
  return res.json()
}

export async function getFighterQuiz(slug: string, excludeIds: number[] = []) {
  const params = new URLSearchParams()
  if (excludeIds.length) params.set('exclude', excludeIds.join(','))
  const res = await fetch(`${API_URL}/api/quiz/${slug}/startup?${params}`)
  if (!res.ok) throw new Error('Erreur quiz fighter')
  return res.json()
}

export async function getRandomPunish(excludeIds: number[] = []) {
  const params = new URLSearchParams()
  if (excludeIds.length) params.set('exclude', excludeIds.join(','))
  const res = await fetch(`${API_URL}/api/quiz/random/punish?${params}`)
  if (!res.ok) throw new Error('Erreur quiz punish')
  return res.json()
}

export async function getFighterPunish(slug: string) {
  const res = await fetch(`${API_URL}/api/quiz/${slug}/punish`)
  if (!res.ok) throw new Error('Erreur quiz punish fighter')
  return res.json()
}

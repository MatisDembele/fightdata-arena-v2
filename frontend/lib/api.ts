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

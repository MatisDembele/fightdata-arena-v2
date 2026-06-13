export function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

export function mondayStr(): string {
  const d = new Date()
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  const mon = new Date(d)
  mon.setUTCDate(d.getUTCDate() + diff)
  return mon.toISOString().split('T')[0]
}

export function weekNumber(): number {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { useLanguage } from '@/lib/i18n'

interface DailyResult  { date: string;  answers: boolean[]; score: number }
interface WeeklyResult { week: string;  answers: boolean[]; score: number }
interface DailyStreak  { streak: number; last_played: string }

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function mondayStr(): string {
  const d = new Date()
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  const mon = new Date(d)
  mon.setUTCDate(d.getUTCDate() + diff)
  return mon.toISOString().split('T')[0]
}

function weekNumber(): number {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function msUntilMidnight(): number {
  const now  = new Date()
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
  return next.getTime() - now.getTime()
}

function msUntilMonday(): number {
  const now  = new Date()
  const day  = now.getUTCDay()
  const daysUntil = day === 0 ? 1 : 8 - day
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntil))
  return next.getTime() - now.getTime()
}

function formatCountdown(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

function formatDate(): string {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function ChallengesPage() {
  const { t } = useLanguage()

  const [dailyResult,  setDailyResult]  = useState<DailyResult | null>(null)
  const [weeklyResult, setWeeklyResult] = useState<WeeklyResult | null>(null)
  const [streak,       setStreak]       = useState(0)
  const [dailyMs,      setDailyMs]      = useState(0)
  const [weeklyMs,     setWeeklyMs]     = useState(0)

  useEffect(() => {
    try {
      const dr = localStorage.getItem('fda_daily_result')
      const wr = localStorage.getItem('fda_weekly_result')
      const sk = localStorage.getItem('fda_daily_streak')
      const parsed: DailyResult | null = dr ? JSON.parse(dr) : null
      const wparsed: WeeklyResult | null = wr ? JSON.parse(wr) : null
      if (parsed?.date === todayStr())    setDailyResult(parsed)
      if (wparsed?.week === mondayStr())  setWeeklyResult(wparsed)
      if (sk) setStreak((JSON.parse(sk) as DailyStreak).streak)
    } catch { /* ignore */ }

    setDailyMs(msUntilMidnight())
    setWeeklyMs(msUntilMonday())

    const tick = setInterval(() => {
      setDailyMs(msUntilMidnight())
      setWeeklyMs(msUntilMonday())
    }, 1000)
    return () => clearInterval(tick)
  }, [])

  const dailyAcc   = dailyResult  ? Math.round(dailyResult.score / 10 * 100)                  : null
  const weeklyAcc  = weeklyResult ? Math.round(weeklyResult.score / weeklyResult.answers.length * 100) : null

  return (
    <>
      <Navbar />
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 20px 80px', minHeight: 'calc(100vh - 60px)' }}>
        <div style={{ width: '100%', maxWidth: '600px' }}>

          {/* Header */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2rem, 6vw, 3rem)', letterSpacing: '8px', color: '#fff', textShadow: '0 0 20px rgba(255,224,0,0.3)', lineHeight: 1 }}>
              CHALLENGES
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.52rem', letterSpacing: '4px', color: 'rgba(255,255,255,0.2)', marginTop: '8px' }}>
              FIGHT DATA ARENA // TIME-BASED CHALLENGES
            </div>
          </div>

          {/* Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* DAILY */}
            <ChallengeCard
              title="DAILY"
              sub={formatDate()}
              color="#00ff88"
              colorAlt="#00b894"
              played={!!dailyResult}
              score={dailyResult?.score ?? null}
              total={10}
              accuracy={dailyAcc}
              answers={dailyResult?.answers ?? null}
              streak={streak}
              streakLabel={streak >= 2 ? `🔥 ${streak}-day streak` : null}
              resetLabel={`Resets in ${formatCountdown(dailyMs)}`}
              href="/quiz/daily"
              icon="📅"
            />

            {/* WEEKLY */}
            <ChallengeCard
              title="WEEKLY"
              sub={`W${weekNumber()}`}
              color="#ff6a00"
              colorAlt="#d97706"
              played={!!weeklyResult}
              score={weeklyResult?.score ?? null}
              total={20}
              accuracy={weeklyAcc}
              answers={weeklyResult?.answers ?? null}
              streak={null}
              streakLabel={null}
              resetLabel={`Resets in ${formatCountdown(weeklyMs)}`}
              href="/quiz/weekly"
              icon="📆"
            />
          </div>

          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <Link href="/quiz" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }}>
              ← {t('quiz.choose_mode')}
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}

interface CardProps {
  title: string
  sub: string
  color: string
  colorAlt: string
  played: boolean
  score: number | null
  total: number
  accuracy: number | null
  answers: boolean[] | null
  streak: number | null
  streakLabel: string | null
  resetLabel: string
  href: string
  icon: string
}

function ChallengeCard({ title, sub, color, colorAlt, played, score, total, accuracy, answers, streakLabel, resetLabel, href, icon }: CardProps) {
  return (
    <div style={{
      border: `1px solid ${played ? color + '44' : 'rgba(255,255,255,0.08)'}`,
      background: played ? `${color}08` : 'rgba(255,255,255,0.02)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: played ? `linear-gradient(90deg, ${colorAlt}, ${color})` : 'rgba(255,255,255,0.06)' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>

        {/* Left — identity + status */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{icon}</span>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', letterSpacing: '4px', color: played ? color : '#fff', textShadow: played ? `0 0 14px ${color}66` : 'none', lineHeight: 1 }}>
                {title}
              </div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.45rem', letterSpacing: '3px', color: played ? color + 'aa' : 'rgba(255,255,255,0.25)', marginTop: '2px' }}>
                {sub}
              </div>
            </div>
          </div>

          {/* Played: emoji grid */}
          {played && answers && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '12px', marginBottom: '8px' }}>
              {answers.map((ok, i) => (
                <div key={i} style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', background: ok ? 'rgba(74,222,128,0.15)' : 'rgba(255,45,120,0.12)', border: `1px solid ${ok ? '#4ade8055' : '#ff2d7855'}` }}>
                  {ok ? '✅' : '❌'}
                </div>
              ))}
            </div>
          )}

          {/* Meta */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: played ? '4px' : '12px' }}>
            {streakLabel && (
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.48rem', letterSpacing: '2px', color: '#ffe000' }}>
                {streakLabel}
              </div>
            )}
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.44rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.2)' }}>
              {resetLabel}
            </div>
          </div>
        </div>

        {/* Right — score or CTA */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px', minWidth: '100px' }}>
          {played && score !== null ? (
            <>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.5rem', letterSpacing: '2px', lineHeight: 1, color: color, textShadow: `0 0 16px ${color}66` }}>
                  {score}<span style={{ fontSize: '1rem', opacity: 0.5 }}>/{total}</span>
                </div>
                {accuracy !== null && (
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.48rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                    {accuracy}% accuracy
                  </div>
                )}
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.42rem', letterSpacing: '2px', color: color + '88', marginTop: '4px' }}>
                  ✓ DONE
                </div>
              </div>
              <Link href={href} style={{
                padding: '7px 14px',
                background: 'none', border: `1px solid ${color}44`,
                color: color + '99', textDecoration: 'none',
                fontFamily: "'Share Tech Mono', monospace", fontSize: '0.48rem', letterSpacing: '2px',
                whiteSpace: 'nowrap',
              }}>
                VIEW →
              </Link>
            </>
          ) : (
            <Link href={href} style={{
              padding: '14px 20px',
              background: `linear-gradient(135deg, ${colorAlt}, ${color})`,
              color: '#fff', textDecoration: 'none',
              fontFamily: "'Bebas Neue', sans-serif", fontSize: '1rem', letterSpacing: '4px',
              boxShadow: `0 0 20px ${color}33`,
              whiteSpace: 'nowrap',
              display: 'block', textAlign: 'center',
            }}>
              PLAY →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

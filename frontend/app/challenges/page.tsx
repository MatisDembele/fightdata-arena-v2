'use client'
export const dynamic = 'force-static'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Container from '@/components/Container'
import { useLanguage } from '@/lib/i18n'
import Icon, { type IconName } from '@/components/Icon'
import { ACCENT } from '@/lib/colors'
import { getDailyLeaderboard, getWeeklyLeaderboard, type LeaderboardEntry } from '@/lib/api'
import { getRank, type Rank } from '@/lib/constants'

interface DailyResult  { date: string;  answers: boolean[]; score: number; points?: number }
interface WeeklyResult { week: string;  answers: boolean[]; score: number; points?: number }
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

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.round(s % 60)
  if (m > 0) return `${m}m${String(sec).padStart(2, '0')}s`
  return `${sec}s`
}

function getLast7Days(): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

export default function ChallengesPage() {
  const { t } = useLanguage()

  const [dailyResult,  setDailyResult]  = useState<DailyResult | null>(null)
  const [weeklyResult, setWeeklyResult] = useState<WeeklyResult | null>(null)
  const [streak,       setStreak]       = useState(0)
  const [dailyHistory, setDailyHistory] = useState<Record<string, {score:number;total:number}>>({})
  const [pseudo,       setPseudo]       = useState('')
  const [dailyMs,      setDailyMs]      = useState(0)
  const [weeklyMs,     setWeeklyMs]     = useState(0)
  const [dailyLb,      setDailyLb]      = useState<LeaderboardEntry[]>([])
  const [weeklyLb,     setWeeklyLb]     = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    try {
      const dr = localStorage.getItem('fda_daily_result')
      const wr = localStorage.getItem('fda_weekly_result')
      const sk = localStorage.getItem('fda_daily_streak')
      const dh = localStorage.getItem('fda_daily_history')
      const ps = localStorage.getItem('fda_pseudo')
      const parsed: DailyResult | null = dr ? JSON.parse(dr) : null
      const wparsed: WeeklyResult | null = wr ? JSON.parse(wr) : null
      if (parsed?.date === todayStr())    setDailyResult(parsed)
      if (wparsed?.week === mondayStr())  setWeeklyResult(wparsed)
      if (sk) setStreak((JSON.parse(sk) as DailyStreak).streak)
      if (dh) setDailyHistory(JSON.parse(dh))
      if (ps) setPseudo(ps.trim())
    } catch { /* ignore */ }

    setDailyMs(msUntilMidnight())
    setWeeklyMs(msUntilMonday())

    const tick = setInterval(() => {
      setDailyMs(msUntilMidnight())
      setWeeklyMs(msUntilMonday())
    }, 1000)

    getDailyLeaderboard().then(setDailyLb).catch(() => {})
    getWeeklyLeaderboard().then(setWeeklyLb).catch(() => {})

    return () => clearInterval(tick)
  }, [])

  const dailyAcc   = dailyResult  ? Math.round(dailyResult.score / 10 * 100)                              : null
  const weeklyAcc  = weeklyResult ? Math.round(weeklyResult.score / weeklyResult.answers.length * 100)    : null
  const dailyRank  = dailyAcc  !== null ? getRank(dailyAcc)  : null
  const weeklyRank = weeklyAcc !== null ? getRank(weeklyAcc) : null

  const last7Days = getLast7Days()
  const today = todayStr()

  return (
    <>
      <Navbar />
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0 80px', minHeight: 'calc(100vh - 60px)' }}>
        <Container variant="tool">

          {/* Header */}
          <div style={{ marginBottom: '40px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2rem, 6vw, 3rem)', letterSpacing: '8px', color: '#fff', textShadow: '0 0 20px rgba(255,224,0,0.3)', lineHeight: 1 }}>
              CHALLENGES
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color: 'rgba(255,255,255,0.65)', marginTop: '8px' }}>
              FIGHT DATA ARENA // TIME-BASED CHALLENGES
            </div>
          </div>

          {/* Streak Hero */}
          {streak > 0 && (
            <div style={{ marginBottom: '32px', padding: '20px 24px', border: '1px solid rgba(255,224,0,0.22)', background: 'rgba(255,224,0,0.04)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #ffe000, transparent)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center', minWidth: '64px' }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '3.5rem', letterSpacing: '2px', lineHeight: 1, color: '#ffe000', textShadow: '0 0 20px #ffe00066' }}>
                    {streak}
                  </div>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.5rem', letterSpacing: '2px', color: 'rgba(255,224,0,0.55)', marginTop: '2px' }}>
                    {t('daily.streak_unit')}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'nowrap' }}>
                    {last7Days.map(day => {
                      const entry = dailyHistory[day]
                      let bg = 'rgba(255,255,255,0.08)'
                      let glow = 'none'
                      if (entry) {
                        const pct = (entry.score / entry.total) * 100
                        if (pct >= 80)      { bg = '#4ade80'; glow = '0 0 8px #4ade8055' }
                        else if (pct >= 50) { bg = '#ffe000'; glow = '0 0 8px #ffe00055' }
                        else                { bg = '#ff2d78'; glow = '0 0 8px #ff2d7855' }
                      }
                      return (
                        <div
                          key={day}
                          title={day + (entry ? ` — ${entry.score}/${entry.total}` : '')}
                          style={{
                            flex: 1, aspectRatio: '1', borderRadius: '50%',
                            background: bg, boxShadow: glow,
                            border: day === today ? '2px solid rgba(255,255,255,0.35)' : '2px solid transparent',
                          }}
                        />
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {[['#4ade80','≥80%'],['#ffe000','≥50%'],['#ff2d78','<50%']].map(([c, l]) => (
                      <div key={c} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: c }} />
                        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.48rem', letterSpacing: '1px', color: 'rgba(255,255,255,0.65)' }}>{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cards */}
          <div className="challenges-cards">

            <ChallengeCard
              title="DAILY"
              sub={formatDate()}
              color="#00ff88"
              colorAlt="#00b894"
              played={!!dailyResult}
              score={dailyResult?.score ?? null}
              points={dailyResult?.points ?? null}
              total={10}
              accuracy={dailyAcc}
              answers={dailyResult?.answers ?? null}
              streakLabel={streak >= 2 ? t('daily.streak', { n: streak }) : null}
              resetLabel={t('challenge.resets_in', { time: formatCountdown(dailyMs) })}
              href="/quiz/daily"
              icon="calendar"
              leaderboard={dailyLb}
              rank={dailyRank}
              pseudo={pseudo}
            />

            <ChallengeCard
              title="WEEKLY"
              sub={`W${weekNumber()}`}
              color="#ff6a00"
              colorAlt="#d97706"
              played={!!weeklyResult}
              score={weeklyResult?.score ?? null}
              points={weeklyResult?.points ?? null}
              total={20}
              accuracy={weeklyAcc}
              answers={weeklyResult?.answers ?? null}
              streakLabel={null}
              resetLabel={t('challenge.resets_in', { time: formatCountdown(weeklyMs) })}
              href="/quiz/weekly"
              icon="calendar"
              leaderboard={weeklyLb}
              rank={weeklyRank}
              pseudo={pseudo}
            />
          </div>

        </Container>
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
  points: number | null
  total: number
  accuracy: number | null
  answers: boolean[] | null
  streakLabel: string | null
  resetLabel: string
  href: string
  icon: IconName
  leaderboard: LeaderboardEntry[]
  rank: Rank | null
  pseudo: string
}

function ChallengeCard({ title, sub, color, colorAlt, played, score, points, total, accuracy, answers, streakLabel, resetLabel, href, icon, leaderboard, rank, pseudo }: CardProps) {
  const { t } = useLanguage()
  const lbTitle = title === 'DAILY'
    ? t('challenge.top_daily',  { n: Math.min(leaderboard.length, 5) })
    : t('challenge.top_weekly', { n: Math.min(leaderboard.length, 5) })

  const myEntry = pseudo ? leaderboard.find(e => e.player_name === pseudo) : undefined
  const showMyPosition = myEntry && myEntry.rank > 5

  return (
    <div style={{
      border: `1px solid ${played ? color + '44' : 'rgba(255,255,255,0.08)'}`,
      background: played ? `${color}08` : 'rgba(255,255,255,0.02)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: played ? `linear-gradient(90deg, ${colorAlt}, ${color})` : 'rgba(255,255,255,0.06)' }} />

      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>

          {/* Left */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <Icon name={icon} size={26} color={played ? color : '#fff'} />
              <div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', letterSpacing: '4px', color: played ? color : '#fff', textShadow: played ? `0 0 14px ${color}66` : 'none', lineHeight: 1 }}>
                  {title}
                </div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color: played ? color + 'aa' : 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                  {sub}
                </div>
              </div>
            </div>

            {played && answers && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '12px', marginBottom: '8px' }}>
                {answers.map((ok, i) => (
                  <div key={i} style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: ok ? 'rgba(74,222,128,0.15)' : 'rgba(255,45,120,0.12)', border: `1px solid ${ok ? '#4ade8055' : '#ff2d7855'}` }}>
                    <Icon name={ok ? 'check' : 'cross'} size={12} color={ok ? '#4ade80' : '#ff2d78'} />
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: played ? '4px' : '12px' }}>
              {streakLabel && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)', color: '#ffe000' }}>
                  <Icon name="flame" size={13} color={ACCENT.combo} />{streakLabel}
                </div>
              )}
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-2)', color: 'rgba(255,255,255,0.65)' }}>
                {resetLabel}
              </div>
            </div>
          </div>

          {/* Right */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px', minWidth: '100px' }}>
            {played && score !== null ? (
              <>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: points != null ? '2rem' : '2.5rem', letterSpacing: '2px', lineHeight: 1, color: color, textShadow: `0 0 16px ${color}66` }}>
                    {points != null ? points : score}
                    <span style={{ fontSize: '1rem', opacity: 0.5, letterSpacing: points != null ? '2px' : '0' }}>{points != null ? ' PTS' : `/${total}`}</span>
                  </div>
                  {(points != null || accuracy !== null) && (
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                      {points != null ? `${score}/${total}` : ''}{points != null && accuracy !== null ? ' · ' : ''}{accuracy !== null ? `${accuracy}% ${t('stats.accuracy').toLowerCase()}` : ''}
                    </div>
                  )}
                  {rank && (
                    <div style={{ marginTop: '6px', padding: '2px 8px', background: `${rank.color}18`, border: `1px solid ${rank.color}44`, display: 'inline-block' }}>
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.78rem', letterSpacing: '2px', color: rank.color }}>
                        {rank.label}
                      </span>
                    </div>
                  )}
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-2)', color: color + '88', marginTop: '4px' }}>
                    {t('challenge.done')}
                  </div>
                </div>
                <Link href={href} style={{
                  padding: '7px 14px',
                  background: 'none', border: `1px solid ${color}44`,
                  color: color + '99', textDecoration: 'none',
                  fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)',
                  whiteSpace: 'nowrap',
                }}>
                  {t('challenge.view')}
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
                {t('quiz.play')}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div style={{ borderTop: `1px solid ${color}18`, padding: '12px 24px 16px' }}>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-3)', color: color + '88', marginBottom: '8px' }}>
            {lbTitle}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {leaderboard.slice(0, 5).map(entry => {
              const isMe = pseudo && entry.player_name === pseudo
              return (
                <div key={entry.rank} style={{
                  display: 'grid', gridTemplateColumns: '22px 1fr 44px 44px',
                  padding: '5px 10px', alignItems: 'center', gap: '8px',
                  background: isMe ? `${color}10` : 'transparent',
                  border: `1px solid ${isMe ? color + '33' : 'rgba(255,255,255,0.04)'}`,
                }}>
                  <span style={{
                    fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.72rem', letterSpacing: '1px',
                    color: entry.rank === 1 ? '#ffd700' : entry.rank === 2 ? '#c0c0c0' : entry.rank === 3 ? '#cd7f32' : 'rgba(255,255,255,0.6)',
                  }}>#{entry.rank}</span>
                  <span style={{
                    fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-1)',
                    color: isMe ? color : 'rgba(255,255,255,0.7)',
                    textShadow: isMe ? `0 0 8px ${color}` : 'none',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{entry.player_name}</span>
                  <span style={{
                    fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: '1px',
                    color: 'rgba(255,255,255,0.65)', textAlign: 'right',
                  }}>{entry.elapsed_seconds != null ? formatTime(entry.elapsed_seconds) : '—'}</span>
                  <span style={{
                    fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.78rem', letterSpacing: '1px',
                    color: isMe ? color : 'rgba(255,255,255,0.7)', textAlign: 'right',
                  }}>{entry.score}</span>
                </div>
              )
            })}

            {/* User position if outside top 5 */}
            {showMyPosition && myEntry && (
              <>
                <div style={{ textAlign: 'center', padding: '2px 0', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.5rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.65)' }}>
                  ···
                </div>
                <div style={{
                  display: 'grid', gridTemplateColumns: '22px 1fr 44px 44px',
                  padding: '5px 10px', alignItems: 'center', gap: '8px',
                  background: `${color}10`,
                  border: `1px solid ${color}33`,
                }}>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.72rem', letterSpacing: '1px', color: 'rgba(255,255,255,0.68)' }}>
                    #{myEntry.rank}
                  </span>
                  <span style={{
                    fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-1)',
                    color: color, textShadow: `0 0 8px ${color}`,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{myEntry.player_name}</span>
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: '1px', color: 'rgba(255,255,255,0.65)', textAlign: 'right' }}>
                    {myEntry.elapsed_seconds != null ? formatTime(myEntry.elapsed_seconds) : '—'}
                  </span>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.78rem', letterSpacing: '1px', color: color, textAlign: 'right' }}>
                    {myEntry.score}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

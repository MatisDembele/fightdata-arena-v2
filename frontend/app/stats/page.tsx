'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { useLanguage } from '@/lib/i18n'
import { getFighterPortrait, getFighterColor } from '@/lib/portraits'

interface ModeStats {
  bestScore: number
  bestAccuracy: number
  totalGames: number
}

interface SurvivalStats {
  best: number
  totalGames: number
}

interface DailyStreak {
  streak: number
  last_played: string
}

const MODES = [
  { key: 'random',   label: 'RANDOM',       color: '#ff2d78' },
  { key: 'fighter',  label: 'FIGHTER (avg)', color: '#00f0ff' },
  { key: 'input',    label: 'INPUT',         color: '#9b1fff' },
  { key: 'punish',   label: 'PUNISH',        color: '#ffe000' },
  { key: 'hardcore', label: 'HARDCORE',      color: '#ff6a00' },
  { key: 'damage',   label: 'DAMAGE',        color: '#f59e0b' },
]

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function yesterdayStr() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

export default function StatsPage() {
  const { t } = useLanguage()
  const [modeStats, setModeStats]       = useState<Record<string, ModeStats | null>>({})
  const [survival, setSurvival]         = useState<SurvivalStats | null>(null)
  const [streak, setStreak]             = useState<DailyStreak | null>(null)
  const [pseudo, setPseudo]             = useState<string | null>(null)
  const [avatar, setAvatar]             = useState<string | null>(null)
  const [fighterKeys, setFighterKeys]   = useState<string[]>([])

  useEffect(() => {
    const stats: Record<string, ModeStats | null> = {}
    for (const m of MODES) {
      if (m.key === 'fighter') continue
      const raw = localStorage.getItem(`fda_best_${m.key}`)
      stats[m.key] = raw ? JSON.parse(raw) : null
    }

    // Aggregate fighter stats
    const slugs: string[] = []
    let totalGames = 0, bestScore = -1, totalAcc = 0, count = 0
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith('fda_best_fighter_')) {
        const slug = k.replace('fda_best_fighter_', '')
        slugs.push(slug)
        const raw = localStorage.getItem(k)
        if (raw) {
          const d: ModeStats = JSON.parse(raw)
          totalGames += d.totalGames
          bestScore   = Math.max(bestScore, d.bestScore)
          totalAcc   += d.bestAccuracy
          count++
        }
      }
    }
    setFighterKeys(slugs)
    if (count > 0) {
      stats['fighter'] = {
        bestScore,
        bestAccuracy: Math.round(totalAcc / count),
        totalGames,
      }
    } else {
      stats['fighter'] = null
    }
    setModeStats(stats)

    const sv = localStorage.getItem('fda_survival_best')
    setSurvival(sv ? JSON.parse(sv) : null)

    const st = localStorage.getItem('fda_daily_streak')
    setStreak(st ? JSON.parse(st) : null)

    setPseudo(localStorage.getItem('fda_pseudo'))
    setAvatar(localStorage.getItem('fda_avatar'))
  }, [])

  const streakActive = streak && (streak.last_played === todayStr() || streak.last_played === yesterdayStr())

  return (
    <>
      <Navbar />
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px 60px', minHeight: 'calc(100vh - 60px)' }}>
        <div style={{ width: '100%', maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* Title */}
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2rem, 5vw, 3rem)', letterSpacing: '8px', color: '#fff', textShadow: '0 0 20px rgba(155,31,255,0.6)' }}>
              {t('stats.title')}
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '4px', color: 'rgba(255,255,255,0.2)', marginTop: '6px' }}>
              FIGHT DATA ARENA // PLAYER PROFILE
            </div>
          </div>

          {/* Player card */}
          {(pseudo || avatar) && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '16px 20px',
              background: 'rgba(155,31,255,0.07)',
              border: '1px solid rgba(155,31,255,0.2)',
            }}>
              {avatar && (
                <div style={{ width: '52px', height: '52px', overflow: 'hidden', flexShrink: 0, border: `1px solid ${getFighterColor(avatar)}44` }}>
                  <img
                    src={getFighterPortrait(avatar) ?? ''}
                    alt={avatar}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
              )}
              <div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', letterSpacing: '3px', color: '#fff' }}>
                  {pseudo ?? 'PLAYER'}
                </div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.5rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.25)', marginTop: '2px' }}>
                  {t('stats.player')}
                </div>
              </div>
            </div>
          )}

          {/* Daily streak */}
          <Section title={t('stats.daily')} color="#00ff88">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '3rem', letterSpacing: '2px', color: streakActive ? '#ffe000' : 'rgba(255,255,255,0.2)', textShadow: streakActive ? '0 0 16px #ffe00066' : 'none' }}>
                {streakActive ? streak!.streak : 0}
              </span>
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.3)' }}>
                {t('stats.days')}
              </span>
              {streakActive && streak!.streak >= 2 && (
                <span style={{ fontSize: '1.4rem' }}>🔥</span>
              )}
            </div>
          </Section>

          {/* Quiz modes */}
          <Section title={t('stats.quiz_modes')} color="#9b1fff">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {MODES.map(m => {
                const s = modeStats[m.key]
                return (
                  <div key={m.key} style={{
                    display: 'grid', gridTemplateColumns: '120px 1fr 1fr 1fr',
                    padding: '10px 14px', gap: '8px', alignItems: 'center',
                    background: s ? 'rgba(255,255,255,0.03)' : 'transparent',
                    border: `1px solid ${s ? 'rgba(255,255,255,0.07)' : 'transparent'}`,
                  }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.8rem', letterSpacing: '2px', color: s ? m.color : 'rgba(255,255,255,0.2)', textShadow: s ? `0 0 8px ${m.color}55` : 'none' }}>
                      {m.label}
                    </div>
                    {s ? (
                      <>
                        <StatCell val={`${s.bestScore}`}     label={t('stats.best_score')} color={m.color} />
                        <StatCell val={`${s.bestAccuracy}%`} label={t('stats.accuracy')}   color={m.color} />
                        <StatCell val={String(s.totalGames)} label={t('stats.games')}       color={m.color} />
                      </>
                    ) : (
                      <div style={{ gridColumn: '2 / 5', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.5rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.15)' }}>
                        {t('stats.no_data')}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Survival */}
              <div style={{
                display: 'grid', gridTemplateColumns: '120px 1fr 1fr 1fr',
                padding: '10px 14px', gap: '8px', alignItems: 'center',
                background: survival ? 'rgba(255,255,255,0.03)' : 'transparent',
                border: `1px solid ${survival ? 'rgba(255,255,255,0.07)' : 'transparent'}`,
              }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.8rem', letterSpacing: '2px', color: survival ? '#4ade80' : 'rgba(255,255,255,0.2)', textShadow: survival ? '0 0 8px #4ade8055' : 'none' }}>
                  SURVIVAL
                </div>
                {survival ? (
                  <>
                    <StatCell val={`${survival.best} Q`}       label={t('stats.survived')} color="#4ade80" />
                    <StatCell val="—"                           label={t('stats.accuracy')} color="rgba(255,255,255,0.2)" />
                    <StatCell val={String(survival.totalGames)} label={t('stats.games')}    color="#4ade80" />
                  </>
                ) : (
                  <div style={{ gridColumn: '2 / 5', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.5rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.15)' }}>
                    {t('stats.no_data')}
                  </div>
                )}
              </div>
            </div>
          </Section>

          {/* Fighter breakdown */}
          {fighterKeys.length > 0 && (
            <Section title="FIGHTER BREAKDOWN" color="#00f0ff">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {fighterKeys.map(slug => {
                  const raw  = localStorage.getItem(`fda_best_fighter_${slug}`)
                  const s: ModeStats | null = raw ? JSON.parse(raw) : null
                  if (!s) return null
                  const color = getFighterColor(slug)
                  return (
                    <div key={slug} style={{
                      padding: '6px 10px',
                      background: `${color}11`,
                      border: `1px solid ${color}33`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                    }}>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.7rem', letterSpacing: '1px', color, textTransform: 'uppercase' }}>
                        {slug}
                      </div>
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.45rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>
                        {s.bestAccuracy}% / {s.totalGames}g
                      </div>
                    </div>
                  )
                })}
              </div>
            </Section>
          )}

          <Link href="/" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.2)', textDecoration: 'none', textAlign: 'center' }}>
            ← HOME
          </Link>
        </div>
      </main>
    </>
  )
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem',
        letterSpacing: '4px', color, marginBottom: '12px',
        borderBottom: `1px solid ${color}22`, paddingBottom: '8px',
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function StatCell({ val, label, color }: { val: string; label: string; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', letterSpacing: '1px', color }}>
        {val}
      </div>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.42rem', letterSpacing: '1px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
        {label}
      </div>
    </div>
  )
}

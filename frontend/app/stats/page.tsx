'use client'
import { useState, useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { useLanguage, type DictKey } from '@/lib/i18n'
import { getFighterPortrait, getFighterColor } from '@/lib/portraits'
import { ACHIEVEMENTS, RARITIES, RARITY_COLOR, RARITY_LABEL, getUnlocked, type Rarity } from '@/lib/achievements'
import { getGlobalLeaderboard, type GlobalLeaderboardEntry } from '@/lib/api'

interface ModeStats {
  bestScore: number
  bestAccuracy: number
  totalGames: number
}

interface SurvivalStats {
  best: number
  totalGames: number
}

interface FlashStats {
  best: number
  totalGames: number
}

interface DailyStreak {
  streak: number
  last_played: string
}

interface FighterEntry {
  slug: string
  stats: ModeStats
}

const QUIZ_MODES = [
  { key: 'random',   label: 'RANDOM',       color: '#ff2d78' },
  { key: 'fighter',  label: 'FIGHTER (avg)', color: '#00f0ff' },
  { key: 'input',    label: 'INPUT',         color: '#9b1fff' },
  { key: 'punish',   label: 'PUNISH',        color: '#ffe000' },
  { key: 'hardcore', label: 'HARDCORE',      color: '#ff6a00' },
  { key: 'damage',   label: 'DAMAGE',        color: '#f59e0b' },
  { key: 'onblock',  label: 'ON BLOCK',      color: '#00b4d8' },
  { key: 'onhit',   label: 'ON HIT',        color: '#f97316' },
  { key: 'custom',   label: 'CUSTOM',        color: '#c77dff' },
]

function todayStr()     { return new Date().toISOString().split('T')[0] }
function yesterdayStr() {
  const d = new Date(); d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

export default function StatsPage() {
  const { t } = useLanguage()

  const [modeStats, setModeStats]       = useState<Record<string, ModeStats | null>>({})
  const [survival, setSurvival]         = useState<SurvivalStats | null>(null)
  const [flash,    setFlash]            = useState<FlashStats | null>(null)
  const [streak, setStreak]             = useState<DailyStreak | null>(null)
  const [pseudo, setPseudo]             = useState<string | null>(null)
  const [avatar, setAvatar]             = useState<string | null>(null)
  const [fighters, setFighters]         = useState<FighterEntry[]>([])
  const [unlocked, setUnlocked]         = useState<Record<string, number>>({})
  const [globalLb, setGlobalLb]         = useState<GlobalLeaderboardEntry[]>([])

  useEffect(() => {
    const stats: Record<string, ModeStats | null> = {}

    for (const m of QUIZ_MODES) {
      if (m.key === 'fighter') continue
      const raw = localStorage.getItem(`fda_best_${m.key}`)
      stats[m.key] = raw ? JSON.parse(raw) : null
    }

    // Collect + aggregate fighter-specific stats
    const fighterList: FighterEntry[] = []
    let totalGames = 0, bestScore = -1, totalAcc = 0, count = 0

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith('fda_best_fighter_')) {
        const slug = k.replace('fda_best_fighter_', '')
        const raw  = localStorage.getItem(k)
        if (raw) {
          const d: ModeStats = JSON.parse(raw)
          fighterList.push({ slug, stats: d })
          totalGames += d.totalGames
          bestScore   = Math.max(bestScore, d.bestScore)
          totalAcc   += d.bestAccuracy
          count++
        }
      }
    }

    stats['fighter'] = count > 0
      ? { bestScore, bestAccuracy: Math.round(totalAcc / count), totalGames }
      : null

    setModeStats(stats)
    setFighters(fighterList)

    const sv = localStorage.getItem('fda_survival_best')
    setSurvival(sv ? JSON.parse(sv) : null)

    const fl = localStorage.getItem('fda_flash_best')
    setFlash(fl ? JSON.parse(fl) : null)

    const st = localStorage.getItem('fda_daily_streak')
    setStreak(st ? JSON.parse(st) : null)

    setPseudo(localStorage.getItem('fda_pseudo'))
    setAvatar(localStorage.getItem('fda_avatar'))
    setUnlocked(getUnlocked())
    getGlobalLeaderboard().then(setGlobalLb).catch(() => {})
  }, [])

  const streakActive = streak && (
    streak.last_played === todayStr() || streak.last_played === yesterdayStr()
  )

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', background: 'rgba(155,31,255,0.07)', border: '1px solid rgba(155,31,255,0.2)' }}>
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
              {streakActive && streak!.streak >= 2 && <span style={{ fontSize: '1.4rem' }}>🔥</span>}
            </div>
          </Section>

          {/* Quiz modes */}
          <Section title={t('stats.quiz_modes')} color="#9b1fff">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {QUIZ_MODES.map(m => {
                const s = modeStats[m.key]
                return (
                  <ModeRow key={m.key} label={m.label} color={m.color} hasData={!!s}>
                    {s ? (
                      <>
                        <StatCell val={String(s.bestScore)}     label={t('stats.best_score')} color={m.color} />
                        <StatCell val={`${s.bestAccuracy}%`}    label={t('stats.accuracy')}   color={m.color} />
                        <StatCell val={String(s.totalGames)}    label={t('stats.games')}       color={m.color} />
                      </>
                    ) : (
                      <NoData label={t('stats.no_data')} />
                    )}
                  </ModeRow>
                )
              })}

              {/* Survival */}
              <ModeRow label="SURVIVAL" color="#4ade80" hasData={!!survival}>
                {survival ? (
                  <>
                    <StatCell val={`${survival.best} Q`}        label={t('stats.survived')} color="#4ade80" />
                    <StatCell val="—"                            label={t('stats.accuracy')} color="rgba(255,255,255,0.2)" />
                    <StatCell val={String(survival.totalGames)}  label={t('stats.games')}    color="#4ade80" />
                  </>
                ) : (
                  <NoData label={t('stats.no_data')} />
                )}
              </ModeRow>

              {/* Flash */}
              <ModeRow label="FLASH" color="#e879f9" hasData={!!flash}>
                {flash ? (
                  <>
                    <StatCell val={`${flash.best}`}             label={t('stats.best_score')} color="#e879f9" />
                    <StatCell val="—"                           label={t('stats.accuracy')}   color="rgba(255,255,255,0.2)" />
                    <StatCell val={String(flash.totalGames)}    label={t('stats.games')}       color="#e879f9" />
                  </>
                ) : (
                  <NoData label={t('stats.no_data')} />
                )}
              </ModeRow>
            </div>
          </Section>

          {/* Fighter heatmap */}
          {fighters.length > 0 && (
            <Section title="FIGHTER HEATMAP" color="#00f0ff">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: '5px' }}>
                {fighters.map(({ slug, stats: s }) => {
                  const pct = s.bestAccuracy / 100
                  const r = Math.round(255 * (1 - pct) + 74 * pct)
                  const g = Math.round(45 * (1 - pct) + 222 * pct)
                  const b = Math.round(120 * (1 - pct) + 128 * pct)
                  const color = `rgb(${r},${g},${b})`
                  return (
                    <div key={slug} style={{ padding: '8px 4px', background: `${color}18`, border: `1px solid ${color}44`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.45rem', letterSpacing: '0.5px', color, textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.2 }}>
                        {slug}
                      </div>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', letterSpacing: '1px', color }}>
                        {s.bestAccuracy}%
                      </div>
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.35rem', color: 'rgba(255,255,255,0.25)' }}>
                        {s.totalGames}g
                      </div>
                    </div>
                  )
                })}
              </div>
            </Section>
          )}

          {/* Global leaderboard */}
          {globalLb.length > 0 && (
            <Section title={t('stats.global_leaderboard')} color="#ffd700">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {globalLb.map(entry => {
                  const isMe = pseudo && entry.player_name === pseudo
                  const acc  = entry.total_questions > 0 ? Math.round(entry.total_correct / entry.total_questions * 100) : 0
                  return (
                    <div key={entry.rank} style={{
                      display: 'grid', gridTemplateColumns: '28px 1fr 56px 40px',
                      padding: '7px 12px', alignItems: 'center', gap: '8px',
                      background: isMe ? 'rgba(255,215,0,0.08)' : entry.rank <= 3 ? 'rgba(255,255,255,0.03)' : 'transparent',
                      border: `1px solid ${isMe ? '#ffd70044' : 'rgba(255,255,255,0.05)'}`,
                    }}>
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.85rem', letterSpacing: '1px', color: entry.rank === 1 ? '#ffd700' : entry.rank === 2 ? '#c0c0c0' : entry.rank === 3 ? '#cd7f32' : 'rgba(255,255,255,0.3)' }}>
                        #{entry.rank}
                      </span>
                      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', letterSpacing: '1px', color: isMe ? '#ffd700' : 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.player_name}
                      </span>
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', color: isMe ? '#ffd700' : 'rgba(255,255,255,0.5)', textAlign: 'right' }}>
                        {entry.total_correct}
                      </span>
                      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.42rem', color: 'rgba(255,255,255,0.25)', textAlign: 'right' }}>
                        {acc}%
                      </span>
                    </div>
                  )
                })}
              </div>
            </Section>
          )}

          {/* Achievements */}
          <AchievementsSection unlocked={unlocked} t={t} />

          <Link href="/" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.2)', textDecoration: 'none', textAlign: 'center' }}>
            ← HOME
          </Link>
        </div>
      </main>
    </>
  )
}

function Section({ title, color, children }: { title: string; color: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '4px', color, marginBottom: '12px', borderBottom: `1px solid ${color}22`, paddingBottom: '8px' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function ModeRow({ label, color, hasData, children }: { label: string; color: string; hasData: boolean; children: ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 1fr', padding: '10px 14px', gap: '8px', alignItems: 'center', background: hasData ? 'rgba(255,255,255,0.03)' : 'transparent', border: `1px solid ${hasData ? 'rgba(255,255,255,0.07)' : 'transparent'}` }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.8rem', letterSpacing: '2px', color: hasData ? color : 'rgba(255,255,255,0.2)', textShadow: hasData ? `0 0 8px ${color}55` : 'none' }}>
        {label}
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

function NoData({ label }: { label: string }) {
  return (
    <div style={{ gridColumn: '2 / 5', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.5rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.15)' }}>
      {label}
    </div>
  )
}

function AchievementsSection({ unlocked, t }: { unlocked: Record<string, number>; t: (key: DictKey, v?: Record<string, string | number>) => string }) {
  const totalUnlocked = ACHIEVEMENTS.filter(a => !!unlocked[a.id]).length
  return (
    <Section title={`${t('stats.achievements')} — ${t('stats.achievements_progress', { n: totalUnlocked, total: ACHIEVEMENTS.length })}`} color="#f59e0b">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {RARITIES.map((rarity: Rarity) => {
          const group = ACHIEVEMENTS.filter(a => a.rarity === rarity)
          const count = group.filter(a => !!unlocked[a.id]).length
          return (
            <div key={rarity}>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.42rem', letterSpacing: '3px', color: RARITY_COLOR[rarity], marginBottom: '8px' }}>
                {RARITY_LABEL[rarity]} ({count}/{group.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {group.map(a => {
                  const isUnlocked = !!unlocked[a.id]
                  const c = RARITY_COLOR[a.rarity]
                  return (
                    <div key={a.id} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '8px 12px',
                      background: isUnlocked ? `${c}0d` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isUnlocked ? c + '33' : 'rgba(255,255,255,0.05)'}`,
                      opacity: isUnlocked ? 1 : 0.4,
                    }}>
                      <div style={{ fontSize: '1.2rem', lineHeight: 1, filter: isUnlocked ? 'none' : 'grayscale(1)', flexShrink: 0 }}>
                        {a.icon}
                      </div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.75rem', letterSpacing: '1.5px', color: isUnlocked ? c : 'rgba(255,255,255,0.3)' }}>
                          {a.name}
                        </div>
                        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.4rem', letterSpacing: '1px', color: 'rgba(255,255,255,0.22)', marginTop: '2px' }}>
                          {a.desc}
                        </div>
                      </div>
                      {isUnlocked && (
                        <div style={{ fontSize: '0.65rem', color: c, flexShrink: 0 }}>✓</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

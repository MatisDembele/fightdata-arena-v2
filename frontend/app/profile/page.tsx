'use client'
import { useState, useEffect, useCallback, type ReactNode } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getGlobalLeaderboard, syncProfile, type GlobalLeaderboardEntry } from '@/lib/api'
import { ACHIEVEMENTS, RARITY_COLOR, RARITY_LABEL, RARITIES, type Rarity } from '@/lib/achievements'
import { useLanguage, type DictKey } from '@/lib/i18n'
import { MODE_COLORS } from '@/lib/constants'
import { useAuth } from '@/components/AuthProvider'
import DiscordIcon from '@/components/DiscordIcon'
import { getDiscordAvatarUrl } from '@/lib/auth'
import { getDiscordOAuthUrl } from '@/lib/auth'
import type { QuizQuestion } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface SessionRecord {
  date: string; mode: string; score: number; total: number
  accuracy: number; maxCombo: number; fighter?: string
}
interface LifetimeStats {
  questions: number; totalCorrect: number
  punishCorrect?: number; fightersPlayed?: string[]; fighterCorrect?: Record<string, number>
}
interface ModeStats { bestScore: number; bestAccuracy: number; totalGames: number }
interface FighterEntry { slug: string; stats: ModeStats }
interface MistakeEntry { question: QuizQuestion; mode: string; count: number; lastSeen: string }

type ProfileTab = 'stats' | 'achievements' | 'history' | 'fighters' | 'mistakes'

const QUIZ_MODES = [
  'random','fighter','input','punish','hardcore','survival',
  'damage','onblock','onhit','recovery','custom','mistakes','flash',
]
const MODE_LABEL: Record<string, string> = {
  random:'STARTUP', allrandom:'RANDOM', fighter:'FIGHTER', input:'INPUT', punish:'PUNISH',
  hardcore:'HARDCORE', survival:'SURVIVAL', damage:'DAMAGE', onblock:'ON BLOCK', onhit:'ON HIT',
  recovery:'RECOVERY', custom:'CUSTOM', mistakes:'ERROR BANK', flash:'FLASH',
}
const HIGHSCORE_MODES = new Set(['survival', 'flash'])

function avatarColor(p: string): string {
  const pal = ['#ff2d78','#00f0ff','#9b1fff','#ffe000','#4ade80','#f59e0b','#00b4d8','#c77dff','#ff6a00','#14b8a6','#f43f5e']
  return pal[p.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % pal.length]
}

function timeAgo(iso: string, t: (key: DictKey, vars?: Record<string, string | number>) => string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86400000)
  const h = Math.floor(diff / 3600000)
  const m = Math.floor(diff / 60000)
  if (d > 0) return t('profile.time_days',  { n: d })
  if (h > 0) return t('profile.time_hours', { n: h })
  if (m > 0) return t('profile.time_mins',  { n: m })
  return t('profile.time_now')
}

function todayStr() { return new Date().toISOString().split('T')[0] }
function yesterdayStr() {
  const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isDesktop
}

export default function ProfilePage() {
  const { t } = useLanguage()
  const isDesktop = useIsDesktop()
  const { user, token, isLoading: authLoading } = useAuth()

  const [pseudo,        setPseudo]        = useState('')
  const [editPseudo,    setEditPseudo]    = useState('')
  const [editing,       setEditing]       = useState(false)
  const [lifetime,      setLifetime]      = useState<LifetimeStats>({ questions: 0, totalCorrect: 0 })
  const [dailyStreak,   setDailyStreak]   = useState<{ streak: number; last_played: string } | null>(null)
  const [history,       setHistory]       = useState<SessionRecord[]>([])
  const [achievements,  setAchievements]  = useState<Record<string, number>>({})
  const [mistakes,      setMistakes]      = useState<Record<string, MistakeEntry>>({})
  const [mistakesCount, setMistakesCount] = useState(0)
  const [modeBests,     setModeBests]     = useState<Record<string, ModeStats | null>>({})
  const [fighters,      setFighters]      = useState<FighterEntry[]>([])
  const [globalLb,      setGlobalLb]      = useState<GlobalLeaderboardEntry[]>([])
  const [globalRank,    setGlobalRank]    = useState<number | null>(null)
  const [loaded,        setLoaded]        = useState(false)
  const [activeTab,     setActiveTab]     = useState<ProfileTab>('stats')
  const [mistakeSortBy, setMistakeSortBy] = useState<'count' | 'recent'>('count')
  const [clearConfirm,  setClearConfirm]  = useState(false)

  useEffect(() => {
    if (authLoading) return

    const p = localStorage.getItem('fda_pseudo') || ''
    setPseudo(p); setEditPseudo(p)

    setLifetime(JSON.parse(localStorage.getItem('fda_lifetime') || '{"questions":0,"totalCorrect":0}'))

    const st = localStorage.getItem('fda_daily_streak')
    setDailyStreak(st ? JSON.parse(st) : null)

    setHistory(JSON.parse(localStorage.getItem('fda_history') || '[]'))
    setAchievements(JSON.parse(localStorage.getItem('fda_achievements') || '{}'))

    const bank: Record<string, MistakeEntry> = JSON.parse(localStorage.getItem('fda_mistakes') || '{}')
    setMistakes(bank)
    setMistakesCount(Object.keys(bank).length)

    const bests: Record<string, ModeStats | null> = {}
    for (const m of QUIZ_MODES) {
      const key = m === 'custom' ? 'fda_best_custom' : `fda_best_${m}`
      const raw = localStorage.getItem(key)
      bests[m] = raw ? JSON.parse(raw) : null
    }
    const sv = localStorage.getItem('fda_survival_best')
    if (sv) { const d = JSON.parse(sv); bests['survival'] = { bestScore: d.best, bestAccuracy: 0, totalGames: d.totalGames } }
    const fl = localStorage.getItem('fda_flash_best')
    if (fl) { const d = JSON.parse(fl); bests['flash'] = { bestScore: d.best, bestAccuracy: 0, totalGames: d.totalGames ?? 0 } }
    setModeBests(bests)

    const list: FighterEntry[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith('fda_best_fighter_')) {
        const raw = localStorage.getItem(k)
        if (raw) list.push({ slug: k.replace('fda_best_fighter_', ''), stats: JSON.parse(raw) })
      }
    }
    setFighters(list.sort((a, b) => b.stats.bestAccuracy - a.stats.bestAccuracy))
    setLoaded(true)

    getGlobalLeaderboard().then(lb => {
      setGlobalLb(lb)
      if (p) setGlobalRank(lb.find(e => e.player_name.toLowerCase() === p.toLowerCase())?.rank ?? null)
    }).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading])

  const savePseudo = () => {
    const v = editPseudo.trim().slice(0, 20)
    localStorage.setItem('fda_pseudo', v); setPseudo(v); setEditing(false)
  }

  const syncNow = useCallback(async () => {
    if (!token) return
    await syncProfile(token)
  }, [token])

  function removeMistake(key: string) {
    const updated = { ...mistakes }
    delete updated[key]
    setMistakes(updated)
    setMistakesCount(Object.keys(updated).length)
    localStorage.setItem('fda_mistakes', JSON.stringify(updated))
  }

  function clearAllMistakes() {
    setMistakes({})
    setMistakesCount(0)
    localStorage.removeItem('fda_mistakes')
    setClearConfirm(false)
  }

  const lifetimeAcc   = lifetime.questions > 0 ? Math.round((lifetime.totalCorrect / lifetime.questions) * 100) : 0
  const unlockedCount = Object.keys(achievements).length
  const color         = pseudo ? avatarColor(pseudo) : '#888'
  const discordAvatar = user ? getDiscordAvatarUrl(user, 128) : null
  const streakActive  = dailyStreak && (dailyStreak.last_played === todayStr() || dailyStreak.last_played === yesterdayStr())
  const streak        = streakActive ? dailyStreak!.streak : 0
  const percentileRank = globalRank && globalLb.length > 0
    ? Math.ceil((globalRank / globalLb.length) * 100)
    : null
  const lastMode = history[0]?.mode

  const mistakeEntries = Object.entries(mistakes)
    .map(([key, v]) => ({ key, ...v }))
    .sort(mistakeSortBy === 'count'
      ? (a, b) => b.count - a.count
      : (a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
    )

  if (!loaded) return (
    <>
      <Navbar />
      <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)' }}>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.3)', letterSpacing: '4px', fontSize: '0.7rem' }}>{t('play.loading')}</div>
      </main>
    </>
  )

  const TABS: { id: ProfileTab; label: string; badge?: number }[] = [
    { id: 'stats',        label: 'STATS' },
    { id: 'achievements', label: t('stats.achievements'),  badge: unlockedCount || undefined },
    { id: 'history',      label: t('profile.history'),    badge: history.length || undefined },
    { id: 'fighters',     label: 'FIGHTERS',              badge: fighters.length || undefined },
    { id: 'mistakes',     label: t('profile.error_bank'), badge: mistakesCount || undefined },
  ]

  return (
    <>
      <Navbar />
      <main style={{ padding: isDesktop ? '32px 48px 80px' : '24px 16px 80px', minHeight: 'calc(100vh - 60px)' }}>
        <div style={{ maxWidth: isDesktop ? '1160px' : '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* ── HERO ── */}
          <div style={{
            background: `linear-gradient(135deg, ${color}08 0%, transparent 60%)`,
            border: `1px solid ${color}22`,
            padding: isDesktop ? '28px 32px 20px' : '20px 18px 16px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${color}, transparent)` }} />

            <div style={{ display: 'flex', gap: isDesktop ? '24px' : '16px', alignItems: 'flex-start' }}>

              {/* Avatar */}
              <div style={{
                width: isDesktop ? '96px' : '72px', height: isDesktop ? '96px' : '72px', flexShrink: 0,
                background: discordAvatar ? 'transparent' : `${color}18`,
                border: `2px solid ${discordAvatar ? '#5865F2' : color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                overflow: 'hidden',
              }}>
                {discordAvatar ? (
                  <img
                    src={discordAvatar}
                    alt={pseudo || 'avatar'}
                    width={isDesktop ? 96 : 72}
                    height={isDesktop ? 96 : 72}
                    style={{ display: 'block', objectFit: 'cover' }}
                    onError={e => {
                      // Fallback to initials if image fails to load
                      (e.currentTarget as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: isDesktop ? '2.6rem' : '2rem', color, textShadow: `0 0 14px ${color}88` }}>
                    {pseudo ? pseudo.slice(0, 2).toUpperCase() : '??'}
                  </span>
                )}
                {user && (
                  <div style={{
                    position: 'absolute', bottom: '-10px', left: '50%', transform: 'translateX(-50%)',
                    background: '#5865F2', padding: '2px 7px', display: 'flex', alignItems: 'center', gap: '3px',
                  }}>
                    <DiscordIcon size={8} />
                  </div>
                )}
              </div>

              {/* Identity */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {editing ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input value={editPseudo} onChange={e => setEditPseudo(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && savePseudo()} maxLength={20} autoFocus
                      style={{ flex: 1, padding: '8px 12px', background: 'rgba(255,255,255,0.07)', border: `1px solid ${color}55`, color: '#fff', outline: 'none', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', letterSpacing: '4px' }} />
                    <button onClick={savePseudo} style={{ padding: '8px 16px', background: color, border: 'none', color: '#000', cursor: 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.8rem', letterSpacing: '2px' }}>{t('profile.save')}</button>
                    <button onClick={() => setEditing(false)} style={{ padding: '8px 12px', background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)' }}>✕</button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.8rem,5vw,3rem)', letterSpacing: '6px', color: '#fff', textShadow: `0 0 14px ${color}44`, lineHeight: 1 }}>
                        {pseudo || '—'}
                      </div>
                      <button onClick={() => setEditing(true)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '4px 10px', fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)' }}>
                        {t('profile.edit')}
                      </button>
                    </div>

                    {/* Mini stats */}
                    <div style={{ display: 'flex', gap: isDesktop ? '18px' : '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                      {lifetime.questions > 0 && <MiniStat val={lifetime.questions.toLocaleString()} label={t('profile.questions_label')} color={color} />}
                      {lifetime.questions > 0 && <MiniStat val={`${lifetimeAcc}%`} label={t('stats.accuracy')} color={color} />}
                      {streak > 0 && <MiniStat val={`${streak}${streak >= 2 ? '🔥' : ''}`} label={t('profile.streak_label')} color={color} />}
                      {globalRank && <MiniStat val={`#${globalRank}`} label="GLOBAL" color="#ffd700" />}
                      {percentileRank && percentileRank <= 25 && <MiniStat val={`TOP ${percentileRank}%`} label="PERCENTILE" color="#ffd700" />}
                    </div>

                    {/* Quick actions */}
                    {(lastMode || mistakesCount > 0) && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
                        {lastMode && (
                          <Link href={`/quiz/play?mode=${lastMode}`} style={{
                            padding: '6px 14px', background: `${color}15`, border: `1px solid ${color}55`,
                            color, fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)',
                            textDecoration: 'none',
                          }}>
                            ▶ {MODE_LABEL[lastMode] || lastMode.toUpperCase()}
                          </Link>
                        )}
                        {mistakesCount > 0 && (
                          <Link href="/quiz/play?mode=mistakes" style={{
                            padding: '6px 14px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.4)',
                            color: '#f43f5e', fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)',
                            textDecoration: 'none',
                          }}>
                            ⚠ {mistakesCount} {t('profile.mistakes_label')}
                          </Link>
                        )}
                      </div>
                    )}
                    {!pseudo && <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: '1px', color: 'rgba(255,255,255,0.25)', marginTop: '8px', lineHeight: 1.5 }}>{t('profile.no_pseudo')}</div>}
                  </>
                )}
              </div>
            </div>

            {/* Discord strip */}
            <div style={{ marginTop: '18px', borderTop: `1px solid ${color}12`, paddingTop: '14px' }}>
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <DiscordIcon size={12} />
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)', color: 'rgba(255,255,255,0.6)', flex: 1 }}>{user.username}</span>
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-3)', color: 'rgba(88,101,242,0.6)' }}>CLOUD BACKUP ACTIVE</span>
                  <button onClick={syncNow} style={{ background: 'rgba(88,101,242,0.15)', border: '1px solid rgba(88,101,242,0.5)', color: '#5865F2', cursor: 'pointer', fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-2)', padding: '3px 8px', transition: 'all 0.15s' }}>SYNC</button>
                </div>
              ) : (
                <a href={getDiscordOAuthUrl()} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                  <DiscordIcon size={12} />
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)', color: 'rgba(255,255,255,0.28)', flex: 1 }}>CONNECT DISCORD — BACKUP YOUR PROGRESS TO THE CLOUD</span>
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-2)', color: '#5865F2' }}>CONNECT →</span>
                </a>
              )}
            </div>
          </div>

          {/* ── TABS ── */}
          <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid rgba(255,255,255,0.07)', overflowX: 'auto' }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.id
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: isDesktop ? '10px 22px' : '8px 14px',
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: isDesktop ? 'var(--fs-xs)' : 'var(--fs-xs)', letterSpacing: 'var(--ls-3)',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.3)',
                  position: 'relative', whiteSpace: 'nowrap', transition: 'color 0.15s',
                }}>
                  {tab.label}
                  {tab.badge !== undefined && (
                    <span style={{ marginLeft: '6px', fontSize: 'var(--fs-2xs)', color: isActive ? color : 'rgba(255,255,255,0.2)' }}>
                      {tab.badge}
                    </span>
                  )}
                  {isActive && (
                    <div style={{ position: 'absolute', bottom: '-1px', left: 0, right: 0, height: '2px', background: color, boxShadow: `0 0 8px ${color}` }} />
                  )}
                </button>
              )
            })}
          </div>

          {/* ── TAB: STATS ── */}
          {activeTab === 'stats' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: isDesktop ? '28px' : '24px' }}>

              {/* Lifetime */}
              <Section title={t('profile.lifetime')} color={color} isDesktop={isDesktop}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '1px', background: 'rgba(255,255,255,0.05)' }}>
                  {[
                    { val: lifetime.questions.toLocaleString(), label: t('profile.questions_label') },
                    { val: `${lifetimeAcc}%`,                   label: t('stats.accuracy') },
                    { val: streak > 0 ? `${streak}${streak >= 2 ? ' 🔥' : ''}` : '0', label: t('profile.streak_label') },
                    { val: String(unlockedCount),                label: t('stats.achievements') },
                    { val: String(mistakesCount),                label: t('profile.mistakes_label') },
                  ].map((s, i) => (
                    <div key={i} style={{ padding: isDesktop ? '22px 16px' : '16px 12px', background: '#0d0015', textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.6rem,4vw,2.4rem)', letterSpacing: '2px', color, textShadow: `0 0 10px ${color}66` }}>{s.val}</div>
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)', color: 'rgba(255,255,255,0.28)', marginTop: '6px' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* By mode + Global LB */}
              <div style={isDesktop ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', alignItems: 'start' } : { display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <Section title={t('profile.by_mode')} color={color} isDesktop={isDesktop}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 70px 56px', gap: '8px', padding: '8px 16px', background: 'rgba(255,255,255,0.04)' }}>
                      {(['MODE', t('profile.col_best'), t('profile.col_acc'), t('profile.col_games')] as string[]).map((h, i) => (
                        <div key={i} style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)', color: 'rgba(255,255,255,0.3)', textAlign: i === 0 ? 'left' : 'center' }}>{h}</div>
                      ))}
                    </div>
                    {QUIZ_MODES.map((m, i) => {
                      const best = modeBests[m]
                      const c = MODE_COLORS[m] || '#888'
                      return (
                        <div key={m} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 70px 56px', gap: '8px', padding: isDesktop ? '10px 16px' : '9px 14px', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: isDesktop ? '0.85rem' : '0.8rem', letterSpacing: '1px', color: c }}>{MODE_LABEL[m]}</div>
                          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: isDesktop ? '0.6rem' : '0.55rem', color: best ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.15)', textAlign: 'center' }}>{best ? best.bestScore : '—'}</div>
                          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: isDesktop ? '0.6rem' : '0.55rem', color: best && !HIGHSCORE_MODES.has(m) ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.15)', textAlign: 'center' }}>{best && !HIGHSCORE_MODES.has(m) ? `${best.bestAccuracy}%` : '—'}</div>
                          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: isDesktop ? '0.6rem' : '0.55rem', color: best ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)', textAlign: 'center' }}>{best?.totalGames ?? '—'}</div>
                        </div>
                      )
                    })}
                  </div>
                </Section>

                {globalLb.length > 0 && (
                  <Section title={t('stats.global_leaderboard')} color="#ffd700" isDesktop={isDesktop}>
                    {percentileRank && (
                      <div style={{ padding: '10px 14px', background: 'rgba(255,215,0,0.05)', borderBottom: '1px solid rgba(255,215,0,0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem', color: '#ffd700', letterSpacing: '2px' }}>TOP {percentileRank}%</span>
                        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-2)', color: 'rgba(255,255,255,0.3)' }}>sur {globalLb.length} joueurs</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px' }}>
                      {globalLb.map(entry => {
                        const isMe = pseudo && entry.player_name.toLowerCase() === pseudo.toLowerCase()
                        const acc  = entry.total_questions > 0 ? Math.round(entry.total_correct / entry.total_questions * 100) : 0
                        return (
                          <div key={entry.rank} style={{
                            display: 'grid', gridTemplateColumns: '32px 1fr 64px 44px',
                            padding: isDesktop ? '9px 14px' : '7px 12px', alignItems: 'center', gap: '10px',
                            background: isMe ? 'rgba(255,215,0,0.08)' : entry.rank <= 3 ? 'rgba(255,255,255,0.03)' : 'transparent',
                            border: `1px solid ${isMe ? '#ffd70044' : 'rgba(255,255,255,0.05)'}`,
                          }}>
                            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', color: entry.rank === 1 ? '#ffd700' : entry.rank === 2 ? '#c0c0c0' : entry.rank === 3 ? '#cd7f32' : 'rgba(255,255,255,0.3)' }}>#{entry.rank}</span>
                            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: isDesktop ? '0.7rem' : '0.65rem', letterSpacing: '1px', color: isMe ? '#ffd700' : 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.player_name}</span>
                            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1rem', color: isMe ? '#ffd700' : 'rgba(255,255,255,0.5)', textAlign: 'right' }}>{entry.total_correct}</span>
                            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', color: 'rgba(255,255,255,0.3)', textAlign: 'right' }}>{acc}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </Section>
                )}
              </div>

              {/* Delete account */}
              {user && token && (
                <DeleteAccountSection token={token} onDeleted={() => { window.location.href = '/' }} />
              )}
            </div>
          )}

          {/* ── TAB: ACHIEVEMENTS ── */}
          {activeTab === 'achievements' && (
            <Section title={`${t('stats.achievements')} — ${t('stats.achievements_progress', { n: unlockedCount, total: ACHIEVEMENTS.length })}`} color="#f59e0b" isDesktop={isDesktop}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {RARITIES.map(rarity => {
                  const group = ACHIEVEMENTS.filter(a => a.rarity === rarity)
                  const count = group.filter(a => !!achievements[a.id]).length
                  const rc = RARITY_COLOR[rarity as Rarity]
                  return (
                    <div key={rarity}>
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color: rc, marginBottom: '10px', borderBottom: `1px solid ${rc}22`, paddingBottom: '7px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{RARITY_LABEL[rarity as Rarity]}</span>
                        <span style={{ color: `${rc}88` }}>{count}/{group.length}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isDesktop ? '240px' : '200px'}, 1fr))`, gap: isDesktop ? '8px' : '6px' }}>
                        {group.map(a => {
                          const isUnlocked = !!achievements[a.id]
                          return (
                            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: isDesktop ? '12px 14px' : '10px 12px', background: isUnlocked ? `${rc}0d` : 'rgba(255,255,255,0.02)', border: `1px solid ${isUnlocked ? rc + '33' : 'rgba(255,255,255,0.05)'}`, opacity: isUnlocked ? 1 : 0.4 }}>
                              <div style={{ fontSize: isDesktop ? '1.3rem' : '1.1rem', lineHeight: 1, flexShrink: 0, filter: isUnlocked ? 'none' : 'grayscale(1)' }}>{a.icon}</div>
                              <div>
                                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: isDesktop ? '0.78rem' : '0.7rem', letterSpacing: '1px', color: isUnlocked ? rc : 'rgba(255,255,255,0.3)' }}>{a.name}</div>
                                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.28)', marginTop: '3px', lineHeight: 1.4 }}>{a.desc}</div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Section>
          )}

          {/* ── TAB: HISTORY ── */}
          {activeTab === 'history' && (
            <Section title={t('profile.history')} color={color} isDesktop={isDesktop}>
              {history.length === 0 ? (
                <div style={{ padding: '28px', textAlign: 'center', fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color: 'rgba(255,255,255,0.2)' }}>
                  {t('profile.no_history')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '100px 1fr 80px 70px 64px' : '80px 1fr 60px 60px 50px', gap: '8px', padding: isDesktop ? '9px 16px' : '7px 14px', background: 'rgba(255,255,255,0.04)' }}>
                    {(['DATE','MODE','SCORE', t('profile.col_acc'),'COMBO'] as string[]).map((h, i) => (
                      <div key={i} style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)', color: 'rgba(255,255,255,0.3)' }}>{h}</div>
                    ))}
                  </div>
                  {history.slice(0, 30).map((rec, i) => {
                    const c = MODE_COLORS[rec.mode] || '#888'
                    return (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: isDesktop ? '100px 1fr 80px 70px 64px' : '80px 1fr 60px 60px 50px', gap: '8px', padding: isDesktop ? '11px 16px' : '9px 14px', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center' }}>
                        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: '1px', color: 'rgba(255,255,255,0.3)' }}>{timeAgo(rec.date, t)}</div>
                        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: isDesktop ? '0.82rem' : '0.75rem', letterSpacing: '1px', color: c }}>
                          {MODE_LABEL[rec.mode] ?? rec.mode.toUpperCase()}{rec.fighter ? ` // ${rec.fighter.toUpperCase()}` : ''}
                        </div>
                        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: isDesktop ? '0.62rem' : '0.55rem', color: 'rgba(255,255,255,0.7)' }}>{rec.score}/{rec.total}</div>
                        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: isDesktop ? '0.62rem' : '0.55rem', color: 'rgba(255,255,255,0.5)' }}>{rec.accuracy}%</div>
                        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: isDesktop ? '0.56rem' : '0.5rem', color: 'rgba(255,255,255,0.3)' }}>{rec.maxCombo > 0 ? `${rec.maxCombo}🔥` : '—'}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Section>
          )}

          {/* ── TAB: FIGHTERS ── */}
          {activeTab === 'fighters' && (
            fighters.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color: 'rgba(255,255,255,0.2)' }}>
                JOUEZ EN MODE FIGHTER POUR VOIR VOS STATS PAR PERSONNAGE
              </div>
            ) : (
              <Section title={t('profile.fighter_heatmap')} color="#00f0ff" isDesktop={isDesktop}>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isDesktop ? '84px' : '72px'}, 1fr))`, gap: isDesktop ? '6px' : '5px' }}>
                  {fighters.map(({ slug, stats: s }) => {
                    const pct = s.bestAccuracy / 100
                    const r = Math.round(255 * (1 - pct) + 74 * pct)
                    const g = Math.round(45  * (1 - pct) + 222 * pct)
                    const b = Math.round(120 * (1 - pct) + 128 * pct)
                    const c = `rgb(${r},${g},${b})`
                    return (
                      <div key={slug} style={{ padding: isDesktop ? '10px 6px' : '8px 4px', background: `${c}18`, border: `1px solid ${c}44`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: '0.5px', color: c, textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.2 }}>{slug}</div>
                        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: isDesktop ? '1rem' : '0.9rem', letterSpacing: '1px', color: c }}>{s.bestAccuracy}%</div>
                        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', color: 'rgba(255,255,255,0.25)' }}>{s.totalGames}g</div>
                      </div>
                    )
                  })}
                </div>
              </Section>
            )
          )}

          {/* ── TAB: ERROR BANK ── */}
          {activeTab === 'mistakes' && (
            <Section
              title={`${t('profile.error_bank')} — ${mistakesCount} ${t(mistakesCount === 1 ? 'profile.mistake_saved' : 'profile.mistakes_saved')}`}
              color="#f43f5e" isDesktop={isDesktop}
            >
              {mistakesCount === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color: 'rgba(255,255,255,0.2)' }}>
                  {t('profile.bank_empty')}
                </div>
              ) : (
                <>
                  {/* Controls bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
                    <Link href="/quiz/play?mode=mistakes" style={{
                      padding: '7px 18px', background: 'linear-gradient(90deg, #be123c, #f43f5e)',
                      color: '#fff', fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.85rem', letterSpacing: '3px', textDecoration: 'none',
                    }}>
                      {t('profile.mistakes_play')}
                    </Link>
                    <div style={{ flex: 1 }} />
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {(['count', 'recent'] as const).map(s => (
                        <button key={s} onClick={() => setMistakeSortBy(s)} style={{
                          background: mistakeSortBy === s ? 'rgba(244,63,94,0.18)' : 'none',
                          border: `1px solid ${mistakeSortBy === s ? '#f43f5e' : 'rgba(255,255,255,0.1)'}`,
                          color: mistakeSortBy === s ? '#f43f5e' : 'rgba(255,255,255,0.3)',
                          cursor: 'pointer', padding: '4px 10px',
                          fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-2)',
                        }}>
                          {s === 'count' ? 'FRÉQUENCE' : 'RÉCENT'}
                        </button>
                      ))}
                    </div>
                    {!clearConfirm ? (
                      <button onClick={() => setClearConfirm(true)} style={{
                        background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.25)',
                        cursor: 'pointer', padding: '4px 10px',
                        fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-2)',
                      }}>TOUT EFFACER</button>
                    ) : (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={clearAllMistakes} style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid #f43f5e', color: '#f43f5e', cursor: 'pointer', padding: '4px 10px', fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-2)' }}>CONFIRMER</button>
                        <button onClick={() => setClearConfirm(false)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '4px 10px', fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-2)' }}>ANNULER</button>
                      </div>
                    )}
                  </div>

                  {/* Column headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 130px 60px 80px 32px' : '1fr 52px 60px 32px', gap: '8px', padding: '7px 16px', background: 'rgba(255,255,255,0.03)' }}>
                    {(isDesktop
                      ? ['MOVE / FIGHTER', 'MODE', '×', 'VU', '']
                      : ['MOVE / FIGHTER', '×', 'VU', '']
                    ).map((h, i) => (
                      <div key={i} style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-2)', color: 'rgba(255,255,255,0.25)' }}>{h}</div>
                    ))}
                  </div>

                  {/* Mistake rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    {mistakeEntries.map(({ key, question, mode: modeKey, count, lastSeen }) => {
                      const mc = MODE_COLORS[modeKey] || '#888'
                      const countColor = count >= 4 ? '#f43f5e' : count >= 2 ? '#f59e0b' : 'rgba(255,255,255,0.45)'
                      return (
                        <div key={key} style={{
                          display: 'grid',
                          gridTemplateColumns: isDesktop ? '1fr 130px 60px 80px 32px' : '1fr 52px 60px 32px',
                          gap: '8px', padding: isDesktop ? '11px 16px' : '10px 12px', alignItems: 'center',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          background: 'rgba(244,63,94,0.02)',
                        }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: isDesktop ? '0.9rem' : '0.8rem', letterSpacing: '1px', color: '#fff', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {question.move_name}
                            </div>
                            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-1)', color: 'rgba(255,255,255,0.28)', marginTop: '3px' }}>
                              {question.fighter_slug.toUpperCase()}
                            </div>
                          </div>
                          {isDesktop && (
                            <div style={{ padding: '3px 8px', background: `${mc}15`, border: `1px solid ${mc}33`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-2)', color: mc, whiteSpace: 'nowrap' }}>
                                {MODE_LABEL[modeKey] || modeKey.toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div style={{ textAlign: 'center' }}>
                            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.2rem', color: countColor, letterSpacing: '1px' }}>×{count}</span>
                          </div>
                          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: '1px', color: 'rgba(255,255,255,0.2)', textAlign: 'center', lineHeight: 1.3 }}>
                            {timeAgo(lastSeen, t)}
                          </div>
                          <button onClick={() => removeMistake(key)} style={{
                            background: 'none', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.2)',
                            cursor: 'pointer', padding: '3px 6px', fontFamily: "'Share Tech Mono', monospace",
                            fontSize: 'var(--fs-xs)', lineHeight: 1, transition: 'all 0.15s',
                          }}>✕</button>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </Section>
          )}

        </div>
      </main>
    </>
  )
}

function MiniStat({ val, label, color }: { val: string; label: string; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', letterSpacing: '2px', color, lineHeight: 1 }}>{val}</div>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-2)', color: 'rgba(255,255,255,0.28)' }}>{label}</div>
    </div>
  )
}

function DeleteAccountSection({ token, onDeleted }: { token: string; onDeleted: () => void }) {
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      await fetch(`${API_URL}/api/auth/me`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const keysToRemove = Object.keys(localStorage).filter(k => k.startsWith('fda_'))
      keysToRemove.forEach(k => localStorage.removeItem(k))
      onDeleted()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ borderTop: '1px solid rgba(255,0,0,0.1)', paddingTop: '24px' }}>
      {!confirm ? (
        <button onClick={() => setConfirm(true)} style={{ background: 'none', border: '1px solid rgba(255,50,50,0.2)', color: 'rgba(255,80,80,0.5)', cursor: 'pointer', padding: '8px 16px', fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', transition: 'all 0.15s' }}>
          SUPPRIMER MON COMPTE
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'rgba(255,0,0,0.05)', border: '1px solid rgba(255,50,50,0.2)' }}>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)', color: 'rgba(255,255,255,0.6)' }}>
            Cette action est irréversible. Toutes vos données cloud (succès, statistiques, historique) seront définitivement supprimées.
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleDelete} disabled={loading} style={{ background: 'rgba(255,50,50,0.15)', border: '1px solid rgba(255,50,50,0.5)', color: '#ff5050', cursor: loading ? 'default' : 'pointer', padding: '8px 16px', fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)', opacity: loading ? 0.5 : 1 }}>
              {loading ? 'SUPPRESSION...' : 'CONFIRMER LA SUPPRESSION'}
            </button>
            <button onClick={() => setConfirm(false)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '8px 16px', fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)' }}>
              ANNULER
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, color, isDesktop, children }: { title: string; color: string; isDesktop?: boolean; children: ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: isDesktop ? 'var(--fs-xs)' : 'var(--fs-xs)', letterSpacing: 'var(--ls-4)', color: 'rgba(255,255,255,0.28)', marginBottom: isDesktop ? '14px' : '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '9px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '3px', height: '14px', background: color, boxShadow: `0 0 6px ${color}` }} />
        {title}
      </div>
      <div style={{ border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}

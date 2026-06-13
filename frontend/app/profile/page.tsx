'use client'
import { useState, useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getGlobalLeaderboard } from '@/lib/api'
import { ACHIEVEMENTS, RARITY_COLOR, RARITIES, type Rarity } from '@/lib/achievements'
import { useLanguage } from '@/lib/i18n'

interface SessionRecord {
  date: string
  mode: string
  score: number
  total: number
  accuracy: number
  maxCombo: number
  fighter?: string
}

interface LifetimeStats {
  questions: number
  totalCorrect: number
  punishCorrect?: number
  fightersPlayed?: string[]
  fighterCorrect?: Record<string, number>
}

const MODE_COLOR: Record<string, string> = {
  random:   '#ff2d78',
  fighter:  '#00f0ff',
  input:    '#9b1fff',
  punish:   '#ffe000',
  hardcore: '#ff6a00',
  survival: '#4ade80',
  damage:   '#f59e0b',
  onblock:  '#00b4d8',
  custom:   '#c77dff',
  mistakes: '#f43f5e',
  duel:     '#14b8a6',
}

const QUIZ_MODES = ['random', 'fighter', 'input', 'punish', 'hardcore', 'survival', 'damage', 'onblock', 'custom', 'mistakes']
const MODE_LABEL: Record<string, string> = {
  random: 'RANDOM', fighter: 'FIGHTER', input: 'INPUT', punish: 'PUNISH', hardcore: 'HARDCORE',
  survival: 'SURVIVAL', damage: 'DAMAGE', onblock: 'ON BLOCK', custom: 'CUSTOM', mistakes: 'ERROR BANK',
}

function avatarColor(pseudo: string): string {
  const palette = ['#ff2d78','#00f0ff','#9b1fff','#ffe000','#4ade80','#f59e0b','#00b4d8','#c77dff','#ff6a00','#14b8a6','#f43f5e']
  const hash = pseudo.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return palette[hash % palette.length]
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  if (m > 0) return `${m}m ago`
  return 'just now'
}

export default function ProfilePage() {
  const { t } = useLanguage()

  const [pseudo,       setPseudo]       = useState('')
  const [editPseudo,   setEditPseudo]   = useState('')
  const [editing,      setEditing]      = useState(false)
  const [lifetime,     setLifetime]     = useState<LifetimeStats>({ questions: 0, totalCorrect: 0 })
  const [streak,       setStreak]       = useState(0)
  const [history,      setHistory]      = useState<SessionRecord[]>([])
  const [achievements, setAchievements] = useState<Record<string, string>>({})
  const [mistakesCount,setMistakesCount]= useState(0)
  const [modeBests,    setModeBests]    = useState<Record<string, { bestScore: number; bestAccuracy: number; totalGames: number } | null>>({})
  const [globalRank,   setGlobalRank]   = useState<number | null>(null)
  const [loaded,       setLoaded]       = useState(false)

  useEffect(() => {
    const p = localStorage.getItem('fda_pseudo') || ''
    setPseudo(p)
    setEditPseudo(p)

    const lt: LifetimeStats = JSON.parse(localStorage.getItem('fda_lifetime') || '{"questions":0,"totalCorrect":0}')
    setLifetime(lt)

    const st = JSON.parse(localStorage.getItem('fda_daily_streak') || '{"streak":0}')
    setStreak(st.streak ?? 0)

    const hist: SessionRecord[] = JSON.parse(localStorage.getItem('fda_history') || '[]')
    setHistory(hist)

    const ach: Record<string, string> = JSON.parse(localStorage.getItem('fda_achievements') || '{}')
    setAchievements(ach)

    const bank = JSON.parse(localStorage.getItem('fda_mistakes') || '{}')
    setMistakesCount(Object.keys(bank).length)

    const bests: Record<string, { bestScore: number; bestAccuracy: number; totalGames: number } | null> = {}
    for (const m of QUIZ_MODES) {
      const key = m === 'custom' ? 'fda_best_custom' : `fda_best_${m}`
      const raw = localStorage.getItem(key)
      bests[m] = raw ? JSON.parse(raw) : null
    }
    const survRaw = localStorage.getItem('fda_survival_best')
    if (survRaw) {
      const sv = JSON.parse(survRaw)
      bests['survival'] = { bestScore: sv.best, bestAccuracy: 0, totalGames: sv.totalGames }
    }
    setModeBests(bests)

    setLoaded(true)

    if (p) {
      getGlobalLeaderboard()
        .then(lb => {
          const entry = lb.find(e => e.player_name.toLowerCase() === p.toLowerCase())
          setGlobalRank(entry?.rank ?? null)
        })
        .catch(() => {})
    }
  }, [])

  const savePseudo = () => {
    const trimmed = editPseudo.trim().slice(0, 20)
    localStorage.setItem('fda_pseudo', trimmed)
    setPseudo(trimmed)
    setEditing(false)
  }

  const lifetimeAcc = lifetime.questions > 0
    ? Math.round((lifetime.totalCorrect / lifetime.questions) * 100)
    : 0

  const unlockedCount = Object.keys(achievements).length
  const color = pseudo ? avatarColor(pseudo) : '#888'

  if (!loaded) return (
    <>
      <Navbar />
      <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)' }}>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.3)', letterSpacing: '4px', fontSize: '0.7rem' }}>LOADING...</div>
      </main>
    </>
  )

  return (
    <>
      <Navbar />
      <main style={{ padding: '32px 16px 80px', minHeight: 'calc(100vh - 60px)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* ── HEADER ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ width: '72px', height: '72px', flexShrink: 0, background: `${color}22`, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', letterSpacing: '2px', color, textShadow: `0 0 12px ${color}88` }}>
                {pseudo ? pseudo.slice(0, 2).toUpperCase() : '??'}
              </span>
              {globalRank && globalRank <= 10 && (
                <div style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ffd700', color: '#000', fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.6rem', letterSpacing: '1px', padding: '2px 5px' }}>
                  #{globalRank}
                </div>
              )}
            </div>

            {/* Name + edit */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {editing ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    value={editPseudo}
                    onChange={e => setEditPseudo(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && savePseudo()}
                    maxLength={20}
                    autoFocus
                    style={{ flex: 1, padding: '8px 12px', background: 'rgba(255,255,255,0.07)', border: `1px solid ${color}55`, color: '#fff', outline: 'none', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', letterSpacing: '4px' }}
                  />
                  <button onClick={savePseudo} style={{ padding: '8px 16px', background: color, border: 'none', color: '#000', cursor: 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.8rem', letterSpacing: '2px' }}>
                    SAVE
                  </button>
                  <button onClick={() => setEditing(false)} style={{ padding: '8px 12px', background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '1px' }}>
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.6rem, 5vw, 2.5rem)', letterSpacing: '6px', color: '#fff', textShadow: `0 0 14px ${color}55`, lineHeight: 1 }}>
                      {pseudo || '—'}
                    </div>
                    <button onClick={() => setEditing(true)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '4px 10px', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.45rem', letterSpacing: '2px' }}>
                      EDIT
                    </button>
                  </div>
                  {globalRank && (
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.48rem', letterSpacing: '3px', color: '#ffd700', marginTop: '6px' }}>
                      GLOBAL RANK #{globalRank}
                    </div>
                  )}
                  {!pseudo && (
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.45rem', letterSpacing: '1px', color: 'rgba(255,255,255,0.25)', marginTop: '6px', lineHeight: 1.5 }}>
                      {t('profile.no_pseudo')}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── LIFETIME STATS ── */}
          <Section title={t('profile.lifetime')} color={color}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '1px', background: 'rgba(255,255,255,0.05)' }}>
              {[
                { val: lifetime.questions.toLocaleString(), label: 'QUESTIONS' },
                { val: `${lifetimeAcc}%`,                  label: 'ACCURACY' },
                { val: String(streak),                     label: 'DAY STREAK' },
                { val: String(unlockedCount),               label: 'ACHIEVEMENTS' },
                { val: String(mistakesCount),               label: 'MISTAKES' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '16px 12px', background: '#0d0015', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.4rem, 4vw, 2rem)', letterSpacing: '2px', color, textShadow: `0 0 10px ${color}66` }}>
                    {s.val}
                  </div>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.42rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.28)', marginTop: '4px' }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── ERROR BANK ── */}
          <Section title={t('profile.error_bank')} color="#f43f5e">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 18px', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.8rem', letterSpacing: '3px', color: '#f43f5e', textShadow: '0 0 12px rgba(244,63,94,0.5)' }}>
                  {mistakesCount}
                </div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.45rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                  {mistakesCount === 1 ? 'MISTAKE SAVED' : 'MISTAKES SAVED'}
                </div>
              </div>
              {mistakesCount > 0 ? (
                <Link href="/quiz/play?mode=mistakes" style={{ padding: '10px 20px', background: 'linear-gradient(90deg, #be123c, #f43f5e)', border: 'none', color: '#fff', fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.85rem', letterSpacing: '3px', textDecoration: 'none', display: 'inline-block' }}>
                  {t('profile.mistakes_play')}
                </Link>
              ) : (
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.45rem', letterSpacing: '1px', color: 'rgba(255,255,255,0.2)' }}>
                  Play any mode to fill your bank
                </div>
              )}
            </div>
          </Section>

          {/* ── BY MODE ── */}
          <Section title={t('profile.by_mode')} color={color}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 50px', gap: '8px', padding: '7px 14px', background: 'rgba(255,255,255,0.04)' }}>
                {['MODE', 'BEST', 'ACC', 'GAMES'].map(h => (
                  <div key={h} style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.4rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.25)', textAlign: h === 'MODE' ? 'left' : 'center' }}>{h}</div>
                ))}
              </div>
              {QUIZ_MODES.map((m, i) => {
                const best = modeBests[m]
                const c = MODE_COLOR[m] || '#888'
                return (
                  <div key={m} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 50px', gap: '8px', padding: '9px 14px', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.8rem', letterSpacing: '1px', color: c }}>{MODE_LABEL[m]}</div>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: best ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.15)', textAlign: 'center' }}>
                      {best ? (m === 'survival' ? best.bestScore : `${best.bestScore}`) : '—'}
                    </div>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: best && m !== 'survival' ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.15)', textAlign: 'center' }}>
                      {best && m !== 'survival' ? `${best.bestAccuracy}%` : '—'}
                    </div>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: best ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)', textAlign: 'center' }}>
                      {best?.totalGames ?? '—'}
                    </div>
                  </div>
                )
              })}
            </div>
          </Section>

          {/* ── RECENT SESSIONS ── */}
          <Section title={t('profile.history')} color={color}>
            {history.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.52rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.2)' }}>
                {t('profile.no_history')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px 60px 50px', gap: '8px', padding: '7px 14px', background: 'rgba(255,255,255,0.04)' }}>
                  {['DATE', 'MODE', 'SCORE', 'ACC', 'COMBO'].map(h => (
                    <div key={h} style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.4rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.25)' }}>{h}</div>
                  ))}
                </div>
                {history.slice(0, 20).map((rec, i) => {
                  const c = MODE_COLOR[rec.mode] || '#888'
                  return (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px 60px 50px', gap: '8px', padding: '9px 14px', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center' }}>
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.42rem', letterSpacing: '1px', color: 'rgba(255,255,255,0.3)' }}>
                        {timeAgo(rec.date)}
                      </div>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.75rem', letterSpacing: '1px', color: c }}>
                        {MODE_LABEL[rec.mode] ?? rec.mode.toUpperCase()}
                        {rec.fighter ? ` // ${rec.fighter.toUpperCase()}` : ''}
                      </div>
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: 'rgba(255,255,255,0.65)' }}>
                        {rec.score}/{rec.total}
                      </div>
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)' }}>
                        {rec.accuracy}%
                      </div>
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)' }}>
                        {rec.maxCombo > 0 ? `${rec.maxCombo}🔥` : '—'}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Section>

          {/* ── ACHIEVEMENTS ── */}
          <Section title={t('stats.achievements')} color={color}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.45rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.25)', marginBottom: '14px', padding: '0 2px' }}>
              {t('stats.achievements_progress', { n: unlockedCount, total: ACHIEVEMENTS.length })}
            </div>
            {RARITIES.map(rarity => {
              const group = ACHIEVEMENTS.filter(a => a.rarity === rarity)
              return (
                <div key={rarity} style={{ marginBottom: '16px' }}>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.42rem', letterSpacing: '3px', color: RARITY_COLOR[rarity as Rarity], marginBottom: '8px', borderBottom: `1px solid ${RARITY_COLOR[rarity as Rarity]}22`, paddingBottom: '6px' }}>
                    {rarity.toUpperCase()}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '6px' }}>
                    {group.map(a => {
                      const unlocked = !!achievements[a.id]
                      return (
                        <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: unlocked ? `${RARITY_COLOR[a.rarity]}0d` : 'rgba(255,255,255,0.02)', border: `1px solid ${unlocked ? RARITY_COLOR[a.rarity] + '33' : 'rgba(255,255,255,0.05)'}`, opacity: unlocked ? 1 : 0.4 }}>
                          <div style={{ fontSize: '1.1rem', lineHeight: 1, flexShrink: 0, filter: unlocked ? 'none' : 'grayscale(1)' }}>{a.icon}</div>
                          <div>
                            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.7rem', letterSpacing: '1px', color: unlocked ? RARITY_COLOR[a.rarity] : 'rgba(255,255,255,0.3)' }}>
                              {a.name}
                            </div>
                            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.38rem', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.25)', marginTop: '2px', lineHeight: 1.3 }}>
                              {a.desc}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </Section>

        </div>
      </main>
    </>
  )
}

function Section({ title, color, children }: { title: string; color: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.5rem', letterSpacing: '5px', color: 'rgba(255,255,255,0.25)', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '3px', height: '12px', background: color, boxShadow: `0 0 6px ${color}` }} />
        {title}
      </div>
      {children}
    </div>
  )
}

'use client'
export const dynamic = 'force-static'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Container from '@/components/Container'
import PageHeader from '@/components/PageHeader'
import FighterCards from '@/components/FighterCards'
import Icon, { type IconName } from '@/components/Icon'
import { getFighters } from '@/lib/api'
import type { Fighter } from '@/types'
import { useLanguage, type DictKey } from '@/lib/i18n'

type StatId = 'startup' | 'onblock' | 'onhit' | 'recovery' | 'damage' | 'active' | 'punish'
type VariantId = 'classic' | 'survival' | 'hardcore' | 'input' | 'fighter' | 'custom'

// id doubles as the Icon name and the i18n description key (quiz.stat_<id>_desc)
const STATS: {
  id: StatId; label: string
  color: string; colorAlt: string
  classicMode: string
}[] = [
  { id: 'startup',  label: 'STARTUP',  color: '#c77dff', colorAlt: '#7b2fff', classicMode: 'random'   },
  { id: 'onblock',  label: 'ON BLOCK', color: '#00b4d8', colorAlt: '#0077b6', classicMode: 'onblock'  },
  { id: 'onhit',    label: 'ON HIT',   color: '#f97316', colorAlt: '#ea580c', classicMode: 'onhit'    },
  { id: 'recovery', label: 'RECOVERY', color: '#3b82f6', colorAlt: '#1d4ed8', classicMode: 'recovery' },
  { id: 'damage',   label: 'DAMAGE',   color: '#f59e0b', colorAlt: '#d97706', classicMode: 'damage'   },
  { id: 'active',   label: 'ACTIVE',   color: '#a855f7', colorAlt: '#7c3aed', classicMode: 'active'   },
  { id: 'punish',   label: 'PUNISH',   color: '#ffe000', colorAlt: '#e0a000', classicMode: 'punish'   },
]

// id doubles as the Icon name and the i18n sub key (quiz.var_<id>_sub)
const VARIANTS: { id: VariantId; label: string; color: string }[] = [
  { id: 'fighter',  label: 'FIGHTER',  color: '#00f0ff' },
  { id: 'classic',  label: 'CLASSIC',  color: '#e2e8f0' },
  { id: 'survival', label: 'SURVIVAL', color: '#4ade80' },
  { id: 'hardcore', label: 'HARDCORE', color: '#ff6a00' },
  { id: 'input',    label: 'INPUT',    color: '#9b1fff' },
  { id: 'custom',   label: 'CUSTOM',   color: '#22c55e' },
]

// id doubles as the Icon name and the i18n sub key (quiz.sp_<id>_sub)
const SPECIAL: { id: IconName; label: string; color: string; href: string }[] = [
  { id: 'flash',    label: 'FLASH',    color: '#e879f9', href: '/quiz/flash'               },
  { id: 'punish',   label: 'PUNISH',   color: '#ffe000', href: '/quiz/play?mode=punish'    },
  { id: 'random',   label: 'RANDOM',   color: '#ff2d78', href: '/quiz/play?mode=allrandom' },
  { id: 'duel',     label: 'DUEL',     color: '#14b8a6', href: '/quiz/duel'                },
  { id: 'mistakes', label: 'MISTAKES', color: '#f43f5e', href: '/quiz/play?mode=mistakes'  },
]

// Numbered step header: "① Pick a stat" — badge state drives the visual.
function StepLabel({ n, text, color, state, chip }: {
  n: string; text: string; color: string
  state: 'done' | 'active' | 'locked'; chip?: string
}) {
  const badgeBg     = state === 'done' ? color : state === 'active' ? `${color}22` : 'rgba(255,255,255,0.6)'
  const badgeBorder = state === 'locked' ? 'rgba(255,255,255,0.18)' : color
  const badgeColor  = state === 'done' ? '#0a0010' : state === 'locked' ? 'rgba(255,255,255,0.5)' : color
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{
        width: '26px', height: '26px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: badgeBg, border: `1px solid ${badgeBorder}`,
        fontFamily: "'Bebas Neue', sans-serif", fontSize: '1rem', color: badgeColor,
        boxShadow: state === 'active' ? `0 0 12px ${color}55` : 'none', transition: 'all 0.3s',
      }}>{state === 'done' ? '✓' : n}</span>
      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', letterSpacing: '3px', color: state === 'locked' ? 'rgba(255,255,255,0.7)' : '#fff' }}>{text}</span>
      {chip && <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: '1px', color, padding: '3px 9px', border: `1px solid ${color}66`, background: `${color}18` }}>{chip}</span>}
    </div>
  )
}

export default function QuizSelectPage() {
  const router = useRouter()
  const { t } = useLanguage()

  const [activeStat, setActiveStat]     = useState<StatId | null>(null)
  const [showFighters, setShowFighters] = useState(false)
  const [showCustom, setShowCustom]     = useState(false)
  const [fighters, setFighters]         = useState<Fighter[]>([])
  const [search, setSearch]             = useState('')
  const [loadingF, setLoadingF]         = useState(false)
  const [selectedFighters, setSelectedFighters] = useState<string[]>([])

  // No stat chosen yet → the modes stay locked (greyed out) until the user picks one.
  const stat = activeStat ? STATS.find(s => s.id === activeStat)! : null
  const accentColor = stat?.color ?? '#9b1fff'

  async function openPicker(type: 'fighter' | 'custom') {
    if (fighters.length === 0) {
      setLoadingF(true)
      try { setFighters(await getFighters()) }
      finally { setLoadingF(false) }
    }
    setSearch('')
    if (type === 'fighter') { setShowFighters(true) }
    else { setSelectedFighters([]); setShowCustom(true) }
  }

  function handleVariantClick(v: VariantId) {
    if (!stat) return
    if (v === 'fighter') { openPicker('fighter'); return }
    if (v === 'custom')  { openPicker('custom');  return }
    if (v === 'classic') { router.push(`/quiz/play?mode=${stat.classicMode}`); return }
    router.push(`/quiz/play?mode=${v}&dataType=${stat.id}`)
  }

  const backBtn: React.CSSProperties = {
    background: 'none', border: '1px solid rgba(255,255,255,0.15)',
    color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
    padding: '8px 16px', fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '0.85rem', letterSpacing: '2px',
  }

  const filtered = fighters.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
  const searchInput: React.CSSProperties = {
    width: '100%', padding: '11px 18px', marginBottom: '20px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff', outline: 'none',
    fontFamily: "'Share Tech Mono', monospace", fontSize: '0.8rem', letterSpacing: '2px',
  }

  // ── Fighter picker ── (only reachable once a stat is chosen, so `stat` is non-null here)
  if (showFighters && stat) {
    return (
      <>
        <Navbar />
        <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px 60px' }}>
          <div style={{ width: '100%', maxWidth: '900px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <button onClick={() => setShowFighters(false)} style={backBtn}>{t('quiz.back')}</button>
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem', letterSpacing: '4px', color: stat.color, margin: 0, textShadow: `0 0 12px ${stat.color}` }}>
                {stat.label} • FIGHTER
              </h2>
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('quiz.search')} style={searchInput} />
            {loadingF ? (
              <div style={{ textAlign: 'center', padding: '40px', fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.7)', letterSpacing: '4px' }}>{t('quiz.loading')}</div>
            ) : (
              <FighterCards
                fighters={filtered}
                onPick={s => router.push(`/quiz/play?mode=fighter&slug=${s}&dataType=${stat.id}`)}
              />
            )}
          </div>
        </div>
      </>
    )
  }

  // ── Custom picker ── (only reachable once a stat is chosen, so `stat` is non-null here)
  if (showCustom && stat) {
    return (
      <>
        <Navbar />
        <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px 60px' }}>
          <div style={{ width: '100%', maxWidth: '900px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <button onClick={() => { setShowCustom(false); setSelectedFighters([]) }} style={backBtn}>{t('quiz.back')}</button>
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem', letterSpacing: '4px', color: stat.color, margin: 0, textShadow: `0 0 12px ${stat.color}` }}>
                {stat.label} • CUSTOM
              </h2>
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('quiz.search')} style={searchInput} />
            {loadingF ? (
              <div style={{ textAlign: 'center', padding: '40px', fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.7)', letterSpacing: '4px' }}>{t('quiz.loading')}</div>
            ) : (
              <>
                <FighterCards
                  fighters={fighters.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))}
                  selected={selectedFighters}
                  onPick={s => setSelectedFighters(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                  style={{ paddingBottom: '80px' }}
                />
                <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '14px 20px', background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  {selectedFighters.length < 2 ? (
                    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color: 'rgba(255,255,255,0.7)' }}>{t('quiz.custom_min')}</span>
                  ) : (
                    <button
                      onClick={() => router.push(`/quiz/play?mode=custom&fighters=${selectedFighters.join(',')}&dataType=${stat.id}`)}
                      style={{ padding: '13px 28px', background: 'linear-gradient(90deg, #22c55e, #4ade80)', border: 'none', cursor: 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1rem', letterSpacing: '4px', color: '#000', boxShadow: '0 0 20px #4ade8033' }}
                    >
                      {t('quiz.custom_confirm', { n: selectedFighters.length })}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </>
    )
  }

  // ── Main page ──
  return (
    <>
      <Navbar />
      <div style={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-start',
        padding: '40px 0 60px',
        overflowY: 'auto',
      }}>
        <Container variant="tool">

        {/* Header */}
        <PageHeader title={t('quiz.choose_mode')} subtitle={t('quiz.pick_stat_format')} accent={accentColor} />

        <div className="quiz-layout">

          {/* ── STEP 1 — choose a stat (highlighted until one is picked) ── */}
          <section className="quiz-area-stat" style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${stat ? 'rgba(255,255,255,0.1)' : accentColor + '66'}`,
            boxShadow: stat ? 'none' : `0 0 26px ${accentColor}22`,
            padding: '18px', transition: 'all 0.3s',
          }}>
            <StepLabel n="1" text={t('quiz.step_stat')} color={accentColor} state={stat ? 'done' : 'active'} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(98px, 1fr))', gap: '8px', marginTop: '16px' }}>
              {STATS.map(s => {
                const isSel = s.id === activeStat
                return (
                  <button key={s.id} onClick={() => setActiveStat(s.id)} aria-pressed={isSel} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px', padding: '13px 8px',
                    background: isSel ? `${s.color}22` : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isSel ? s.color : 'rgba(255,255,255,0.65)'}`,
                    boxShadow: isSel ? `0 0 16px ${s.color}44, inset 0 0 22px ${s.color}12` : 'none',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                    <Icon name={s.id} size={20} color={isSel ? s.color : 'rgba(255,255,255,0.62)'} />
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.8rem', letterSpacing: '1.5px', color: isSel ? '#fff' : 'rgba(255,255,255,0.7)', textShadow: isSel ? `0 0 8px ${s.color}` : 'none', whiteSpace: 'nowrap' }}>{s.label}</span>
                  </button>
                )
              })}
            </div>
            {stat && (
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)', color: stat.color }}>{t(`quiz.stat_${stat.id}_desc` as DictKey)}</span>
              </div>
            )}
          </section>

          {/* ── STEP 2 — choose a mode (locked until a stat is picked) ── */}
          <section className="quiz-area-mode">
            <StepLabel n="2" text={t('quiz.step_mode')} color={accentColor} state={stat ? 'active' : 'locked'} chip={stat?.label} />

            {!stat && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', marginTop: '14px', background: `${accentColor}16`, border: `1px solid ${accentColor}55` }}>
                <span style={{ fontSize: '1rem' }} aria-hidden>🔒</span>
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-1)', color: 'rgba(255,255,255,0.9)' }}>{t('quiz.pick_stat_first')}</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '14px' }}>
              {VARIANTS.map(v => {
                const locked  = !stat
                const wide    = v.id === 'fighter' || v.id === 'custom'   // full-width entry points
                const primary = v.id === 'fighter'                         // the headline choice
                const restBg  = primary ? `${v.color}10` : 'rgba(255,255,255,0.05)'
                const restBd  = primary ? `${v.color}55` : 'rgba(255,255,255,0.12)'
                const restSh  = primary ? `0 0 18px ${v.color}1f` : 'none'
                return (
                  <button
                    key={v.id} type="button" disabled={locked} aria-disabled={locked}
                    onClick={() => handleVariantClick(v.id)}
                    onMouseEnter={e => { if (locked) return; const el = e.currentTarget; el.style.background = `${v.color}14`; el.style.borderColor = v.color + '88'; el.style.boxShadow = `0 0 18px ${v.color}22` }}
                    onMouseLeave={e => { if (locked) return; const el = e.currentTarget; el.style.background = restBg; el.style.borderColor = restBd; el.style.boxShadow = restSh }}
                    style={{
                      font: 'inherit', textAlign: 'left', padding: '16px',
                      gridColumn: wide ? '1 / -1' : 'auto',
                      background: restBg, border: `1px solid ${restBd}`, boxShadow: restSh,
                      cursor: locked ? 'not-allowed' : 'pointer',
                      opacity: locked ? 0.45 : 1, filter: locked ? 'grayscale(0.8)' : 'none',
                      transition: 'all 0.18s',
                      display: 'flex', flexDirection: wide ? 'row' : 'column',
                      alignItems: wide ? 'center' : 'stretch', gap: wide ? '14px' : '7px',
                    }}
                  >
                    <Icon name={v.id} size={wide ? 28 : 22} color={v.color} />
                    <div style={{ flex: wide ? 1 : undefined, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: wide ? '1.2rem' : '1.05rem', letterSpacing: '3px', color: '#fff' }}>{v.label}</div>
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: '1px', color: 'rgba(255,255,255,0.7)' }}>{t(`quiz.var_${v.id}_sub` as DictKey)}</div>
                    </div>
                    {wide && <span aria-hidden style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.3rem', color: v.color, paddingRight: '2px' }}>→</span>}
                  </button>
                )
              })}
            </div>
          </section>

          {/* ── Special modes (independent of the stat) ── */}
          <section className="quiz-area-special">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap' }}>
                {t('quiz.special_modes')}
              </div>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px' }}>
              {SPECIAL.map(s => (
                <Link
                  key={s.id}
                  href={s.href}
                  style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '7px', padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', transition: 'all 0.18s' }}
                  onMouseEnter={e => { const el = e.currentTarget; el.style.background = `${s.color}14`; el.style.borderColor = s.color + '66'; el.style.boxShadow = `0 0 14px ${s.color}22` }}
                  onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.05)'; el.style.borderColor = 'rgba(255,255,255,0.12)'; el.style.boxShadow = 'none' }}
                >
                  <Icon name={s.id} size={20} color={s.color} />
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', letterSpacing: '2px', color: s.color }}>{s.label}</div>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.7)' }}>{t(`quiz.sp_${s.id}_sub` as DictKey)}</div>
                </Link>
              ))}
            </div>
          </section>

        </div>
        </Container>
      </div>
    </>
  )
}

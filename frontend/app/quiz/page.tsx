'use client'
export const dynamic = 'force-static'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Icon, { type IconName } from '@/components/Icon'
import { getFighters } from '@/lib/api'
import { getFighterPortrait, getFighterColor } from '@/lib/portraits'
import type { Fighter } from '@/types'
import { useLanguage, type DictKey } from '@/lib/i18n'

type StatId = 'startup' | 'onblock' | 'onhit' | 'recovery' | 'damage' | 'active'
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
]

// id doubles as the Icon name and the i18n sub key (quiz.var_<id>_sub)
const VARIANTS: { id: VariantId; label: string; color: string }[] = [
  { id: 'classic',  label: 'CLASSIC',  color: '#e2e8f0' },
  { id: 'survival', label: 'SURVIVAL', color: '#4ade80' },
  { id: 'hardcore', label: 'HARDCORE', color: '#ff6a00' },
  { id: 'input',    label: 'INPUT',    color: '#9b1fff' },
  { id: 'fighter',  label: 'FIGHTER',  color: '#00f0ff' },
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

export default function QuizSelectPage() {
  const router = useRouter()
  const { t } = useLanguage()

  const [activeStat, setActiveStat]     = useState<StatId>('startup')
  const [showFighters, setShowFighters] = useState(false)
  const [showCustom, setShowCustom]     = useState(false)
  const [fighters, setFighters]         = useState<Fighter[]>([])
  const [search, setSearch]             = useState('')
  const [loadingF, setLoadingF]         = useState(false)
  const [selectedFighters, setSelectedFighters] = useState<string[]>([])

  const stat = STATS.find(s => s.id === activeStat)!

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
    if (v === 'fighter') { openPicker('fighter'); return }
    if (v === 'custom')  { openPicker('custom');  return }
    if (v === 'classic') { router.push(`/quiz/play?mode=${stat.classicMode}`); return }
    router.push(`/quiz/play?mode=${v}&dataType=${stat.id}`)
  }

  const backBtn: React.CSSProperties = {
    background: 'none', border: '1px solid rgba(255,255,255,0.15)',
    color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
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

  // ── Fighter picker ──
  if (showFighters) {
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
              <div style={{ textAlign: 'center', padding: '40px', fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.3)', letterSpacing: '4px' }}>{t('quiz.loading')}</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '6px' }}>
                {filtered.map(fighter => {
                  const portrait = getFighterPortrait(fighter.slug)
                  const color    = getFighterColor(fighter.slug)
                  return (
                    <Link
                      key={fighter.slug}
                      href={`/quiz/play?mode=fighter&slug=${fighter.slug}&dataType=${stat.id}`}
                      style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', transition: 'all 0.15s', cursor: 'pointer' }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = color; el.style.boxShadow = `0 0 12px ${color}33`; el.style.background = `${color}12` }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.07)'; el.style.boxShadow = 'none'; el.style.background = 'rgba(255,255,255,0.03)' }}
                    >
                      <div style={{ width: '100%', height: '90px', background: `linear-gradient(180deg, ${color}28, ${color}0d)`, overflow: 'hidden' }}>
                        {portrait && <img src={portrait} alt={fighter.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />}
                      </div>
                      <div style={{ padding: '6px 4px', fontFamily: "'Rajdhani', sans-serif", fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', textAlign: 'center' }}>{fighter.name}</div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </>
    )
  }

  // ── Custom picker ──
  if (showCustom) {
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
              <div style={{ textAlign: 'center', padding: '40px', fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.3)', letterSpacing: '4px' }}>{t('quiz.loading')}</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '6px', paddingBottom: '80px' }}>
                  {fighters.filter(f => f.name.toLowerCase().includes(search.toLowerCase())).map(fighter => {
                    const portrait = getFighterPortrait(fighter.slug)
                    const color    = getFighterColor(fighter.slug)
                    const isSel    = selectedFighters.includes(fighter.slug)
                    return (
                      <button
                        key={fighter.slug}
                        type="button"
                        aria-pressed={isSel}
                        onClick={() => setSelectedFighters(prev => prev.includes(fighter.slug) ? prev.filter(s => s !== fighter.slug) : [...prev, fighter.slug])}
                        style={{ font: 'inherit', textAlign: 'inherit', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', background: isSel ? `${color}20` : 'rgba(255,255,255,0.03)', border: `1px solid ${isSel ? color : 'rgba(255,255,255,0.07)'}`, boxShadow: isSel ? `0 0 12px ${color}44` : 'none', overflow: 'hidden', transition: 'all 0.15s', cursor: 'pointer' }}
                      >
                        <div style={{ width: '100%', height: '90px', background: `linear-gradient(180deg, ${color}28, ${color}0d)`, overflow: 'hidden', position: 'relative' }}>
                          {portrait && <img src={portrait} alt={fighter.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />}
                          {isSel && <div style={{ position: 'absolute', top: '4px', right: '4px', width: '18px', height: '18px', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#000', fontWeight: 700 }}>✓</div>}
                        </div>
                        <div style={{ padding: '6px 4px', fontFamily: "'Rajdhani', sans-serif", fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: isSel ? color : 'rgba(255,255,255,0.75)', textAlign: 'center' }}>{fighter.name}</div>
                      </button>
                    )
                  })}
                </div>
                <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '14px 20px', background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  {selectedFighters.length < 2 ? (
                    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color: 'rgba(255,255,255,0.3)' }}>{t('quiz.custom_min')}</span>
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
        padding: '40px 20px 60px',
        overflowY: 'auto',
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            letterSpacing: '8px', color: '#fff', margin: 0,
            textShadow: `0 0 20px ${stat.color}`,
            transition: 'text-shadow 0.4s',
          }}>{t('quiz.choose_mode')}</h1>
          <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-sm)', letterSpacing: 'var(--ls-3)', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>
            {t('quiz.pick_stat_format')}
          </p>
        </div>

        <div style={{ width: '100%', maxWidth: '700px', display: 'flex', flexDirection: 'column' }}>

          {/* ── Stat selector ── */}
          <div style={{ display: 'flex', overflowX: 'auto', gap: '6px', paddingBottom: '4px', scrollbarWidth: 'none' as const }}>
            {STATS.map(s => {
              const isSel = s.id === activeStat
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveStat(s.id)}
                  aria-pressed={isSel}
                  style={{
                    flexShrink: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                    padding: '10px 16px',
                    background: isSel ? `${s.color}15` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isSel ? s.color + '88' : 'rgba(255,255,255,0.07)'}`,
                    borderBottom: isSel ? `2px solid ${s.color}` : '1px solid rgba(255,255,255,0.07)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    minWidth: '74px',
                    boxShadow: isSel ? `0 0 14px ${s.color}20` : 'none',
                  }}
                >
                  <Icon name={s.id} size={18} color={isSel ? s.color : 'rgba(255,255,255,0.4)'} />
                  <span style={{
                    fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.72rem', letterSpacing: '2px',
                    color: isSel ? s.color : 'rgba(255,255,255,0.45)',
                    transition: 'color 0.2s', whiteSpace: 'nowrap',
                    textShadow: isSel ? `0 0 8px ${s.color}` : 'none',
                  }}>{s.label}</span>
                </button>
              )
            })}
          </div>

          {/* ── Stat description ── */}
          <div style={{ padding: '12px 2px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '16px' }}>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)', color: stat.color, opacity: 0.85 }}>
              {t(`quiz.stat_${stat.id}_desc` as DictKey)}
            </span>
          </div>

          {/* ── Variants grid ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '6px',
            marginBottom: '32px',
          }}>
            {VARIANTS.map(v => (
              <button
                key={v.id}
                type="button"
                onClick={() => handleVariantClick(v.id)}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = `${v.color}12`
                  el.style.borderColor = v.color + '66'
                  el.style.boxShadow = `0 0 18px ${v.color}18`
                  const top = el.querySelector('.var-top') as HTMLElement | null
                  if (top) top.style.opacity = '1'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'rgba(255,255,255,0.03)'
                  el.style.borderColor = 'rgba(255,255,255,0.07)'
                  el.style.boxShadow = 'none'
                  const top = el.querySelector('.var-top') as HTMLElement | null
                  if (top) top.style.opacity = '0'
                }}
                style={{
                  font: 'inherit', textAlign: 'left',
                  padding: '18px 16px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                  display: 'flex', flexDirection: 'column', gap: '8px',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                <div className="var-top" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${v.color}, transparent)`, opacity: 0, transition: 'opacity 0.18s' }} />
                <Icon name={v.id} size={22} color={v.color} />
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.8)' }}>{v.label}</div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: '1px', color: 'rgba(255,255,255,0.45)' }}>{t(`quiz.var_${v.id}_sub` as DictKey)}</div>
              </button>
            ))}
          </div>

          {/* ── Special modes ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
              {t('quiz.special_modes')}
            </div>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '6px' }}>
            {SPECIAL.map(s => (
              <Link
                key={s.id}
                href={s.href}
                style={{
                  textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '6px',
                  padding: '14px 14px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  transition: 'all 0.18s',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = `${s.color}12`
                  el.style.borderColor = s.color + '55'
                  el.style.boxShadow = `0 0 14px ${s.color}18`
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'rgba(255,255,255,0.03)'
                  el.style.borderColor = 'rgba(255,255,255,0.07)'
                  el.style.boxShadow = 'none'
                }}
              >
                <Icon name={s.id} size={20} color={s.color} />
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.85rem', letterSpacing: '2px', color: s.color }}>{s.label}</div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.45)' }}>{t(`quiz.sp_${s.id}_sub` as DictKey)}</div>
              </Link>
            ))}
          </div>

        </div>
      </div>
    </>
  )
}

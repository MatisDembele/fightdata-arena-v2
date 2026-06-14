'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getFighters } from '@/lib/api'
import { getFighterPortrait, getFighterColor } from '@/lib/portraits'
import type { Fighter } from '@/types'
import { useLanguage } from '@/lib/i18n'

export default function QuizSelectPage() {
  const router                          = useRouter()
  const [activeId, setActiveId]         = useState('onblock')
  const [showFighters, setShowFighters] = useState(false)
  const [showCustom, setShowCustom]     = useState(false)
  const [fighters, setFighters]         = useState<Fighter[]>([])
  const [search, setSearch]             = useState('')
  const [loadingF, setLoadingF]         = useState(false)
  const [selectedFighters, setSelectedFighters] = useState<string[]>([])
  const { t } = useLanguage()

  const QUIZ_MODES = [
    // ── FRAME DATA ──
    {
      id: 'onblock',
      label: 'ON BLOCK',
      sub: t('quiz.mode_onblock_sub'),
      desc: t('quiz.mode_onblock_desc'),
      color: '#00b4d8', colorAlt: '#0077b6',
      href: '/quiz/play?mode=onblock',
      icon: '🛡️',
      category: 'data',
    },
    {
      id: 'onhit',
      label: 'ON HIT',
      sub: t('quiz.mode_onhit_sub'),
      desc: t('quiz.mode_onhit_desc'),
      color: '#f97316', colorAlt: '#ea580c',
      href: '/quiz/play?mode=onhit',
      icon: '⚡',
      category: 'data',
    },
    {
      id: 'punish',
      label: 'PUNISH FINDER',
      sub: t('quiz.mode_punish_sub'),
      desc: t('quiz.mode_punish_desc'),
      color: '#ffe000', colorAlt: '#ff6a00',
      href: '/quiz/play?mode=punish',
      icon: '🎯',
      category: 'data',
    },
    {
      id: 'recovery',
      label: 'RECOVERY',
      sub: t('quiz.mode_recovery_sub'),
      desc: t('quiz.mode_recovery_desc'),
      color: '#3b82f6', colorAlt: '#1d4ed8',
      href: '/quiz/play?mode=recovery',
      icon: '⏳',
      category: 'data',
    },
    {
      id: 'random',
      label: 'STARTUP',
      sub: t('quiz.mode_random_sub'),
      desc: t('quiz.mode_random_desc'),
      color: '#c77dff', colorAlt: '#7b2fff',
      href: '/quiz/play?mode=random',
      icon: '⏱️',
      category: 'data',
    },
    {
      id: 'damage',
      label: 'DAMAGE',
      sub: t('quiz.mode_damage_sub'),
      desc: t('quiz.mode_damage_desc'),
      color: '#f59e0b', colorAlt: '#d97706',
      href: '/quiz/play?mode=damage',
      icon: '💥',
      category: 'data',
    },
    // ── ÉTUDE ──
    {
      id: 'allrandom',
      label: 'RANDOM',
      sub: t('quiz.mode_allrandom_sub'),
      desc: t('quiz.mode_allrandom_desc'),
      color: '#ff2d78', colorAlt: '#9b1fff',
      href: '/quiz/play?mode=allrandom',
      icon: '🎲',
      category: 'study',
    },
    {
      id: 'fighter',
      label: 'FIGHTER',
      sub: t('quiz.mode_fighter_sub'),
      desc: t('quiz.mode_fighter_desc'),
      color: '#00f0ff', colorAlt: '#0050ff',
      href: null,
      icon: '🥊',
      category: 'study',
    },
    {
      id: 'custom',
      label: 'CUSTOM',
      sub: t('quiz.mode_custom_sub'),
      desc: t('quiz.mode_custom_desc'),
      color: '#4ade80', colorAlt: '#22c55e',
      href: null,
      icon: '🎨',
      category: 'study',
    },
    // ── CHALLENGE ──
    {
      id: 'flash',
      label: 'FLASH',
      sub: t('quiz.mode_flash_sub'),
      desc: t('quiz.mode_flash_desc'),
      color: '#e879f9', colorAlt: '#a855f7',
      href: '/quiz/flash',
      icon: '⚡',
      category: 'challenge',
    },
    {
      id: 'hardcore',
      label: 'HARDCORE',
      sub: t('quiz.mode_hardcore_sub'),
      desc: t('quiz.mode_hardcore_desc'),
      color: '#ff6a00', colorAlt: '#ff2d78',
      href: '/quiz/play?mode=hardcore',
      icon: '🔥',
      category: 'challenge',
    },
    {
      id: 'survival',
      label: 'SURVIVAL',
      sub: t('quiz.mode_survival_sub'),
      desc: t('quiz.mode_survival_desc'),
      color: '#4ade80', colorAlt: '#00f0ff',
      href: '/quiz/play?mode=survival',
      icon: '💀',
      category: 'challenge',
    },
    {
      id: 'input',
      label: 'INPUT',
      sub: t('quiz.mode_input_sub'),
      desc: t('quiz.mode_input_desc'),
      color: '#9b1fff', colorAlt: '#ff2d78',
      href: '/quiz/play?mode=input',
      icon: '⌨️',
      category: 'challenge',
    },
    // ── OUTILS ──
    {
      id: 'mistakes',
      label: 'ERROR BANK',
      sub: t('quiz.mode_mistakes_sub'),
      desc: t('quiz.mode_mistakes_desc'),
      color: '#f43f5e', colorAlt: '#be123c',
      href: '/quiz/play?mode=mistakes',
      icon: '🔁',
      category: 'tools',
    },
    {
      id: 'duel',
      label: 'DUEL',
      sub: t('quiz.mode_duel_sub'),
      desc: t('quiz.mode_duel_desc'),
      color: '#14b8a6', colorAlt: '#0d9488',
      href: '/quiz/duel',
      icon: '⚔️',
      category: 'tools',
    },
  ]

  type Category = { id: string; label: string; hint: string }
  const CATEGORIES: Category[] = [
    { id: 'data',      label: 'FRAME DATA',    hint: 'les données — du plus utile en match' },
    { id: 'study',     label: 'MODES D\'ÉTUDE', hint: 'cibler ton apprentissage' },
    { id: 'challenge', label: 'CHALLENGE',      hint: 'teste tes limites' },
    { id: 'tools',     label: 'OUTILS',         hint: 'entraîne tes points faibles' },
  ]

  const current = QUIZ_MODES.find(m => m.id === activeId) || QUIZ_MODES[0]

  const handleModeClick = async (mode: typeof QUIZ_MODES[0]) => {
    if (mode.id === 'fighter') {
      setShowFighters(true)
      if (fighters.length === 0) {
        setLoadingF(true)
        try { setFighters(await getFighters()) }
        finally { setLoadingF(false) }
      }
    } else if (mode.id === 'custom') {
      setShowCustom(true)
      if (fighters.length === 0) {
        setLoadingF(true)
        try { setFighters(await getFighters()) }
        finally { setLoadingF(false) }
      }
    } else if (mode.href) {
      router.push(mode.href)
    }
  }

  const filtered = fighters.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )

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

        {showCustom ? (
          <div style={{ width: '100%', maxWidth: '900px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <button onClick={() => { setShowCustom(false); setSelectedFighters([]) }} style={{
                background: 'none', border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                padding: '8px 16px', fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '0.85rem', letterSpacing: '2px',
              }}>{t('quiz.back')}</button>
              <h2 style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '1.8rem', letterSpacing: '5px', color: '#fff',
                textShadow: '0 0 16px #4ade80',
              }}>{t('quiz.select_fighters')}</h2>
            </div>

            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('quiz.search')}
              style={{
                width: '100%', padding: '11px 18px', marginBottom: '20px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', outline: 'none',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.8rem', letterSpacing: '2px',
              }}
            />

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
                      <div
                        key={fighter.slug}
                        onClick={() => setSelectedFighters(prev =>
                          prev.includes(fighter.slug) ? prev.filter(s => s !== fighter.slug) : [...prev, fighter.slug]
                        )}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                          background: isSel ? `${color}20` : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isSel ? color : 'rgba(255,255,255,0.07)'}`,
                          boxShadow: isSel ? `0 0 12px ${color}44` : 'none',
                          overflow: 'hidden', transition: 'all 0.15s', cursor: 'pointer',
                        }}
                      >
                        <div style={{ width: '100%', height: '90px', background: `linear-gradient(180deg, ${color}28, ${color}0d)`, overflow: 'hidden', position: 'relative' }}>
                          {portrait && (
                            <img src={portrait} alt={fighter.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                          )}
                          {isSel && (
                            <div style={{ position: 'absolute', top: '4px', right: '4px', width: '18px', height: '18px', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#000', fontWeight: 700 }}>✓</div>
                          )}
                        </div>
                        <div style={{ padding: '6px 4px', fontFamily: "'Rajdhani', sans-serif", fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: isSel ? color : 'rgba(255,255,255,0.75)', textAlign: 'center' }}>{fighter.name}</div>
                      </div>
                    )
                  })}
                </div>

                <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '14px 20px', background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  {selectedFighters.length < 2 ? (
                    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.3)' }}>{t('quiz.custom_min')}</span>
                  ) : (
                    <button
                      onClick={() => router.push(`/quiz/play?mode=custom&fighters=${selectedFighters.join(',')}`)}
                      style={{ padding: '13px 28px', background: 'linear-gradient(90deg, #22c55e, #4ade80)', border: 'none', cursor: 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1rem', letterSpacing: '4px', color: '#000', boxShadow: '0 0 20px #4ade8033' }}
                    >
                      {t('quiz.custom_confirm', { n: selectedFighters.length })}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

        ) : !showFighters ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h1 style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(2rem, 5vw, 3rem)',
                letterSpacing: '8px', color: '#fff',
                textShadow: `0 0 20px ${current.color}`,
                transition: 'text-shadow 0.4s',
              }}>{t('quiz.choose_mode')}</h1>
              <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', letterSpacing: '4px', color: 'rgba(255,255,255,0.25)', marginTop: '6px' }}>
                {t('quiz.subtitle', { n: QUIZ_MODES.length })}
              </p>
            </div>

            {/* Hovered mode description */}
            <div style={{ textAlign: 'center', marginBottom: '24px', minHeight: '44px', maxWidth: '520px' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.72rem', letterSpacing: '4px', color: current.color, marginBottom: '4px', transition: 'color 0.3s' }}>
                {current.label}
              </div>
              <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.92rem', fontWeight: 500, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.5px', transition: 'all 0.3s', margin: 0 }}>
                {current.desc}
              </p>
            </div>

            {/* Categorized grid */}
            <div style={{ width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {CATEGORIES.map(cat => {
                const catModes = QUIZ_MODES.filter(m => m.category === cat.id)
                return (
                  <div key={cat.id}>
                    {/* Category header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.5rem', letterSpacing: '4px', color: 'rgba(255,255,255,0.5)' }}>
                        {cat.label}
                      </div>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.38rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.2)' }}>
                        {cat.hint}
                      </div>
                    </div>

                    {/* Modes grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(auto-fill, minmax(130px, 1fr))`,
                      gap: '6px',
                    }}>
                      {catModes.map(mode => {
                        const isActive = mode.id === activeId
                        return (
                          <div
                            key={mode.id}
                            onMouseEnter={() => setActiveId(mode.id)}
                            onClick={() => handleModeClick(mode)}
                            style={{
                              cursor: 'pointer',
                              padding: '16px 12px',
                              background: isActive
                                ? `linear-gradient(160deg, ${mode.color}18, ${mode.colorAlt}28)`
                                : 'rgba(255,255,255,0.03)',
                              border: `1px solid ${isActive ? mode.color + '66' : 'rgba(255,255,255,0.07)'}`,
                              transition: 'all 0.2s ease',
                              position: 'relative', overflow: 'hidden',
                              boxShadow: isActive ? `0 0 20px ${mode.color}18` : 'none',
                              transform: isActive ? 'translateY(-2px)' : 'none',
                            }}
                          >
                            <div style={{
                              position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                              background: isActive ? `linear-gradient(90deg, transparent, ${mode.color}, transparent)` : 'transparent',
                              transition: 'all 0.2s',
                            }} />

                            <div style={{ fontSize: '1.4rem', marginBottom: '8px' }}>{mode.icon}</div>

                            <div style={{
                              fontFamily: "'Bebas Neue', sans-serif",
                              fontSize: '1rem', letterSpacing: '2px',
                              color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                              textShadow: isActive ? `0 0 10px ${mode.color}` : 'none',
                              transition: 'all 0.2s',
                            }}>{mode.label}</div>

                            <div style={{
                              fontFamily: "'Share Tech Mono', monospace",
                              fontSize: '0.46rem', letterSpacing: '1px',
                              color: isActive ? mode.color : 'rgba(255,255,255,0.2)',
                              marginTop: '4px', lineHeight: 1.4,
                              transition: 'all 0.2s',
                            }}>{mode.sub}</div>

                            {isActive && (
                              <div style={{ marginTop: '8px', fontFamily: "'Rajdhani', sans-serif", fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '1px' }}>
                                {t('quiz.play')}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </>

        ) : (
          /* Sélecteur de perso — FIGHTER mode */
          <div style={{ width: '100%', maxWidth: '900px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <button onClick={() => setShowFighters(false)} style={{
                background: 'none', border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                padding: '8px 16px', fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '0.85rem', letterSpacing: '2px',
              }}>{t('quiz.back')}</button>
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.8rem', letterSpacing: '5px', color: '#fff', textShadow: '0 0 16px #00f0ff' }}>
                {t('quiz.choose_fighter')}
              </h2>
            </div>

            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('quiz.search')}
              style={{
                width: '100%', padding: '11px 18px', marginBottom: '20px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', outline: 'none',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.8rem', letterSpacing: '2px',
              }}
            />

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
                      href={`/quiz/play?mode=fighter&slug=${fighter.slug}`}
                      style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', transition: 'all 0.15s', cursor: 'pointer' }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = color; el.style.boxShadow = `0 0 12px ${color}33`; el.style.background = `${color}12` }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.07)'; el.style.boxShadow = 'none'; el.style.background = 'rgba(255,255,255,0.03)' }}
                    >
                      <div style={{ width: '100%', height: '90px', background: `linear-gradient(180deg, ${color}28, ${color}0d)`, overflow: 'hidden' }}>
                        {portrait && (
                          <img src={portrait} alt={fighter.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        )}
                      </div>
                      <div style={{ padding: '6px 4px', fontFamily: "'Rajdhani', sans-serif", fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', textAlign: 'center' }}>{fighter.name}</div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

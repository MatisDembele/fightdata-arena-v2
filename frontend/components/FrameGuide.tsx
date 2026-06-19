'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n'

const TOTAL = 4

const GREEN = '#4ade80'
const RED   = '#f87171'
const GREY  = 'rgba(255,255,255,0.25)'

// Example move used across the lesson: 8F startup / 3F active / 14F recovery
const STARTUP = 8, ACTIVE = 3, RECOVERY = 14

function Cells({ count, color, bg }: { count: number; color: string; bg: string }) {
  return (
    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ width: '13px', height: '13px', background: bg, border: `1px solid ${color}`, boxShadow: `0 0 4px ${color}55` }} />
      ))}
    </div>
  )
}

function PhaseRow({ label, frames, color, bg, desc }: { label: string; frames: number; color: string; bg: string; desc: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color }}>{label}</span>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-1)', color: 'rgba(255,255,255,0.68)' }}>· {frames}F</span>
      </div>
      <Cells count={frames} color={color} bg={bg} />
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>{desc}</div>
    </div>
  )
}

function GlossRow({ term, color, desc }: { term: string; color: string; desc: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '92px 1fr', gap: '12px', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'start' }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.8rem', letterSpacing: '1px', color }}>{term}</div>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{desc}</div>
    </div>
  )
}

function CardTitle({ children }: { children: string }) {
  return <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.15rem', letterSpacing: '3px', color: '#fff', lineHeight: 1.1 }}>{children}</div>
}

function Body({ children }: { children: string }) {
  return <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.92rem', fontWeight: 500, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55 }}>{children}</div>
}

const panelStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', padding: '16px 16px' }

export default function FrameGuide() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const { t } = useLanguage()

  const launch = () => { setStep(0); setOpen(true) }

  function renderStep() {
    switch (step) {
      // 1 — What is a frame
      case 0:
        return (
          <>
            <CardTitle>{t('guide.c1_title')}</CardTitle>
            <Body>{t('guide.c1_body')}</Body>
            <div style={{ ...panelStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '22px 16px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.4rem', letterSpacing: '2px', color: '#00f0ff', lineHeight: 1, textShadow: '0 0 16px #00f0ff66' }}>60</div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-2)', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>FRAMES / SEC</div>
              </div>
              <div style={{ width: '1px', height: '44px', background: 'rgba(255,255,255,0.12)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.4rem', letterSpacing: '1px', color: '#fff', lineHeight: 1 }}>17<span style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.65)' }}>ms</span></div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-2)', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>1 FRAME = 1/60 S</div>
              </div>
            </div>
          </>
        )
      // 2 — The life of a move
      case 1:
        return (
          <>
            <CardTitle>{t('guide.c2_title')}</CardTitle>
            <Body>{t('guide.c2_intro')}</Body>
            {/* Proportional timeline */}
            <div style={{ display: 'flex', width: '100%', height: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
              {[{ f: STARTUP, c: GREEN, bg: 'rgba(74,222,128,0.22)' }, { f: ACTIVE, c: RED, bg: 'rgba(248,113,113,0.22)' }, { f: RECOVERY, c: GREY, bg: 'rgba(255,255,255,0.06)' }].map((s, i) => (
                <div key={i} style={{ flexGrow: s.f, flexBasis: 0, background: s.bg, borderRight: i < 2 ? '1px solid rgba(0,0,0,0.3)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: s.c }}>{s.f}</span>
                </div>
              ))}
            </div>
            <div style={{ ...panelStyle, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <PhaseRow label="STARTUP"  frames={STARTUP}  color={GREEN} bg="rgba(74,222,128,0.25)"  desc={t('guide.startup_desc')} />
              <PhaseRow label="ACTIVE"   frames={ACTIVE}   color={RED}   bg="rgba(248,113,113,0.25)" desc={t('guide.active_desc')} />
              <PhaseRow label="RECOVERY" frames={RECOVERY} color={GREY}  bg="rgba(255,255,255,0.07)" desc={t('guide.recovery_desc')} />
            </div>
          </>
        )
      // 3 — Advantage: who moves first
      case 2:
        return (
          <>
            <CardTitle>{t('guide.c3_title')}</CardTitle>
            <Body>{t('guide.c3_intro')}</Body>
            <div style={{ ...panelStyle, display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <GlossRow term={t('guide.on_block')} color="#60a5fa" desc={t('guide.on_block_desc')} />
              <GlossRow term={t('guide.on_hit')}   color="#4ade80" desc={t('guide.on_hit_desc')} />
              <GlossRow term={t('guide.plus')}     color="#a3e635" desc={t('guide.plus_desc')} />
              <GlossRow term={t('guide.minus')}    color="#f87171" desc={t('guide.minus_desc')} />
            </div>
          </>
        )
      // 4 — How a punish works
      default:
        return (
          <>
            <CardTitle>{t('guide.c4_title')}</CardTitle>
            <Body>{t('guide.c4_body')}</Body>
            <div style={{ ...panelStyle, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-2)', color: '#f87171' }}>{t('guide.c4_you')}</span>
                <Cells count={6} color="#f87171" bg="rgba(248,113,113,0.25)" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-2)', color: '#a3e635' }}>{t('guide.c4_opp')}</span>
                <Cells count={6} color="#a3e635" bg="rgba(163,230,53,0.22)" />
              </div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-1)', color: '#f87171', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                {t('guide.punishable')}
              </div>
            </div>
            <Link
              href="/quiz"
              onClick={() => setOpen(false)}
              style={{ display: 'block', textAlign: 'center', padding: '11px', background: 'rgba(255,45,120,0.12)', border: '1px solid rgba(255,45,120,0.45)', color: '#ff2d78', textDecoration: 'none', fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.95rem', letterSpacing: '2px' }}
            >
              {t('guide.cta_quiz')}
            </Link>
          </>
        )
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={launch}
        title={t('guide.title')}
        style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 200,
          width: '38px', height: '38px',
          background: 'rgba(10,0,20,0.92)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.65)',
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '1rem', letterSpacing: '1px',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)',
          transition: 'border-color 0.2s, color 0.2s, box-shadow 0.2s',
          boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'
          e.currentTarget.style.color = '#fff'
          e.currentTarget.style.boxShadow = '0 0 14px rgba(255,255,255,0.1)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
          e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
          e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.5)'
        }}
      >
        ?
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0d0015',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 0 60px rgba(0,0,0,0.8)',
              maxWidth: '480px', width: '100%',
              maxHeight: '90vh', overflowY: 'auto',
              padding: '24px 22px',
              display: 'flex', flexDirection: 'column', gap: '18px',
              position: 'relative',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.3rem', letterSpacing: '5px', color: '#fff', lineHeight: 1 }}>{t('guide.title')}</div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-3)', color: 'rgba(255,255,255,0.68)', marginTop: '5px' }}>{t('guide.subtitle')}</div>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '4px 10px', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.5rem', letterSpacing: '2px', flexShrink: 0 }}
              >ESC</button>
            </div>

            {/* Progress dots */}
            <div style={{ display: 'flex', gap: '7px', alignItems: 'center' }}>
              {Array.from({ length: TOTAL }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  aria-label={`step ${i + 1}`}
                  style={{
                    flex: 1, height: '3px', padding: 0, border: 'none', cursor: 'pointer',
                    background: i === step ? '#00f0ff' : i < step ? 'rgba(0,240,255,0.4)' : 'rgba(255,255,255,0.12)',
                    boxShadow: i === step ? '0 0 8px #00f0ff88' : 'none',
                    transition: 'background 0.2s',
                  }}
                />
              ))}
            </div>

            {/* Step content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minHeight: '240px' }}>
              {renderStep()}
            </div>

            {/* Footer nav */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '14px' }}>
              <button
                onClick={() => setStep(s => Math.max(0, s - 1))}
                disabled={step === 0}
                style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: step === 0 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.55)', cursor: step === 0 ? 'default' : 'pointer', padding: '8px 16px', fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.85rem', letterSpacing: '2px' }}
              >{t('guide.nav_prev')}</button>

              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-2)', color: 'rgba(255,255,255,0.7)' }}>{step + 1} / {TOTAL}</div>

              {step < TOTAL - 1 ? (
                <button
                  onClick={() => setStep(s => Math.min(TOTAL - 1, s + 1))}
                  style={{ background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.45)', color: '#00f0ff', cursor: 'pointer', padding: '8px 18px', fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.85rem', letterSpacing: '2px' }}
                >{t('guide.nav_next')}</button>
              ) : (
                <button
                  onClick={() => setOpen(false)}
                  style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.45)', color: '#4ade80', cursor: 'pointer', padding: '8px 18px', fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.85rem', letterSpacing: '2px' }}
                >{t('guide.nav_done')}</button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

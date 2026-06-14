'use client'
import { useState } from 'react'
import { useLanguage } from '@/lib/i18n'

const STARTUP  = 8
const ACTIVE   = 3
const RECOVERY = 14

function Frames({ count, color, bg }: { count: number; color: string; bg: string }) {
  return (
    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ width: '13px', height: '13px', background: bg, border: `1px solid ${color}`, boxShadow: `0 0 4px ${color}55` }} />
      ))}
    </div>
  )
}

function Row({ label, frames, color, bg, desc }: { label: string; frames: number; color: string; bg: string; desc: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color }}>{label}</span>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-1)', color: 'rgba(255,255,255,0.25)' }}>· {frames}F</span>
      </div>
      <Frames count={frames} color={color} bg={bg} />
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>{desc}</div>
    </div>
  )
}

export default function FrameGuide() {
  const [open, setOpen] = useState(false)
  const { t } = useLanguage()

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        title={t('guide.title')}
        style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 200,
          width: '38px', height: '38px',
          background: 'rgba(10,0,20,0.92)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.5)',
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
              padding: '28px 24px',
              display: 'flex', flexDirection: 'column', gap: '24px',
              position: 'relative',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', letterSpacing: '5px', color: '#fff', lineHeight: 1 }}>{t('guide.title')}</div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-3)', color: 'rgba(255,255,255,0.25)', marginTop: '5px' }}>{t('guide.subtitle')}</div>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: '4px 10px', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.5rem', letterSpacing: '2px', flexShrink: 0 }}
              >ESC</button>
            </div>

            {/* Visual example */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)', color: 'rgba(255,255,255,0.35)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                {t('guide.example')}
              </div>

              <Row
                label="STARTUP"
                frames={STARTUP}
                color="#4ade80"
                bg="rgba(74,222,128,0.25)"
                desc={t('guide.startup_desc')}
              />
              <Row
                label="ACTIVE"
                frames={ACTIVE}
                color="#f87171"
                bg="rgba(248,113,113,0.25)"
                desc={t('guide.active_desc')}
              />
              <Row
                label="RECOVERY"
                frames={RECOVERY}
                color="rgba(255,255,255,0.25)"
                bg="rgba(255,255,255,0.07)"
                desc={t('guide.recovery_desc')}
              />

              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-1)', color: '#f87171', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                {t('guide.punishable')}
              </div>
            </div>

            {/* Glossary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {[
                { term: 'ON BLOCK', color: '#60a5fa', label: t('guide.on_block'), desc: t('guide.on_block_desc') },
                { term: 'ON HIT',   color: '#4ade80', label: t('guide.on_hit'),   desc: t('guide.on_hit_desc') },
                { term: 'PUNISH',   color: '#fb923c', label: t('guide.punish'),   desc: t('guide.punish_desc') },
                { term: 'PLUS',     color: '#a3e635', label: t('guide.plus'),     desc: t('guide.plus_desc') },
                { term: 'MINUS',    color: '#f87171', label: t('guide.minus'),    desc: t('guide.minus_desc') },
              ].map(({ term, color, label, desc }) => (
                <div key={term} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '12px', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'start' }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.8rem', letterSpacing: '1px', color }}>{label}</div>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{desc}</div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}
    </>
  )
}

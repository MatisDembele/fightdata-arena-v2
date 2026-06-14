'use client'
import { useState, useEffect } from 'react'
import type { Achievement } from '@/lib/achievements'
import { RARITY_COLOR, RARITY_LABEL } from '@/lib/achievements'

export default function AchievementToast({
  achievements,
  onDismiss,
}: {
  achievements: Achievement[]
  onDismiss: (id: string) => void
}) {
  const [visible, setVisible] = useState(false)
  const current = achievements[0]

  useEffect(() => {
    if (!current) { setVisible(false); return }
    setVisible(false)
    const raf = requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => slideOut(current.id), 3500)
    return () => { cancelAnimationFrame(raf); clearTimeout(timer) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id])

  function slideOut(id: string) {
    setVisible(false)
    setTimeout(() => onDismiss(id), 400)
  }

  if (!current) return null

  const color = RARITY_COLOR[current.rarity]

  return (
    <div
      onClick={() => slideOut(current.id)}
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        transform: visible ? 'translateX(0)' : 'translateX(calc(100% + 40px))',
        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 9999,
        width: '300px',
        background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${color}55`,
        boxShadow: `0 8px 40px rgba(0,0,0,0.7), 0 0 24px ${color}18`,
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <div style={{ height: '2px', background: `linear-gradient(90deg, ${color}, transparent)` }} />

      <div style={{ padding: '14px 16px', display: 'flex', gap: '14px', alignItems: 'center' }}>
        <div style={{ fontSize: '2.2rem', lineHeight: 1, flexShrink: 0 }}>{current.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-4)', color, marginBottom: '5px' }}>
            ACHIEVEMENT UNLOCKED
          </div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.05rem', letterSpacing: '3px', color: '#fff', lineHeight: 1.1 }}>
            {current.name}
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-1)', color: 'rgba(255,255,255,0.4)', marginTop: '5px', lineHeight: 1.5 }}>
            {current.desc}
          </div>
        </div>
      </div>

      <div style={{ padding: '6px 16px 8px', borderTop: `1px solid ${color}22`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-3)', color }}>
          {RARITY_LABEL[current.rarity]}
        </span>
        {achievements.length > 1 && (
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-2)', color: 'rgba(255,255,255,0.3)' }}>
            +{achievements.length - 1}
          </span>
        )}
      </div>
    </div>
  )
}

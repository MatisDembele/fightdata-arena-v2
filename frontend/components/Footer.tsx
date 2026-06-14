'use client'
import { useState } from 'react'
import { useLanguage } from '@/lib/i18n'

const CREATOR_EMAIL = 'dembelematis@gmail.com'

const CATEGORIES = [
  { key: 'mode',    icon: '🎮', labelEn: 'New Mode',    labelFr: 'Idée de mode' },
  { key: 'feature', icon: '✨', labelEn: 'Feature',     labelFr: 'Fonctionnalité' },
  { key: 'bug',     icon: '🐛', labelEn: 'Bug',         labelFr: 'Bug' },
  { key: 'other',   icon: '💬', labelEn: 'Other',       labelFr: 'Autre' },
] as const

type Category = typeof CATEGORIES[number]['key']

export default function Footer() {
  const { t, lang } = useLanguage()

  const [category, setCategory] = useState<Category>('mode')
  const [message,  setMessage]  = useState('')
  const [sent,     setSent]     = useState(false)

  const catLabel = (key: Category) => {
    const c = CATEGORIES.find(x => x.key === key)!
    return lang === 'fr' ? c.labelFr : c.labelEn
  }

  function handleSend() {
    if (!message.trim()) return
    const sub = encodeURIComponent(`[FDA — ${catLabel(category)}]`)
    const bod = encodeURIComponent(message.trim())
    window.open(`mailto:${CREATOR_EMAIL}?subject=${sub}&body=${bod}`, '_blank')
    setSent(true)
    setMessage('')
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <footer style={{
      borderTop: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(4,0,12,0.97)',
      padding: '48px 24px 36px',
    }}>
      <div style={{
        maxWidth: '900px', margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'clamp(200px, 35%, 320px) 1fr',
        gap: '48px',
      }}>

        {/* Left — project info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '1.4rem', letterSpacing: '6px', color: '#fff',
              textShadow: '0 0 12px rgba(255,45,120,0.4)',
            }}>FIGHT DATA ARENA</div>
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '0.48rem', letterSpacing: '4px',
              color: 'rgba(255,255,255,0.2)', marginTop: '4px',
            }}>STREET FIGHTER 6 // FRAME DATA QUIZ</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { label: t('home.stat_chars'),   val: '30' },
              { label: t('home.stat_moves'),   val: '1562' },
              { label: t('home.stat_modes'),   val: '14' },
            ].map(({ label, val }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.45rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.2)' }}>
                  {label}
                </span>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.95rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)' }}>
                  {val}
                </span>
              </div>
            ))}
          </div>

          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '0.42rem', letterSpacing: '2px',
            color: 'rgba(255,255,255,0.12)',
            paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)',
          }}>
            {t('home.patch')}
          </div>

        </div>

        {/* Right — idea form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '1rem', letterSpacing: '5px',
            color: 'rgba(255,255,255,0.6)',
          }}>{t('contact.title')} / FEEDBACK</div>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {CATEGORIES.map(({ key, icon }) => {
              const isSel = category === key
              return (
                <button
                  key={key}
                  onClick={() => setCategory(key)}
                  style={{
                    padding: '6px 12px',
                    background: isSel ? 'rgba(255,45,120,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isSel ? 'rgba(255,45,120,0.6)' : 'rgba(255,255,255,0.08)'}`,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: '0.75rem' }}>{icon}</span>
                  <span style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: '0.78rem', fontWeight: 600,
                    color: isSel ? '#fff' : 'rgba(255,255,255,0.35)',
                  }}>{catLabel(key)}</span>
                </button>
              )
            })}
          </div>

          {/* Message */}
          <div style={{ position: 'relative' }}>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={t('contact.message_ph')}
              rows={4}
              maxLength={2000}
              style={{
                width: '100%', padding: '12px 14px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff', outline: 'none', resize: 'vertical',
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '0.9rem', fontWeight: 500, lineHeight: 1.5,
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(255,45,120,0.4)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
            />
            {message.length > 0 && (
              <div style={{
                position: 'absolute', bottom: '8px', right: '10px',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.38rem', letterSpacing: '1px',
                color: 'rgba(255,255,255,0.15)',
              }}>{message.length}/2000</div>
            )}
          </div>

          <button
            onClick={handleSend}
            disabled={!message.trim()}
            style={{
              alignSelf: 'flex-start', padding: '10px 24px',
              background: message.trim()
                ? sent
                  ? 'rgba(74,222,128,0.15)'
                  : 'linear-gradient(90deg, #9b1fff, #ff2d78)'
                : 'rgba(255,255,255,0.04)',
              border: sent ? '1px solid #4ade80' : 'none',
              cursor: message.trim() ? 'pointer' : 'default',
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '0.85rem', letterSpacing: '4px',
              color: message.trim() ? (sent ? '#4ade80' : '#fff') : 'rgba(255,255,255,0.18)',
              boxShadow: message.trim() && !sent ? '0 0 16px rgba(255,45,120,0.25)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {sent ? '✓ SENT' : t('contact.send')}
          </button>

        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        maxWidth: '900px', margin: '32px auto 0',
        paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.04)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '8px',
      }}>
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '0.4rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.12)',
        }}>
          © 2025 FIGHT DATA ARENA — DATA FROM ULTIMATEFRAMEDATA.COM
        </div>
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '0.4rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.1)',
        }}>
          MADE WITH ❤️ FOR THE SF6 COMMUNITY
        </div>
      </div>
    </footer>
  )
}

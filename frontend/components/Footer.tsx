'use client'
import { useState } from 'react'
import { useLanguage } from '@/lib/i18n'
import Icon, { type IconName } from '@/components/Icon'

const CREATOR_EMAIL = 'dembelematis@gmail.com'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const CATEGORIES = [
  { key: 'mode',    icon: 'gamepad', labelEn: 'New Mode',    labelFr: 'Idée de mode' },
  { key: 'feature', icon: 'sparkle', labelEn: 'Feature',     labelFr: 'Fonctionnalité' },
  { key: 'bug',     icon: 'bug',     labelEn: 'Bug',         labelFr: 'Bug' },
  { key: 'other',   icon: 'chat',    labelEn: 'Other',       labelFr: 'Autre' },
] as const satisfies readonly { key: string; icon: IconName; labelEn: string; labelFr: string }[]

type Category = typeof CATEGORIES[number]['key']

export default function Footer() {
  const { t, lang } = useLanguage()

  const [category, setCategory] = useState<Category>('mode')
  const [message,  setMessage]  = useState('')
  const [status,   setStatus]   = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const catLabel = (key: Category) => {
    const c = CATEGORIES.find(x => x.key === key)!
    return lang === 'fr' ? c.labelFr : c.labelEn
  }

  async function handleSend() {
    const msg = message.trim()
    if (!msg || status === 'sending') return
    setStatus('sending')
    try {
      const res = await fetch(`${API_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, message: msg, lang }),
      })
      if (!res.ok) throw new Error(String(res.status))
      setMessage('')
      setStatus('sent')
      setTimeout(() => setStatus('idle'), 3500)
    } catch {
      setStatus('error')
    }
  }

  return (
    <footer style={{
      borderTop: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(4,0,12,0.97)',
      padding: '48px 24px 36px',
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>

        {/* Feedback form */}
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
                  <Icon name={icon} size={15} color={isSel ? '#fff' : 'rgba(255,255,255,0.4)'} />
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
                fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-1)',
                color: 'rgba(255,255,255,0.15)',
              }}>{message.length}/2000</div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
            <button
              onClick={handleSend}
              disabled={!message.trim() || status === 'sending'}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                alignSelf: 'flex-start', padding: '10px 24px',
                background: status === 'sent'
                  ? 'rgba(74,222,128,0.15)'
                  : message.trim() && status !== 'sending'
                    ? 'linear-gradient(90deg, #9b1fff, #ff2d78)'
                    : 'rgba(255,255,255,0.04)',
                border: status === 'sent' ? '1px solid #4ade80' : 'none',
                cursor: message.trim() && status !== 'sending' ? 'pointer' : 'default',
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '0.85rem', letterSpacing: '4px',
                color: status === 'sent' ? '#4ade80' : message.trim() ? '#fff' : 'rgba(255,255,255,0.18)',
                boxShadow: message.trim() && status === 'idle' ? '0 0 16px rgba(255,45,120,0.25)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {status === 'sent' && <Icon name="check" size={15} color="#4ade80" />}
              {status === 'sending' ? t('contact.sending') : status === 'sent' ? t('contact.sent') : t('contact.send')}
            </button>

            {status === 'error' && (
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-1)', color: '#ff2d78', lineHeight: 1.5 }}>
                {t('contact.error')}{' '}
                <a href={`mailto:${CREATOR_EMAIL}`} style={{ color: '#ff8fb4' }}>{CREATOR_EMAIL}</a>
              </div>
            )}
          </div>

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

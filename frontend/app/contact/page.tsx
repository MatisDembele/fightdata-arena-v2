'use client'
import { useState } from 'react'
import Navbar from '@/components/Navbar'
import { useLanguage } from '@/lib/i18n'

const CREATOR_EMAIL = 'dembelematis@gmail.com'

const CATEGORIES = [
  { key: 'mode',    icon: '🎮' },
  { key: 'feature', icon: '✨' },
  { key: 'bug',     icon: '🐛' },
  { key: 'other',   icon: '💬' },
] as const

type Category = typeof CATEGORIES[number]['key']

export default function ContactPage() {
  const { t } = useLanguage()

  const [category, setCategory] = useState<Category>('mode')
  const [subject,  setSubject]  = useState('')
  const [message,  setMessage]  = useState('')
  const [copied,   setCopied]   = useState(false)

  const catLabel: Record<Category, string> = {
    mode:    t('contact.cat_mode'),
    feature: t('contact.cat_feature'),
    bug:     t('contact.cat_bug'),
    other:   t('contact.cat_other'),
  }

  function handleSend() {
    const sub = encodeURIComponent(`[FDA — ${catLabel[category]}] ${subject}`.trim())
    const bod = encodeURIComponent(message.trim())
    window.open(`mailto:${CREATOR_EMAIL}?subject=${sub}&body=${bod}`, '_blank')
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(CREATOR_EMAIL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  const canSend = subject.trim().length > 0 && message.trim().length > 0

  return (
    <>
      <Navbar />
      <main style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '40px 20px 80px', minHeight: 'calc(100vh - 60px)',
      }}>
        <div style={{ width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* Header */}
          <div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              letterSpacing: '8px', color: '#fff',
              textShadow: '0 0 20px rgba(255,45,120,0.5)',
            }}>{t('contact.title')}</div>
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '0.55rem', letterSpacing: '4px',
              color: 'rgba(255,255,255,0.2)', marginTop: '6px',
            }}>{t('contact.subtitle')}</div>
          </div>

          {/* Email card */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px',
            background: 'rgba(255,45,120,0.07)',
            border: '1px solid rgba(255,45,120,0.25)',
          }}>
            <div>
              <div style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.45rem', letterSpacing: '3px',
                color: 'rgba(255,255,255,0.25)', marginBottom: '6px',
              }}>{t('contact.email_label')}</div>
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '1.1rem', letterSpacing: '3px', color: '#ff2d78',
                textShadow: '0 0 14px rgba(255,45,120,0.5)',
              }}>{CREATOR_EMAIL}</div>
            </div>
            <button
              onClick={copyEmail}
              style={{
                padding: '8px 14px', flexShrink: 0,
                background: copied ? 'rgba(74,222,128,0.1)' : 'rgba(255,45,120,0.1)',
                border: `1px solid ${copied ? '#4ade80' : 'rgba(255,45,120,0.4)'}`,
                cursor: 'pointer',
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '0.7rem', letterSpacing: '2px',
                color: copied ? '#4ade80' : '#ff2d78',
                transition: 'all 0.2s',
              }}
            >
              {copied ? t('contact.copied') : t('contact.copy_email')}
            </button>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
            <span style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '0.48rem', letterSpacing: '4px', color: 'rgba(255,255,255,0.18)',
            }}>{t('contact.or')}</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Category */}
            <div>
              <label style={{
                display: 'block',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.48rem', letterSpacing: '4px',
                color: 'rgba(255,255,255,0.25)', marginBottom: '10px',
                borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px',
              }}>{t('contact.category')}</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {CATEGORIES.map(({ key, icon }) => {
                  const isSel = category === key
                  return (
                    <button
                      key={key}
                      onClick={() => setCategory(key)}
                      style={{
                        padding: '14px 12px',
                        background: isSel ? 'rgba(255,45,120,0.12)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isSel ? '#ff2d78' : 'rgba(255,255,255,0.07)'}`,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '10px',
                        transition: 'all 0.15s',
                        boxShadow: isSel ? '0 0 16px rgba(255,45,120,0.15)' : 'none',
                      }}
                    >
                      <span style={{ fontSize: '1rem' }}>{icon}</span>
                      <span style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: '0.85rem', fontWeight: 600,
                        letterSpacing: '0.5px',
                        color: isSel ? '#fff' : 'rgba(255,255,255,0.4)',
                      }}>{catLabel[key]}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label style={{
                display: 'block',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.48rem', letterSpacing: '4px',
                color: 'rgba(255,255,255,0.25)', marginBottom: '8px',
              }}>{t('contact.subject')}</label>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder={t('contact.subject_ph')}
                maxLength={120}
                style={{
                  width: '100%', padding: '12px 14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', outline: 'none',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '0.95rem', fontWeight: 500,
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(255,45,120,0.5)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
              />
            </div>

            {/* Message */}
            <div>
              <label style={{
                display: 'block',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.48rem', letterSpacing: '4px',
                color: 'rgba(255,255,255,0.25)', marginBottom: '8px',
              }}>{t('contact.message')}</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={t('contact.message_ph')}
                rows={6}
                maxLength={2000}
                style={{
                  width: '100%', padding: '12px 14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', outline: 'none', resize: 'vertical',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.6,
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(255,45,120,0.5)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
              />
              <div style={{
                textAlign: 'right', marginTop: '4px',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.42rem', letterSpacing: '1px',
                color: 'rgba(255,255,255,0.15)',
              }}>{message.length}/2000</div>
            </div>

            {/* Send */}
            <button
              onClick={handleSend}
              disabled={!canSend}
              style={{
                width: '100%', padding: '16px',
                background: canSend
                  ? 'linear-gradient(90deg, #9b1fff, #ff2d78)'
                  : 'rgba(255,255,255,0.05)',
                border: canSend ? 'none' : '1px solid rgba(255,255,255,0.08)',
                cursor: canSend ? 'pointer' : 'default',
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '1.1rem', letterSpacing: '6px', color: canSend ? '#fff' : 'rgba(255,255,255,0.2)',
                boxShadow: canSend ? '0 0 24px rgba(255,45,120,0.3)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {t('contact.send')}
            </button>

          </div>
        </div>
      </main>
    </>
  )
}

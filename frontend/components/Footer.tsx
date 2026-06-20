'use client'
import { useState } from 'react'
import Link from 'next/link'
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

type FooterLink = { href: string; label: string; color: string; external?: boolean }

function ColLink({ href, label, color, external }: FooterLink) {
  const style: React.CSSProperties = {
    display: 'inline-block', padding: '4px 0', textDecoration: 'none',
    fontFamily: "'Rajdhani', sans-serif", fontSize: '0.92rem', fontWeight: 600,
    letterSpacing: '0.4px', color: 'rgba(255,255,255,0.6)', transition: 'color 0.15s',
  }
  const on  = (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.color = color }
  const off = (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }
  return external
    ? <a href={href} target="_blank" rel="noopener noreferrer" style={style} onMouseEnter={on} onMouseLeave={off}>{label}</a>
    : <Link href={href} style={style} onMouseEnter={on} onMouseLeave={off}>{label}</Link>
}

const colTitle: React.CSSProperties = {
  fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)',
  letterSpacing: 'var(--ls-4)', color: 'rgba(255,255,255,0.4)', marginBottom: '14px',
}

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

  const navLinks: FooterLink[] = [
    { href: '/quiz',       label: t('home.mode_quiz'),      color: '#ff2d78' },
    { href: '/multi',      label: t('home.mode_multi'),     color: '#ffe000' },
    { href: '/challenges', label: t('home.mode_challenge'), color: '#00ff88' },
    { href: '/frame-data', label: t('home.mode_learn'),     color: '#c084fc' },
    { href: '/profile',    label: t('nav.profile'),         color: '#00f0ff' },
  ]
  const resLinks: FooterLink[] = [
    { href: 'https://ultimateframedata.com/sf6', label: t('home.mode_db'),     color: '#00f0ff', external: true },
    { href: '/privacy',                          label: t('nav.privacy_link'), color: '#9b1fff' },
    { href: `mailto:${CREATOR_EMAIL}`,           label: t('nav.contact'),      color: '#ff2d78', external: true },
  ]

  return (
    <footer style={{
      borderTop: '1px solid rgba(255,255,255,0.07)',
      background: 'rgba(4,0,12,0.97)',
      padding: '52px 24px 28px',
    }}>
      <div style={{ maxWidth: '1140px', margin: '0 auto' }}>

        <div className="footer-grid">

          {/* ── Brand ── */}
          <div>
            <Link href="/" style={{
              display: 'inline-block', textDecoration: 'none',
              fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem', letterSpacing: '4px',
              background: 'linear-gradient(90deg, #fff 0%, #ffe000 45%, #ff2d78 100%)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            }}>FIGHT DATA ARENA</Link>
            <p style={{
              fontFamily: "'Rajdhani', sans-serif", fontSize: '0.9rem', fontWeight: 500,
              lineHeight: 1.55, color: 'rgba(255,255,255,0.55)', margin: '12px 0 18px', maxWidth: '260px',
            }}>{t('footer.tagline')}</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <a href="https://ultimateframedata.com/sf6" target="_blank" rel="noopener noreferrer"
                title="Ultimate Frame Data"
                style={iconBtn} onMouseEnter={e => hov(e, '#00f0ff')} onMouseLeave={e => unhov(e)}>
                <Icon name="gamepad" size={16} color="rgba(255,255,255,0.7)" />
              </a>
              <a href={`mailto:${CREATOR_EMAIL}`} title={CREATOR_EMAIL}
                style={iconBtn} onMouseEnter={e => hov(e, '#ff2d78')} onMouseLeave={e => unhov(e)}>
                <Icon name="chat" size={16} color="rgba(255,255,255,0.7)" />
              </a>
            </div>
          </div>

          {/* ── Navigate ── */}
          <nav style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={colTitle}>{t('footer.navigate')}</div>
            {navLinks.map(l => <ColLink key={l.href} {...l} />)}
          </nav>

          {/* ── Resources ── */}
          <nav style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={colTitle}>{t('footer.resources')}</div>
            {resLinks.map(l => <ColLink key={l.href} {...l} />)}
          </nav>

          {/* ── Feedback ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={colTitle}>{t('footer.feedback')}</div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {CATEGORIES.map(({ key, icon }) => {
                const isSel = category === key
                return (
                  <button key={key} onClick={() => setCategory(key)} style={{
                    padding: '6px 12px',
                    background: isSel ? 'rgba(255,45,120,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isSel ? 'rgba(255,45,120,0.6)' : 'rgba(255,255,255,0.08)'}`,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                    transition: 'all 0.15s',
                  }}>
                    <Icon name={icon} size={14} color={isSel ? '#fff' : 'rgba(255,255,255,0.4)'} />
                    <span style={{
                      fontFamily: "'Rajdhani', sans-serif", fontSize: '0.76rem', fontWeight: 600,
                      color: isSel ? '#fff' : 'rgba(255,255,255,0.6)',
                    }}>{catLabel(key)}</span>
                  </button>
                )
              })}
            </div>

            <div style={{ position: 'relative' }}>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={t('contact.message_ph')}
                rows={3}
                maxLength={2000}
                style={{
                  width: '100%', padding: '12px 14px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#fff', outline: 'none', resize: 'vertical',
                  fontFamily: "'Rajdhani', sans-serif", fontSize: '0.9rem', fontWeight: 500, lineHeight: 1.5,
                  boxSizing: 'border-box', transition: 'border-color 0.2s',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(255,45,120,0.4)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
              />
              {message.length > 0 && (
                <div style={{
                  position: 'absolute', bottom: '8px', right: '10px',
                  fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)',
                  letterSpacing: 'var(--ls-1)', color: 'rgba(255,255,255,0.65)',
                }}>{message.length}/2000</div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
              <button
                onClick={handleSend}
                disabled={!message.trim() || status === 'sending'}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 24px',
                  background: status === 'sent'
                    ? 'rgba(74,222,128,0.15)'
                    : message.trim() && status !== 'sending'
                      ? 'linear-gradient(90deg, #9b1fff, #ff2d78)'
                      : 'rgba(255,255,255,0.04)',
                  border: status === 'sent' ? '1px solid #4ade80' : 'none',
                  cursor: message.trim() && status !== 'sending' ? 'pointer' : 'default',
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.85rem', letterSpacing: '4px',
                  color: status === 'sent' ? '#4ade80' : message.trim() ? '#fff' : 'rgba(255,255,255,0.6)',
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

        {/* ── Bottom bar ── */}
        <div style={{
          marginTop: '40px', paddingTop: '20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '8px 20px',
          fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)',
          letterSpacing: 'var(--ls-2)', color: 'rgba(255,255,255,0.5)',
        }}>
          <span>© 2026 FIGHT DATA ARENA · {t('footer.data_from')}</span>
          <span>{t('footer.made_for')} ❤️</span>
        </div>
      </div>
    </footer>
  )
}

const iconBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: '34px', height: '34px',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  transition: 'all 0.15s', cursor: 'pointer',
}
function hov(e: React.MouseEvent<HTMLElement>, color: string) {
  e.currentTarget.style.borderColor = color
  e.currentTarget.style.background = `${color}1a`
}
function unhov(e: React.MouseEvent<HTMLElement>) {
  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
}

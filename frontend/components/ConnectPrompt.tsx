'use client'
import { useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { getDiscordOAuthUrl } from '@/lib/auth'
import { useLanguage } from '@/lib/i18n'
import DiscordIcon from '@/components/DiscordIcon'
import Icon from '@/components/Icon'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const DISCORD = '#5865F2'

/**
 * Value-framed Discord connect card, shown only to logged-out visitors at a
 * moment of investment (e.g. the daily/weekly result screen). Renders nothing
 * once the user is connected.
 */
export default function ConnectPrompt({ style }: { style?: CSSProperties }) {
  const { user, isLoading } = useAuth()
  const { t } = useLanguage()
  const [warming, setWarming] = useState(false)

  if (isLoading || user) return null

  async function connect() {
    setWarming(true)
    const controller = new AbortController()
    const tid = setTimeout(() => controller.abort(), 25000)
    try { await fetch(`${API_URL}/`, { cache: 'no-store', signal: controller.signal }) }
    catch { /* backend may be cold-starting — proceed anyway */ }
    finally { clearTimeout(tid) }
    window.location.href = getDiscordOAuthUrl()
  }

  const benefits = [
    t('connect.benefit_score'),
    t('connect.benefit_streak'),
    t('connect.benefit_rank'),
  ]

  return (
    <div style={{
      border: `1px solid ${DISCORD}55`, background: `${DISCORD}14`,
      padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px',
      textAlign: 'left', ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
        <DiscordIcon size={18} />
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.05rem', letterSpacing: '2px', color: '#fff' }}>
          {t('connect.prompt_title')}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {benefits.map((b, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <span style={{ flexShrink: 0, marginTop: '2px' }}><Icon name="check" size={13} color={DISCORD} /></span>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.86rem', fontWeight: 500, lineHeight: 1.4, color: 'rgba(255,255,255,0.82)' }}>{b}</span>
          </div>
        ))}
      </div>

      <button onClick={connect} disabled={warming} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%',
        background: warming ? '#3a4299' : DISCORD, color: '#fff', border: 'none', padding: '10px',
        cursor: warming ? 'wait' : 'pointer', opacity: warming ? 0.8 : 1, transition: 'all 0.2s',
        fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)',
      }}>
        <DiscordIcon size={13} />
        {warming ? t('nav.connect_warming') : t('nav.connect_continue')}
      </button>

      <Link href="/privacy" style={{
        fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-2xs)', letterSpacing: 'var(--ls-1)',
        color: 'rgba(255,255,255,0.45)', textDecoration: 'none', textAlign: 'center',
      }}>{t('nav.privacy_link')}</Link>
    </div>
  )
}

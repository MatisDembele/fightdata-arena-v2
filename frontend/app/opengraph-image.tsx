import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Fight Data Arena — SF6 Frame Data Quiz'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const COLOR     = '#ff2d78'
  const COLOR_ALT = '#9b1fff'

  // Load Bebas Neue from Google Fonts (same font as the site)
  const bebasFont = await fetch(
    'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap',
    { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }
  ).then(async r => {
    const css = await r.text()
    const url = /url\((.+?)\)/.exec(css)?.[1]
    return url ? fetch(url).then(r => r.arrayBuffer()) : null
  }).catch(() => null)

  const monoFont = await fetch(
    'https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap',
    { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }
  ).then(async r => {
    const css = await r.text()
    const url = /url\((.+?)\)/.exec(css)?.[1]
    return url ? fetch(url).then(r => r.arrayBuffer()) : null
  }).catch(() => null)

  const fonts = []
  if (bebasFont) fonts.push({ name: 'Bebas Neue', data: bebasFont, style: 'normal' as const, weight: 400 })
  if (monoFont)  fonts.push({ name: 'Share Tech Mono', data: monoFont, style: 'normal' as const, weight: 400 })

  return new ImageResponse(
    <div style={{
      width: '100%', height: '100%',
      background: 'linear-gradient(160deg, #0d0010 0%, #1a0030 50%, #0d0015 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'space-between',
      fontFamily: "'Bebas Neue', sans-serif",
      position: 'relative',
      overflow: 'hidden',
      padding: '48px 0 44px',
    }}>

      {/* Radial glow — left */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        background: `radial-gradient(ellipse 80% 60% at 15% 50%, ${COLOR_ALT}30 0%, transparent 55%)`,
      }} />
      {/* Radial glow — right */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        background: `radial-gradient(ellipse 70% 70% at 85% 30%, ${COLOR}20 0%, transparent 55%)`,
      }} />

      {/* Diagonal stripes */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        backgroundImage: 'repeating-linear-gradient(-55deg, transparent, transparent 20px, rgba(255,255,255,0.015) 20px, rgba(255,255,255,0.015) 21px)',
      }} />

      {/* Central band */}
      <div style={{
        position: 'absolute', top: '50%', left: 0, right: 0,
        height: '50%', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          background: `linear-gradient(90deg, ${COLOR_ALT}30, ${COLOR}20, ${COLOR_ALT}30)`,
        }} />
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          backgroundImage: 'repeating-linear-gradient(-55deg, transparent, transparent 20px, rgba(255,255,255,0.015) 20px, rgba(255,255,255,0.015) 21px)',
        }} />
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px', display: 'flex',
          background: `linear-gradient(90deg, transparent, ${COLOR}, ${COLOR_ALT}, transparent)`,
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', display: 'flex',
          background: `linear-gradient(90deg, transparent, ${COLOR_ALT}, ${COLOR}, transparent)`,
        }} />
      </div>

      {/* ── TITLE ── */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        position: 'relative', zIndex: 10,
      }}>
        <div style={{
          display: 'flex',
          fontSize: 104, color: '#fff', letterSpacing: '10px', lineHeight: 1,
          textShadow: `0 0 12px ${COLOR}, 0 0 30px ${COLOR}88, 0 0 60px ${COLOR_ALT}44`,
        }}>
          FIGHT DATA ARENA
        </div>
        <div style={{
          display: 'flex',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 16, letterSpacing: '8px',
          color: 'rgba(255,255,255,0.25)', marginTop: '10px',
        }}>
          STREET FIGHTER 6 // FRAME DATA ENCYCLOPEDIA
        </div>
      </div>

      {/* ── MODE CARDS ── */}
      <div style={{
        display: 'flex', gap: '10px', alignItems: 'stretch',
        position: 'relative', zIndex: 10,
      }}>
        {[
          { label: 'QUIZ',      sub: 'Test your knowledge',   color: '#ff2d78', colorAlt: '#9b1fff', active: true  },
          { label: 'DATABASE',  sub: 'Full frame data ↗',     color: '#00f0ff', colorAlt: '#0050ff', active: false },
          { label: 'MULTI',     sub: 'Challenge friends',      color: '#ffe000', colorAlt: '#ff6a00', active: false },
          { label: 'CHALLENGE', sub: 'Daily & weekly',         color: '#00ff88', colorAlt: '#00b894', active: false },
          { label: 'PROFILE',   sub: 'Stats & progress',       color: '#c084fc', colorAlt: '#7c3aed', active: false },
        ].map(({ label, sub, color, colorAlt, active }) => (
          <div key={label} style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            width: active ? 230 : 168,
            padding: active ? '20px 20px' : '14px 16px',
            background: active ? `linear-gradient(180deg, ${color}18, ${colorAlt}28)` : 'rgba(0,0,0,0.15)',
            border: `1px solid ${active ? color + '55' : 'rgba(255,255,255,0.07)'}`,
            position: 'relative',
          }}>
            {active && (
              <div style={{
                position: 'absolute', top: 0, left: '15%', right: '15%',
                height: '2px', display: 'flex',
                background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
              }} />
            )}
            <div style={{
              display: 'flex',
              fontSize: active ? 44 : 28,
              letterSpacing: active ? '6px' : '3px',
              color: active ? '#fff' : 'rgba(255,255,255,0.3)',
              lineHeight: 1,
              textShadow: active ? `0 0 20px ${color}, 0 0 40px ${color}55` : 'none',
            }}>{label}</div>
            <div style={{
              display: 'flex',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: active ? 12 : 10,
              letterSpacing: '2px',
              marginTop: '6px',
              color: active ? color : 'rgba(255,255,255,0.18)',
              textShadow: active ? `0 0 8px ${color}` : 'none',
            }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── STATS ── */}
      <div style={{
        display: 'flex', gap: '48px', alignItems: 'center',
        position: 'relative', zIndex: 10,
      }}>
        {[['30', 'CHARS'], ['1562', 'MOVES'], ['14', 'MODES']].map(([val, label]) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', fontSize: 36, color: COLOR, lineHeight: 1, textShadow: `0 0 12px ${COLOR}` }}>{val}</div>
            <div style={{
              display: 'flex',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 11, letterSpacing: '4px',
              color: 'rgba(255,255,255,0.25)', marginTop: '4px',
            }}>{label}</div>
          </div>
        ))}
        <div style={{
          display: 'flex',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 11, letterSpacing: '4px',
          color: 'rgba(255,255,255,0.15)',
        }}>PATCH JUNE 2026</div>
      </div>

    </div>,
    { ...size, fonts },
  )
}

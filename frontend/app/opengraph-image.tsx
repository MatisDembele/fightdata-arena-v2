import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Fight Data Arena — SF6 Frame Data'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const COLOR     = '#ff2d78'
  const COLOR_ALT = '#9b1fff'

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
  if (bebasFont) fonts.push({ name: 'Bebas Neue',     data: bebasFont, style: 'normal' as const, weight: 400 })
  if (monoFont)  fonts.push({ name: 'Share Tech Mono', data: monoFont,  style: 'normal' as const, weight: 400 })

  return new ImageResponse(
    <div style={{
      width: '100%', height: '100%',
      background: 'linear-gradient(160deg, #0d0010 0%, #1a0030 50%, #0d0015 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Bebas Neue', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Same radial gradients as the home page BG */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        background: `radial-gradient(ellipse 100% 80% at 50% 100%, ${COLOR}20 0%, transparent 60%)`,
      }} />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        background: `radial-gradient(ellipse 80% 60% at 15% 50%, ${COLOR_ALT}30 0%, transparent 55%)`,
      }} />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        background: `radial-gradient(ellipse 70% 70% at 85% 30%, ${COLOR}20 0%, transparent 55%)`,
      }} />

      {/* Grid overlay — same as home page */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Title block — centered, exact same styling as h1 on home */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 10,
        textAlign: 'center',
      }}>
        <div style={{
          display: 'flex',
          fontSize: 118,
          letterSpacing: '10px',
          lineHeight: 1,
          color: '#fff',
          textShadow: `0 0 12px ${COLOR}, 0 0 30px ${COLOR}88, 0 0 60px ${COLOR_ALT}44`,
          WebkitTextStroke: `1px ${COLOR}55`,
        }}>
          FIGHT DATA ARENA
        </div>
        <div style={{
          display: 'flex',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 18,
          letterSpacing: '8px',
          color: 'rgba(255,255,255,0.25)',
          marginTop: '14px',
        }}>
          STREET FIGHTER 6 // FRAME DATA LEARNING TOOL
        </div>
      </div>

    </div>,
    { ...size, fonts },
  )
}

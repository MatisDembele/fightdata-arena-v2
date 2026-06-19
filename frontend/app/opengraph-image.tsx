import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Fight Data Arena — SF6 Frame Data'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
type FontEntry  = { name: string; data: ArrayBuffer; style: 'normal' | 'italic'; weight: FontWeight }

async function loadFont(family: string): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${family}&display=swap`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }
    ).then(r => r.text())
    const url = /url\((.+?)\)/.exec(css)?.[1]
    if (!url) return null
    return fetch(url).then(r => r.arrayBuffer())
  } catch {
    return null
  }
}

export default async function Image() {
  const COLOR     = '#ff2d78'
  const COLOR_ALT = '#9b1fff'

  const [bebasData, monoData] = await Promise.all([
    loadFont('Bebas+Neue'),
    loadFont('Share+Tech+Mono'),
  ])

  const fonts: FontEntry[] = []
  if (bebasData) fonts.push({ name: 'Bebas Neue',      data: bebasData, style: 'normal', weight: 400 })
  if (monoData)  fonts.push({ name: 'Share Tech Mono', data: monoData,  style: 'normal', weight: 400 })

  return new ImageResponse(
    <div style={{
      width: '100%', height: '100%',
      background: 'linear-gradient(160deg, #0d0010 0%, #1a0030 50%, #0d0015 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Bebas Neue', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Radial glow bottom-center */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        background: `radial-gradient(ellipse 100% 80% at 50% 100%, ${COLOR}20 0%, transparent 60%)`,
      }} />
      {/* Radial glow left */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        background: `radial-gradient(ellipse 80% 60% at 15% 50%, ${COLOR_ALT}30 0%, transparent 55%)`,
      }} />
      {/* Radial glow right */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        background: `radial-gradient(ellipse 70% 70% at 85% 30%, ${COLOR}20 0%, transparent 55%)`,
      }} />

      {/* Title block — centered */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 10,
      }}>
        <div style={{
          display: 'flex',
          fontSize: 118,
          letterSpacing: '10px',
          lineHeight: 1,
          color: '#fff',
          textShadow: `0 0 12px ${COLOR}, 0 0 30px ${COLOR}88, 0 0 60px ${COLOR_ALT}44`,
        }}>
          FIGHT DATA ARENA
        </div>
        <div style={{
          display: 'flex',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 18,
          letterSpacing: '8px',
          color: 'rgba(255,255,255,0.68)',
          marginTop: '14px',
        }}>
          STREET FIGHTER 6 // FRAME DATA LEARNING TOOL
        </div>
      </div>

    </div>,
    { ...size, fonts },
  )
}

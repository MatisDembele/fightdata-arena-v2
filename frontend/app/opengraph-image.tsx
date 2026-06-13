import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Fight Data Arena — SF6 Frame Data Quiz'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: '#0d0010',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
        position: 'relative',
      }}
    >
      {/* Purple radial glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(155,31,255,0.18) 0%, transparent 70%)',
        display: 'flex',
      }} />
      {/* Top accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
        background: 'linear-gradient(90deg, transparent 0%, #ffe000 50%, transparent 100%)',
        display: 'flex',
      }} />
      {/* Bottom accent */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px',
        background: 'linear-gradient(90deg, #ff2d78 0%, #9b1fff 100%)',
        display: 'flex',
      }} />

      {/* Title */}
      <div style={{
        fontSize: '90px', fontWeight: 900, letterSpacing: '-2px',
        color: '#ffffff', lineHeight: 1, display: 'flex',
      }}>
        FIGHT DATA ARENA
      </div>

      {/* Subtitle */}
      <div style={{
        fontSize: '28px', color: 'rgba(255,255,255,0.35)',
        marginTop: '18px', letterSpacing: '8px', display: 'flex',
      }}>
        STREET FIGHTER 6 // FRAME DATA QUIZ
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', gap: '20px', marginTop: '56px' }}>
        {['STARTUP', 'DAMAGE', 'ON-BLOCK', 'MULTIPLAYER'].map(tag => (
          <div
            key={tag}
            style={{
              padding: '10px 22px',
              border: '1px solid rgba(255,224,0,0.35)',
              color: '#ffe000',
              fontSize: '16px',
              letterSpacing: '4px',
              display: 'flex',
            }}
          >
            {tag}
          </div>
        ))}
      </div>
    </div>,
    { ...size },
  )
}

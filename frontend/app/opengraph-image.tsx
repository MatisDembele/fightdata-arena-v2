import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Fight Data Arena — SF6 Frame Data Quiz'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    <div style={{
      background: '#0a000f',
      width: '100%', height: '100%',
      display: 'flex', position: 'relative',
      fontFamily: "'Arial Black', Impact, 'Helvetica Neue', sans-serif",
    }}>
      {/* Purple radial glow left */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        background: 'radial-gradient(ellipse 60% 80% at 20% 55%, rgba(155,31,255,0.20) 0%, transparent 65%)',
      }} />
      {/* Pink glow right */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        background: 'radial-gradient(ellipse 45% 60% at 80% 50%, rgba(255,45,120,0.12) 0%, transparent 60%)',
      }} />

      {/* Diagonal stripe overlay */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        backgroundImage: 'repeating-linear-gradient(-55deg, transparent, transparent 20px, rgba(255,255,255,0.018) 20px, rgba(255,255,255,0.018) 21px)',
      }} />

      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px', display: 'flex',
        background: 'linear-gradient(90deg, transparent, #ffe000 40%, #ff6a00 60%, transparent)',
      }} />
      {/* Bottom accent line */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', display: 'flex',
        background: 'linear-gradient(90deg, #ff2d78, #9b1fff)',
      }} />

      {/* Left color bar */}
      <div style={{
        position: 'absolute', left: 52, top: 70, bottom: 70, width: '4px', display: 'flex',
        background: 'linear-gradient(180deg, #ffe000, #ff6a00)',
        boxShadow: '0 0 12px #ffe000',
      }} />

      {/* ── LEFT COLUMN ── */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        paddingLeft: 80, paddingTop: 72, paddingRight: 40,
        flex: 1,
      }}>
        {/* Main title */}
        <div style={{
          display: 'flex', fontSize: 74, fontWeight: 900, color: '#ffffff',
          letterSpacing: '-1px', lineHeight: 1,
          textShadow: '0 0 40px rgba(255,224,0,0.3)',
        }}>
          FIGHT DATA ARENA
        </div>

        {/* Subtitle */}
        <div style={{
          display: 'flex', fontSize: 20, color: 'rgba(255,255,255,0.28)',
          letterSpacing: '7px', marginTop: 14,
        }}>
          STREET FIGHTER 6 // FRAME DATA QUIZ
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 16, marginTop: 44 }}>
          {[['30', 'CHARACTERS'], ['1 562', 'MOVES'], ['14', 'MODES']].map(([val, label]) => (
            <div key={label} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '14px 22px',
              border: '1px solid rgba(255,224,0,0.25)',
              background: 'rgba(255,224,0,0.06)',
            }}>
              <div style={{ display: 'flex', fontSize: 38, fontWeight: 900, color: '#ffe000', lineHeight: 1 }}>{val}</div>
              <div style={{ display: 'flex', fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '3px', marginTop: 6 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Mode tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 30 }}>
          {['DAILY', 'WEEKLY', 'SURVIVAL', 'FLASH', 'DUEL', 'MULTI'].map(m => (
            <div key={m} style={{
              display: 'flex',
              padding: '5px 13px',
              border: '1px solid rgba(255,45,120,0.35)',
              color: '#ff2d78',
              fontSize: 12, letterSpacing: '3px',
            }}>
              {m}
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT COLUMN — Mock quiz panel ── */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        width: 360, marginRight: 56, marginTop: 56, marginBottom: 56,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.09)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Panel top accent */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px', display: 'flex',
          background: 'linear-gradient(90deg, transparent, #ff2d78, #9b1fff, transparent)',
        }} />

        {/* Panel header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '18px 20px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{
            display: 'flex',
            width: 3, height: 16,
            background: 'linear-gradient(180deg, #ff2d78, #9b1fff)',
          }} />
          <div style={{ display: 'flex', fontSize: 12, letterSpacing: '4px', color: '#ff2d78' }}>
            STARTUP FRAMES
          </div>
        </div>

        {/* Question */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '20px 20px 0' }}>
          <div style={{ display: 'flex', fontSize: 13, color: 'rgba(255,255,255,0.35)', letterSpacing: '2px' }}>
            WHAT IS THE STARTUP OF
          </div>
          <div style={{
            display: 'flex', fontSize: 22, fontWeight: 900, color: '#fff',
            letterSpacing: '1px', marginTop: 8,
          }}>
            RYU — ST.MK
          </div>
        </div>

        {/* Answer choices */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: '22px 20px 20px' }}>
          {[
            { letter: 'A', val: '5F',  correct: false },
            { letter: 'B', val: '8F',  correct: true  },
            { letter: 'C', val: '11F', correct: false },
            { letter: 'D', val: '14F', correct: false },
          ].map(({ letter, val, correct }) => (
            <div key={letter} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px',
              background: correct ? 'rgba(255,224,0,0.10)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${correct ? '#ffe000' : 'rgba(255,255,255,0.07)'}`,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 22, height: 22, flexShrink: 0,
                background: correct ? '#ffe000' : 'rgba(255,255,255,0.07)',
                color: correct ? '#000' : 'rgba(255,255,255,0.35)',
                fontSize: 11, fontWeight: 900,
              }}>{letter}</div>
              <div style={{
                display: 'flex', fontSize: 18, fontWeight: 900,
                color: correct ? '#ffe000' : 'rgba(255,255,255,0.5)',
              }}>{val}</div>
              {correct && (
                <div style={{
                  display: 'flex', marginLeft: 'auto',
                  fontSize: 11, letterSpacing: '2px', color: '#ffe000',
                }}>✓ CORRECT</div>
              )}
            </div>
          ))}
        </div>

        {/* Hitbox label at bottom */}
        <div style={{
          display: 'flex', justifyContent: 'center',
          padding: '0 20px 18px',
          fontSize: 10, letterSpacing: '3px',
          color: 'rgba(255,255,255,0.15)',
        }}>
          HITBOX GIF PREVIEW ABOVE EACH QUESTION
        </div>
      </div>
    </div>,
    { ...size },
  )
}

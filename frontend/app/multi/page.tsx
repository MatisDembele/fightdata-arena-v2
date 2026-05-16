'use client'
import Link from 'next/link'

export default function MultiPage() {
  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '24px',
      background: 'linear-gradient(160deg, #0d0010 0%, #1a0030 50%, #0d0015 100%)',
    }}>
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 'clamp(2rem, 6vw, 4rem)',
        letterSpacing: '10px', color: '#00ff99',
        textShadow: '0 0 20px #00ff99, 0 0 40px #00ff9955',
      }}>MULTIJOUEUR</div>
      <div style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '0.75rem', letterSpacing: '5px',
        color: '#00bbff', textShadow: '0 0 10px #00bbff',
      }}>COMING SOON</div>
      <div style={{
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: '1rem', color: 'rgba(255,255,255,0.35)',
        letterSpacing: '1px', textAlign: 'center', maxWidth: '400px',
      }}>
        Le mode multijoueur est en cours de développement.
      </div>
      <Link href="/" style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '0.65rem', letterSpacing: '4px',
        color: 'rgba(255,255,255,0.3)',
        textDecoration: 'none', marginTop: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.15)',
        paddingBottom: '2px',
      }}>← RETOUR</Link>
    </div>
  )
}

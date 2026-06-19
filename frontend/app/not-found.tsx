'use client'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Bebas Neue', sans-serif", textAlign: 'center', padding: '24px',
    }}>
      <div style={{
        fontSize: 'clamp(6rem, 20vw, 10rem)', letterSpacing: '8px', lineHeight: 1,
        color: '#ff2d78', textShadow: '0 0 30px #ff2d78, 0 0 60px rgba(255,45,120,0.4)',
      }}>404</div>
      <div style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '0.65rem', letterSpacing: '5px',
        color: 'rgba(255,255,255,0.7)', marginTop: '12px', marginBottom: '40px',
      }}>PAGE NOT FOUND</div>
      <Link href="/" style={{
        background: 'none', border: '1px solid #ffe000', color: '#ffe000',
        fontFamily: "'Bebas Neue', sans-serif", fontSize: '1rem', letterSpacing: '4px',
        padding: '12px 32px', textDecoration: 'none',
        textShadow: '0 0 8px rgba(255,224,0,0.4)',
      }}>← HOME</Link>
    </div>
  )
}

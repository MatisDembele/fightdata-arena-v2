'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/',         label: 'ACCUEIL' },
  { href: '/quiz',     label: 'QUIZ' },
  { href: '/fighters', label: 'DATABASE' },
  { href: '/multi',    label: 'MULTI' },
]

export default function Navbar() {
  const path = usePathname()

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 48px', height: '60px',
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      {/* Ligne gradient bas */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent, var(--purple), var(--pink), var(--orange), var(--yellow), transparent)',
      }} />

      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}>
        <span style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '1.4rem', letterSpacing: '5px',
          color: '#fff',
        }}>FIGHT </span>
        <span style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '1.4rem', letterSpacing: '5px',
          color: 'var(--yellow)',
        }}>DATA </span>
        <span style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '1.4rem', letterSpacing: '5px',
          background: 'linear-gradient(90deg, var(--pink), var(--orange))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>ARENA</span>
      </Link>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '0' }}>
        {links.map(link => {
          const isActive = path === link.href || (link.href !== '/' && path.startsWith(link.href))
          return (
            <Link key={link.href} href={link.href} style={{
              padding: '8px 20px', textDecoration: 'none',
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '0.85rem', letterSpacing: '3px',
              color: isActive ? 'var(--yellow)' : 'rgba(255,255,255,0.45)',
              borderBottom: isActive ? '2px solid var(--yellow)' : '2px solid transparent',
              transition: 'all 0.2s',
              textShadow: isActive ? '0 0 12px rgba(255,224,0,0.5)' : 'none',
            }}>
              {link.label}
            </Link>
          )
        })}
      </div>

      {/* Badge */}
      <div style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '0.6rem', letterSpacing: '2px',
        color: 'rgba(255,255,255,0.25)',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '4px 10px',
      }}>SF6 // 2026</div>
    </nav>
  )
}

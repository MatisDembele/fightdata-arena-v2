'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/',         label: 'ACCUEIL' },
  { href: '/quiz',     label: 'QUIZ' },
  { href: '/fighters', label: 'DATABASE' },
]

export default function Navbar() {
  const path = usePathname()

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 40px', height: '64px',
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      position: 'relative',
    }}>
      {/* Ligne gradient bas */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
        background: 'linear-gradient(90deg, var(--purple), var(--pink), var(--orange), var(--yellow))',
      }} />

      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none' }}>
        <span className="font-bebas" style={{
          fontSize: '1.6rem', letterSpacing: '6px',
          background: 'linear-gradient(90deg, #fff 0%, var(--yellow) 50%, var(--pink) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          FIGHT DATA ARENA
        </span>
      </Link>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {links.map(link => (
          <Link key={link.href} href={link.href} style={{
            padding: '8px 24px', textDecoration: 'none',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '0.95rem', letterSpacing: '3px',
            color: path === link.href ? 'var(--yellow)' : 'rgba(255,255,255,0.5)',
            borderBottom: path === link.href ? '2px solid var(--yellow)' : '2px solid transparent',
            transition: 'all 0.2s',
          }}>
            {link.label}
          </Link>
        ))}
      </div>

      {/* Badge patch */}
      <span className="font-mono" style={{
        fontSize: '0.65rem', letterSpacing: '2px',
        color: 'rgba(255,255,255,0.35)',
        border: '1px solid rgba(255,255,255,0.12)',
        padding: '4px 12px',
      }}>
        SF6 // 2026
      </span>
    </nav>
  )
}

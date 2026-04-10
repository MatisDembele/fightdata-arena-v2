"""
Fight Data Arena — Polish Global Frontend
Lance depuis C:\\Users\\matis\\OneDrive\\Bureau\\FDA\\
"""
from pathlib import Path

FILES = {

"frontend/app/globals.css": """
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --pink:   #ff2d78;
  --purple: #9b1fff;
  --orange: #ff6a00;
  --yellow: #ffe000;
  --cyan:   #00f0ff;
  --dark:   #0d0010;
  --dark2:  #130020;
  --dark3:  #1a0030;
  --border: rgba(255,255,255,0.08);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html { scroll-behavior: smooth; }

body {
  background: var(--dark);
  color: #fff;
  font-family: 'Rajdhani', sans-serif;
  min-height: 100vh;
  overflow-x: hidden;
}

/* ── Backgrounds ── */
.sf6-bg {
  position: fixed; inset: 0; z-index: 0;
  background:
    radial-gradient(ellipse 80% 60% at 20% 50%, rgba(155,31,255,0.4) 0%, transparent 60%),
    radial-gradient(ellipse 70% 70% at 80% 30%, rgba(255,45,120,0.35) 0%, transparent 55%),
    radial-gradient(ellipse 60% 50% at 60% 80%, rgba(255,106,0,0.25) 0%, transparent 50%),
    linear-gradient(135deg, #0d0010 0%, #1a0030 40%, #0d0015 100%);
}

.sf6-grid {
  position: fixed; inset: 0; z-index: 1;
  background-image:
    linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
}

/* ── Animations ── */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes glowPulse {
  0%, 100% { filter: drop-shadow(0 0 8px rgba(255,45,120,0.4)); }
  50%       { filter: drop-shadow(0 0 20px rgba(255,45,120,0.8)); }
}

@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}

@keyframes scanline {
  0%   { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
}

.animate-fadeInUp  { animation: fadeInUp 0.5s ease forwards; }
.animate-fadeIn    { animation: fadeIn 0.3s ease forwards; }
.animate-glow      { animation: glowPulse 2s ease-in-out infinite; }

/* Délais d'animation */
.delay-1 { animation-delay: 0.1s; opacity: 0; }
.delay-2 { animation-delay: 0.2s; opacity: 0; }
.delay-3 { animation-delay: 0.3s; opacity: 0; }
.delay-4 { animation-delay: 0.4s; opacity: 0; }

/* ── Utilitaires ── */
.font-bebas { font-family: 'Bebas Neue', sans-serif; }
.font-mono  { font-family: 'Share Tech Mono', monospace; }
.font-raj   { font-family: 'Rajdhani', sans-serif; }

.text-gradient-pink {
  background: linear-gradient(90deg, #fff 0%, var(--yellow) 40%, var(--pink) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.text-gradient-cyan {
  background: linear-gradient(90deg, var(--cyan), var(--purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ── Boutons ── */
.btn-primary {
  display: inline-block;
  padding: 14px 36px;
  background: linear-gradient(90deg, var(--purple), var(--pink));
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1rem; letter-spacing: 4px; color: #fff;
  border: none; cursor: pointer;
  box-shadow: 0 0 20px rgba(255,45,120,0.3);
  transition: all 0.2s;
  text-decoration: none;
  position: relative; overflow: hidden;
}
.btn-primary::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  transform: translateX(-100%);
  transition: transform 0.4s;
}
.btn-primary:hover { box-shadow: 0 0 32px rgba(255,45,120,0.6); transform: translateY(-2px); }
.btn-primary:hover::after { transform: translateX(100%); }

.btn-secondary {
  display: inline-block;
  padding: 14px 36px;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.2);
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1rem; letter-spacing: 4px; color: rgba(255,255,255,0.7);
  cursor: pointer; transition: all 0.2s;
  text-decoration: none;
}
.btn-secondary:hover {
  border-color: rgba(255,255,255,0.5);
  color: #fff;
  background: rgba(255,255,255,0.05);
}

/* ── Cards ── */
.card-sf6 {
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.08);
  transition: all 0.2s;
}
.card-sf6:hover {
  border-color: rgba(255,255,255,0.15);
  background: rgba(0,0,0,0.55);
}

/* ── Scrollbar ── */
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
::-webkit-scrollbar-thumb { background: rgba(255,45,120,0.4); border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,45,120,0.7); }

/* ── Selection ── */
::selection { background: rgba(255,45,120,0.3); color: #fff; }
""",

"frontend/app/layout.tsx": """
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fight Data Arena — SF6 Frame Data',
  description: 'Quiz et base de données de frame data Street Fighter 6. Startup, active, recovery pour tous les personnages.',
  keywords: 'Street Fighter 6, frame data, quiz, startup, SF6, fighting game',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="sf6-bg" />
        <div className="sf6-grid" />
        <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh' }}>
          {children}
        </div>
      </body>
    </html>
  )
}
""",

"frontend/components/Navbar.tsx": """
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
""",

"frontend/app/page.tsx": """
'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const MODES = [
  {
    id: 'quiz', label: 'QUIZ', sub: 'Teste tes connaissances',
    href: '/quiz',
    color: '#ff2d78', colorAlt: '#9b1fff',
    desc: 'Devine le startup, le damage ou le on-block de chaque move depuis son hitbox GIF.',
  },
  {
    id: 'database', label: 'DATABASE', sub: 'Frame data complète',
    href: '/fighters',
    color: '#00f0ff', colorAlt: '#0050ff',
    desc: 'Accède aux données de frame de tous les personnages SF6. Startup, active, recovery et plus.',
  },
  {
    id: 'compare', label: 'COMPARE', sub: 'Comparaison de persos',
    href: '/compare',
    color: '#ffe000', colorAlt: '#ff6a00',
    desc: 'Compare les statistiques et les moves de deux personnages côte à côte.',
  },
]

const STATS = [
  { val: '29',   label: 'PERSOS' },
  { val: '1418', label: 'MOVES' },
  { val: '3',    label: 'MODES' },
]

export default function Home() {
  const [active, setActive]   = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const current = MODES[active]

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>

      {/* BG dynamique */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        transition: 'all 0.6s ease',
        background: `
          radial-gradient(ellipse 100% 80% at 50% 100%, ${current.color}20 0%, transparent 60%),
          radial-gradient(ellipse 80% 60% at 15% 50%, ${current.colorAlt}30 0%, transparent 55%),
          radial-gradient(ellipse 70% 70% at 85% 30%, ${current.color}20 0%, transparent 55%),
          linear-gradient(160deg, #0d0010 0%, #1a0030 50%, #0d0015 100%)
        `,
      }} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Bande centrale */}
      <div style={{
        position: 'absolute', top: '50%', left: 0, right: 0,
        transform: 'translateY(-50%)', height: '50vh', zIndex: 2,
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(90deg, ${current.colorAlt}30, ${current.color}20, ${current.colorAlt}30)`,
          transition: 'all 0.5s',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'repeating-linear-gradient(-55deg, transparent, transparent 20px, rgba(255,255,255,0.015) 20px, rgba(255,255,255,0.015) 21px)',
        }} />
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: `linear-gradient(90deg, transparent, ${current.color}, ${current.colorAlt}, transparent)`,
          boxShadow: `0 0 16px ${current.color}`,
          transition: 'all 0.5s',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
          background: `linear-gradient(90deg, transparent, ${current.colorAlt}, ${current.color}, transparent)`,
          boxShadow: `0 0 16px ${current.colorAlt}`,
          transition: 'all 0.5s',
        }} />
      </div>

      {/* Contenu */}
      <div style={{
        position: 'relative', zIndex: 10,
        height: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '40px 0 48px',
      }}>

        {/* Titre */}
        <div style={{ textAlign: 'center' }} className={mounted ? 'animate-fadeInUp' : ''}>
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
            letterSpacing: '10px', lineHeight: 1,
            color: '#fff',
            textShadow: `0 0 12px ${current.color}, 0 0 30px ${current.color}88, 0 0 60px ${current.colorAlt}44`,
            WebkitTextStroke: `1px ${current.color}55`,
            transition: 'text-shadow 0.5s',
          }}>FIGHT DATA ARENA</h1>
          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '0.65rem', letterSpacing: '7px',
            color: 'rgba(255,255,255,0.25)', marginTop: '8px',
          }}>STREET FIGHTER 6 // FRAME DATA ENCYCLOPEDIA</div>
        </div>

        {/* Description */}
        <div style={{ textAlign: 'center', maxWidth: '480px', padding: '0 24px' }}>
          <p style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '1rem', fontWeight: 500, lineHeight: 1.6,
            color: 'rgba(255,255,255,0.45)', letterSpacing: '0.5px',
            transition: 'all 0.3s',
          }}>{current.desc}</p>
        </div>

        {/* Modes */}
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <button
            onClick={() => setActive(a => (a - 1 + MODES.length) % MODES.length)}
            style={{
              width: '56px', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem',
              color: 'rgba(255,255,255,0.35)', marginLeft: '40px',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
          >«</button>

          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '0' }}>
            {MODES.map((mode, i) => {
              const isActive = i === active
              return (
                <Link
                  key={mode.id}
                  href={mode.href}
                  onMouseEnter={() => setActive(i)}
                  style={{
                    textDecoration: 'none',
                    flex: isActive ? '0 0 320px' : '0 0 200px',
                    textAlign: 'center',
                    padding: isActive ? '24px 28px 28px' : '18px 20px 24px',
                    transition: 'all 0.3s ease',
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: isActive ? `linear-gradient(180deg, ${mode.color}18, ${mode.colorAlt}28)` : 'rgba(0,0,0,0.15)',
                    transition: 'all 0.3s',
                  }} />
                  {isActive && (
                    <>
                      <div style={{
                        position: 'absolute', top: 0, left: '15%', right: '15%', height: '2px',
                        background: `linear-gradient(90deg, transparent, ${mode.color}, transparent)`,
                        boxShadow: `0 0 10px ${mode.color}`,
                      }} />
                      <div style={{
                        position: 'absolute', top: '-8px', left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0, height: 0,
                        borderLeft: '7px solid transparent',
                        borderRight: '7px solid transparent',
                        borderBottom: `7px solid ${mode.color}`,
                        filter: `drop-shadow(0 0 5px ${mode.color})`,
                      }} />
                    </>
                  )}
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: isActive ? 'clamp(2rem, 4vw, 3rem)' : 'clamp(1.2rem, 2.5vw, 1.8rem)',
                      letterSpacing: isActive ? '6px' : '4px',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.3)',
                      textShadow: isActive ? `0 0 20px ${mode.color}, 0 0 40px ${mode.color}55` : 'none',
                      transition: 'all 0.3s', lineHeight: 1,
                    }}>{mode.label}</div>
                    <div style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: isActive ? '0.62rem' : '0.52rem',
                      letterSpacing: '3px',
                      color: isActive ? mode.color : 'rgba(255,255,255,0.18)',
                      marginTop: '6px',
                      textShadow: isActive ? `0 0 8px ${mode.color}` : 'none',
                      transition: 'all 0.3s',
                    }}>{mode.sub}</div>
                  </div>
                </Link>
              )
            })}
          </div>

          <button
            onClick={() => setActive(a => (a + 1) % MODES.length)}
            style={{
              width: '56px', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem',
              color: 'rgba(255,255,255,0.35)', marginRight: '40px',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
          >»</button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '48px', alignItems: 'center' }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '2rem', letterSpacing: '2px',
                color: current.color,
                textShadow: `0 0 12px ${current.color}`,
                transition: 'all 0.3s',
              }}>{s.val}</div>
              <div style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.55rem', letterSpacing: '3px',
                color: 'rgba(255,255,255,0.25)',
              }}>{s.label}</div>
            </div>
          ))}
          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '0.55rem', letterSpacing: '3px',
            color: 'rgba(255,255,255,0.15)',
          }}>PATCH MARCH 2026</div>
        </div>

      </div>
    </div>
  )
}
""",

}

BASE = Path(".")
print("Fight Data Arena — Polish global\n")
for path, content in FILES.items():
    full = BASE / path
    full.parent.mkdir(parents=True, exist_ok=True)
    full.write_text(content.lstrip('\n'), encoding='utf-8')
    print(f"  ✅ {path}")

print("\n✅ Polish appliqué !")
print("\nLance ensuite :")
print("  git add -A && git commit -m 'polish global UI' && git push")

import Navbar from '@/components/Navbar'

export default function FightersPage() {
  return (
    <>
      <Navbar />
      <main style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: 'calc(100vh - 64px)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 className="font-bebas" style={{
            fontSize: '3rem', letterSpacing: '6px',
            color: 'rgba(255,255,255,0.2)',
          }}>BASE DE DONNÉES</h1>
          <p className="font-mono" style={{
            color: 'rgba(255,255,255,0.2)', letterSpacing: '3px', fontSize: '0.7rem',
            marginTop: '12px',
          }}>COMING SOON</p>
        </div>
      </main>
    </>
  )
}

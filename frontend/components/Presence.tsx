'use client'
import { useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Lightweight presence heartbeat: each open tab pings every 30s so the admin
// dashboard can show how many sessions are online (within a 60s window).
export default function Presence() {
  useEffect(() => {
    let sid = sessionStorage.getItem('fda_sid')
    if (!sid) {
      sid = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36))
      sessionStorage.setItem('fda_sid', sid)
    }

    const ping = () => {
      fetch(`${API_URL}/api/presence/ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sid }),
        keepalive: true,
      }).catch(() => {})
    }

    ping()
    const id = setInterval(() => { if (document.visibilityState === 'visible') ping() }, 30000)
    const onVis = () => { if (document.visibilityState === 'visible') ping() }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  return null
}

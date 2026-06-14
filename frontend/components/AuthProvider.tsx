'use client'
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { getAuth, setAuth, clearAuth, type AuthUser } from '@/lib/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  login: (token: string, user: AuthUser) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null, token: null, isLoading: true,
  login: async () => {}, logout: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null)
  const [token, setToken]     = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const auth = getAuth()
    if (auth) { setUser(auth.user); setToken(auth.token) }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (tok: string, usr: AuthUser) => {
    setAuth({ token: tok, user: usr })
    setUser(usr)
    setToken(tok)

    // Fetch cloud profile and merge with localStorage
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${tok}` },
      })
      if (res.ok) {
        const { profile } = await res.json() as {
          profile: {
            achievements: Record<string, number>
            lifetime: Record<string, unknown>
            history: Array<Record<string, unknown>>
            mode_bests: Record<string, unknown>
          }
        }

        // Achievements: union — keep all from both, local wins on conflict
        const localAch = JSON.parse(localStorage.getItem('fda_achievements') || '{}') as Record<string, number>
        localStorage.setItem('fda_achievements', JSON.stringify({ ...profile.achievements, ...localAch }))

        // Lifetime: take max numeric values, union arrays
        const localLt = JSON.parse(localStorage.getItem('fda_lifetime') || '{}') as Record<string, unknown>
        const cloudLt = profile.lifetime || {}
        const mergedLt: Record<string, unknown> = {}
        for (const key of new Set([...Object.keys(localLt), ...Object.keys(cloudLt)])) {
          const lv = localLt[key]; const cv = cloudLt[key]
          if (typeof lv === 'number' && typeof cv === 'number') {
            mergedLt[key] = Math.max(lv, cv)
          } else if (Array.isArray(lv) || Array.isArray(cv)) {
            mergedLt[key] = [...new Set([...(Array.isArray(lv) ? lv : []), ...(Array.isArray(cv) ? cv : [])])]
          } else if (lv !== undefined && lv !== null) {
            mergedLt[key] = lv
          } else {
            mergedLt[key] = cv
          }
        }
        localStorage.setItem('fda_lifetime', JSON.stringify(mergedLt))

        // History: merge local + cloud, deduplicate, keep latest 30
        const localHist = JSON.parse(localStorage.getItem('fda_history') || '[]') as Array<Record<string, unknown>>
        const cloudHist = profile.history || []
        const seen = new Set<string>()
        const mergedHist = [...localHist, ...cloudHist].filter(r => {
          const key = `${r.date}|${r.mode}|${r.score}|${r.total}`
          if (seen.has(key)) return false
          seen.add(key); return true
        }).slice(0, 30)
        localStorage.setItem('fda_history', JSON.stringify(mergedHist))

        // Mode bests: merge — take max per numeric field, restore missing keys from cloud
        const cloudBests = profile.mode_bests || {}
        for (const [modeKey, cloudVal] of Object.entries(cloudBests)) {
          // Determine the localStorage key
          let lsKey: string
          if (modeKey.startsWith('fighter_')) {
            lsKey = `fda_best_${modeKey}` // fda_best_fighter_ryu
          } else if (modeKey === 'survival') {
            lsKey = 'fda_survival_best'
          } else if (modeKey === 'flash') {
            lsKey = 'fda_flash_best'
          } else if (modeKey === 'custom') {
            lsKey = 'fda_best_custom'
          } else {
            lsKey = `fda_best_${modeKey}`
          }
          const localRaw = localStorage.getItem(lsKey)
          if (!localRaw) {
            // Nothing local — restore from cloud
            localStorage.setItem(lsKey, JSON.stringify(cloudVal))
          } else {
            // Take max of each numeric field
            const localVal = JSON.parse(localRaw) as Record<string, number>
            const cv = cloudVal as Record<string, number>
            const merged: Record<string, number> = {}
            for (const field of new Set([...Object.keys(localVal), ...Object.keys(cv)])) {
              const lf = localVal[field] ?? 0
              const cf = cv[field] ?? 0
              merged[field] = typeof lf === 'number' && typeof cf === 'number' ? Math.max(lf, cf) : lf
            }
            localStorage.setItem(lsKey, JSON.stringify(merged))
          }
        }
      }
    } catch { /* ignore fetch errors */ }

    // Sync merged local data to cloud
    try {
      const achievements = JSON.parse(localStorage.getItem('fda_achievements') || '{}')
      const lifetime     = JSON.parse(localStorage.getItem('fda_lifetime') || '{}')
      const history      = JSON.parse(localStorage.getItem('fda_history') || '[]')
      await fetch(`${API_URL}/api/auth/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
        body: JSON.stringify({ achievements, lifetime, history }),
      })
    } catch { /* ignore sync errors */ }
  }, [])

  const logout = useCallback(() => {
    clearAuth()
    setUser(null)
    setToken(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

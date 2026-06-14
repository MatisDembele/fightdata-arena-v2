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
        const { profile } = await res.json() as { profile: { achievements: Record<string, number>; lifetime: Record<string, unknown>; history: unknown[] } }

        // Achievements: union (keep all from both local and cloud)
        const localAch = JSON.parse(localStorage.getItem('fda_achievements') || '{}') as Record<string, number>
        const mergedAch = { ...profile.achievements, ...localAch }
        localStorage.setItem('fda_achievements', JSON.stringify(mergedAch))

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

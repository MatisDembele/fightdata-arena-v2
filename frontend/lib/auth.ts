const AUTH_KEY = 'fda_auth'

export interface AuthUser {
  id: number
  discord_id: string
  username: string
}

export interface AuthState {
  token: string
  user: AuthUser
}

export function getAuth(): AuthState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? (JSON.parse(raw) as AuthState) : null
  } catch {
    return null
  }
}

export function setAuth(state: AuthState): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(state))
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_KEY)
}

export function getDiscordOAuthUrl(): string {
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ?? ''
  const redirectUri = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI ?? ''
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify',
  })
  return `https://discord.com/oauth2/authorize?${params.toString()}`
}

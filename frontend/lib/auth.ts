const AUTH_KEY = 'fda_auth'

export interface AuthUser {
  id: number
  discord_id: string
  username: string
  avatar: string | null
}

export function getDiscordAvatarUrl(user: AuthUser, size = 128): string | null {
  if (!user.avatar) return null
  return `https://cdn.discordapp.com/avatars/${user.discord_id}/${user.avatar}.png?size=${size}`
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
  // Derive redirect URI from the current domain so it works in any environment
  const redirectUri = typeof window !== 'undefined'
    ? `${window.location.origin}/connect`
    : (process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI ?? '')
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify',
  })
  return `https://discord.com/oauth2/authorize?${params.toString()}`
}

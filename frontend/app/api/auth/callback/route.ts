import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function GET(req: NextRequest) {
  const code  = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL('/?auth=cancelled', req.url))
  }

  try {
    // Pass the actual redirect_uri so the backend uses the same value during token exchange
    const redirectUri = new URL('/api/auth/callback', req.url).toString()
    const res = await fetch(
      `${API_URL}/api/auth/discord/callback?code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(redirectUri)}`,
      { cache: 'no-store' },
    )
    if (!res.ok) throw new Error('Backend auth failed')

    const data = (await res.json()) as {
      token: string
      user: { id: number; username: string; discord_id: string }
    }

    // Pass auth data to client page via query params — page immediately
    // stores in localStorage and replaces the URL, so params are ephemeral.
    const dest = new URL('/auth/callback', req.url)
    dest.searchParams.set('token', data.token)
    dest.searchParams.set('uid', String(data.user.id))
    dest.searchParams.set('username', data.user.username)
    dest.searchParams.set('did', data.user.discord_id)
    return NextResponse.redirect(dest)
  } catch {
    return NextResponse.redirect(new URL('/?auth=error', req.url))
  }
}

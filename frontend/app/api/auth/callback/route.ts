import { NextRequest, NextResponse } from 'next/server'

// This route ONLY passes the Discord code to the client-side callback page.
// The actual backend call happens client-side to avoid the Vercel 10s timeout.
export async function GET(req: NextRequest) {
  const code  = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error || !code) {
    const res = NextResponse.redirect(new URL('/?auth=cancelled', req.url))
    res.headers.set('Cache-Control', 'no-store')
    return res
  }

  // Pass code + the redirect_uri (needed for Discord token exchange) to the client page
  const redirectUri = new URL('/api/auth/callback', req.url).toString()
  const dest = new URL('/auth/callback', req.url)
  dest.searchParams.set('code', code)
  dest.searchParams.set('redirect_uri', redirectUri)
  const res = NextResponse.redirect(dest)
  res.headers.set('Cache-Control', 'no-store')
  return res
}

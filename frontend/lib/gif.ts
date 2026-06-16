// Resolves the best animated source for a move's hitbox.
//
// Priority:
//   1. Our optimized animated WebP on the CDN (NEXT_PUBLIC_GIF_CDN) — ~60-80% smaller
//      than the original GIF and served from a fast edge. Derived from gif_path.
//   2. gif_url — the original GIF (ultimateframedata.com). Fallback if the WebP is
//      missing/unsupported.
//   3. API_URL/gif_path — last-resort local backend path.
//
// The CDN base is set once in Vercel env (e.g. https://<store>.public.blob.vercel-storage.com)
// and the WebP files are uploaded under the same `gifs/...` path as gif_path.

const CDN = process.env.NEXT_PUBLIC_GIF_CDN
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function gifSources(gifUrl?: string | null, gifPath?: string | null): string[] {
  const out: string[] = []
  if (CDN && gifPath) out.push(`${CDN}/${gifPath.replace(/\.gif$/i, '.webp')}`)
  if (gifUrl) out.push(gifUrl)
  if (gifPath) out.push(`${API_URL}/${gifPath}`)
  return out
}

// Best single source to display/preload.
export function primaryGifSrc(gifUrl?: string | null, gifPath?: string | null): string | undefined {
  return gifSources(gifUrl, gifPath)[0]
}

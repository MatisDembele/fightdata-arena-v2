// Upload optimized animated WebP hitboxes to Vercel Blob.
//
// Prereqs:
//   1. Convert GIFs → WebP first:  python backend/scripts/convert_gifs_to_webp.py
//      (or the equivalent ffmpeg loop) so data/gifs/<fighter>/<move>.webp exist.
//   2. Create a Blob store in the Vercel dashboard (Storage → Blob) and copy its
//      read/write token.
//   3. From the `frontend/` folder:
//        npm i -D @vercel/blob
//        BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxx" node scripts/upload_gifs_to_blob.mjs
//
// Files are uploaded with a STABLE path (gifs/<fighter>/<move>.webp, no random
// suffix), so the public URL is predictable:
//   https://<store>.public.blob.vercel-storage.com/gifs/<fighter>/<move>.webp
//
// At the end it prints the value to set as NEXT_PUBLIC_GIF_CDN in Vercel.
//
// Re-runnable: existing blobs are skipped (pass --force to re-upload).

import { readdir, readFile } from 'node:fs/promises'
import { join, relative, sep, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { put, list } from '@vercel/blob'

const __dirname = dirname(fileURLToPath(import.meta.url))
const GIF_DIR = join(__dirname, '..', '..', 'data', 'gifs')
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN
const FORCE = process.argv.includes('--force')
const CONCURRENCY = 8

if (!TOKEN) {
  console.error('ERROR: set BLOB_READ_WRITE_TOKEN (from Vercel → Storage → Blob).')
  process.exit(1)
}

async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...await walk(full))
    else if (entry.name.toLowerCase().endsWith('.webp')) out.push(full)
  }
  return out
}

async function existingPathnames() {
  const set = new Set()
  let cursor
  do {
    const res = await list({ token: TOKEN, cursor, limit: 1000, prefix: 'gifs/' })
    for (const b of res.blobs) set.add(b.pathname)
    cursor = res.cursor
  } while (cursor)
  return set
}

async function main() {
  const files = await walk(GIF_DIR)
  if (files.length === 0) {
    console.error(`No .webp found in ${GIF_DIR}. Run the GIF→WebP conversion first.`)
    process.exit(1)
  }
  console.log(`Found ${files.length} WebP files.`)

  const existing = FORCE ? new Set() : await existingPathnames()
  if (existing.size) console.log(`${existing.size} already on Blob — will skip those.`)

  let done = 0, skipped = 0, failed = 0, baseUrl = ''
  let i = 0

  async function worker() {
    while (i < files.length) {
      const file = files[i++]
      const pathname = `gifs/${relative(GIF_DIR, file).split(sep).join('/')}`
      if (existing.has(pathname)) { skipped++; continue }
      try {
        const body = await readFile(file)
        const res = await put(pathname, body, {
          access: 'public',
          addRandomSuffix: false,
          contentType: 'image/webp',
          token: TOKEN,
        })
        if (!baseUrl) baseUrl = res.url.slice(0, res.url.length - pathname.length).replace(/\/$/, '')
        done++
        if ((done + skipped) % 50 === 0) console.log(`  ${done + skipped}/${files.length}…`)
      } catch (err) {
        failed++
        console.error(`  ✗ ${pathname}: ${err?.message ?? err}`)
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker))

  console.log(`\nUploaded ${done} · skipped ${skipped} · failed ${failed}`)
  if (baseUrl) {
    console.log(`\n➡  Set this in Vercel (Project → Settings → Environment Variables), then redeploy:`)
    console.log(`   NEXT_PUBLIC_GIF_CDN = ${baseUrl}`)
  }
}

main()

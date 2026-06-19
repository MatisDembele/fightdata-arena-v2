// Upload optimized animated WebP hitboxes to Cloudflare R2 (S3-compatible).
//
// Prereqs:
//   1. Convert GIFs → WebP first (python backend/scripts/convert_gifs_to_webp.py),
//      so data/gifs/<fighter>/<move>.webp exist.
//   2. Create an R2 bucket in the Cloudflare dashboard and enable public access
//      (r2.dev subdomain or a custom domain).
//   3. Create an R2 API token (Object Read & Write) → Access Key ID + Secret.
//   4. From the `frontend/` folder:
//        npm i -D @aws-sdk/client-s3
//        R2_ACCOUNT_ID=xxx R2_ACCESS_KEY_ID=xxx R2_SECRET_ACCESS_KEY=xxx R2_BUCKET=fda-gifs \
//          node scripts/upload_gifs_to_r2.mjs --force
//
// Files keep a STABLE key (gifs/<fighter>/<move>.webp), so the public URL is:
//   https://<public-r2-base>/gifs/<fighter>/<move>.webp
// Set that <public-r2-base> as NEXT_PUBLIC_GIF_CDN in Vercel, then redeploy.
//
// Re-runnable: existing objects are skipped unless --force is passed.

import { readdir, readFile } from 'node:fs/promises'
import { join, relative, sep, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'

const __dirname = dirname(fileURLToPath(import.meta.url))
const GIF_DIR = join(__dirname, '..', '..', 'data', 'gifs')

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env
const FORCE = process.argv.includes('--force')
const CONCURRENCY = 12

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
  console.error('ERROR: set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET.')
  process.exit(1)
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
})

async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...await walk(full))
    else if (entry.name.toLowerCase().endsWith('.webp')) out.push(full)
  }
  return out
}

async function objectExists(key) {
  try { await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key })); return true }
  catch { return false }
}

async function main() {
  const files = await walk(GIF_DIR)
  if (files.length === 0) {
    console.error(`No .webp found in ${GIF_DIR}. Run the GIF→WebP conversion first.`)
    process.exit(1)
  }
  console.log(`Found ${files.length} WebP files. Uploading to R2 bucket "${R2_BUCKET}"…`)

  let i = 0, done = 0, skipped = 0, failed = 0
  async function worker() {
    while (i < files.length) {
      const file = files[i++]
      const key = `gifs/${relative(GIF_DIR, file).split(sep).join('/')}`
      try {
        if (!FORCE && await objectExists(key)) { skipped++; continue }
        const body = await readFile(file)
        await s3.send(new PutObjectCommand({
          Bucket: R2_BUCKET, Key: key, Body: body,
          ContentType: 'image/webp',
          CacheControl: 'public, max-age=31536000, immutable',
        }))
        done++
        if ((done + skipped) % 50 === 0) console.log(`  ${done + skipped}/${files.length}…`)
      } catch (err) {
        failed++
        console.error(`  ✗ ${key}: ${err?.message ?? err}`)
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))

  console.log(`\nUploaded ${done} · skipped ${skipped} · failed ${failed}`)
  console.log('\nNext: set NEXT_PUBLIC_GIF_CDN to your bucket public base URL (e.g. https://pub-xxxx.r2.dev) in Vercel, then redeploy.')
}

main()

import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import https from 'node:https'

const [input, output, allowedHost] = process.argv.slice(2)
if (!input || !output || !allowedHost) throw new Error('Usage: node travel-memory-media-adoption-hash.mjs <media.json> <results.json> <allowed-host>')

const media = JSON.parse(await readFile(input, 'utf8')).media
if (!Array.isArray(media)) throw new Error('Expected media array')
const results = []
let next = 0

async function hashMedia(item) {
  const url = new URL(item.url)
  if (url.protocol !== 'https:' || url.hostname !== allowedHost || url.username || url.password || url.search || url.hash) {
    throw new Error('Media URL is outside the approved host')
  }
  return new Promise((resolve, reject) => {
    const request = https.get(url, { timeout: 60000 }, response => {
      if (response.statusCode !== 200 || response.headers['content-type']?.split(';')[0] !== item.mime_type) {
        response.destroy()
        reject(new Error(`Unexpected HTTP status or MIME: ${response.statusCode}`))
        return
      }
      const digest = createHash('sha256')
      let bytes = 0
      response.on('data', chunk => { bytes += chunk.length; digest.update(chunk) })
      response.on('end', () => {
        if (bytes !== Number(item.filesize) || Number(response.headers['content-length']) !== bytes) {
          reject(new Error(`Byte length mismatch: fetched ${bytes}, Current ${item.filesize}`))
          return
        }
        resolve({ id: item.id, assetId: `sha256:${digest.digest('hex')}`, bytes, mimeType: item.mime_type })
      })
      response.on('error', reject)
    })
    request.on('timeout', () => request.destroy(new Error('Media request timed out')))
    request.on('error', reject)
  })
}

async function worker() {
  while (next < media.length) {
    const item = media[next++]
    try { results.push(await hashMedia(item)) }
    catch (error) { results.push({ id: item.id, error: String(error.message || error) }) }
    if (results.length % 20 === 0) process.stderr.write(`Hashed ${results.length}/${media.length}\n`)
  }
}

await Promise.all(Array.from({ length: 6 }, worker))
results.sort((a, b) => a.id - b.id)
await writeFile(output, `${JSON.stringify({ checkedAt: new Date().toISOString(), host: allowedHost, results }, null, 2)}\n`)
process.stdout.write(`${JSON.stringify({ total: results.length, verified: results.filter(item => item.assetId).length, failed: results.filter(item => item.error).length })}\n`)

const { chromium } = require('/Users/tien-hsinglee/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const fs = require('node:fs/promises')
const path = require('node:path')
const sharp = require('/Users/tien-hsinglee/Project/li-family-web/node_modules/sharp')
const phase = process.argv[2]
const port = Number(process.argv[3])
if (!['before', 'after'].includes(phase) || !Number.isInteger(port)) throw Error('usage: capture before|after port')
const output = '/Users/tien-hsinglee/Project/li-family-web/output/playwright'
const cases = [
  ['portal', '/'],
  ['editorial', '/travel/synthetic-editorial/day/day-03'],
  ['cinematic', '/travel/synthetic-cinematic'],
]
const sizes = [
  ['desktop', 1440, 1000],
  ['tablet', 768, 1024],
  ['mobile', 390, 844],
]
;(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox'],
  })
  const results = []
  try {
    for (const [surface, route] of cases) {
      for (const [viewport, width, height] of sizes) {
        const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: 'no-preference', serviceWorkers: 'block' })
        await context.route('**/*', async requestRoute => {
          const url = new URL(requestRoute.request().url())
          if (url.hostname === '127.0.0.1') await requestRoute.continue()
          else await requestRoute.abort('blockedbyclient')
        })
        const page = await context.newPage()
        const errors = []
        page.on('pageerror', error => errors.push(`page: ${error.message}`))
        page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`) })
        const response = await page.goto(`http://127.0.0.1:${port}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
        await page.locator('main').first().waitFor({ timeout: 30000 })
        const lazyImages = await page.evaluate(() => Array.from(document.images).filter(img => img.loading === 'lazy').length)
        const imageCount = await page.locator('img').count()
        for (let imageIndex = 0; imageIndex < imageCount; imageIndex++) {
          const img = page.locator('img').nth(imageIndex)
          await img.scrollIntoViewIfNeeded()
          await page.waitForFunction(index => document.images[index]?.complete, imageIndex, { timeout: 15000 })
          if (!(await img.evaluate(element => element.naturalWidth > 0))) throw Error(`Image failed at index ${imageIndex}`)
          await img.evaluate(element => element.decode())
        }
        await page.evaluate(() => window.scrollTo(0, 0))
        const beforeFocus = await page.evaluate(() => ({
          title: document.title,
          h1: Array.from(document.querySelectorAll('h1')).map(e => e.textContent.trim()),
          layout: document.querySelector('[data-travel-memory-layout]')?.getAttribute('data-travel-memory-layout') ?? 'portal',
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          images: Array.from(document.images).map(img => ({ src: new URL(img.src).pathname, ok: img.naturalWidth > 0, alt: img.alt })),
          links: document.querySelectorAll('a[href]').length,
        }))
        await fs.mkdir(output, { recursive: true })
        const screenshot = path.join(output, `issue114-${phase}-${surface}-${viewport}.png`)
        const documentHeight = await page.evaluate(() => document.documentElement.scrollHeight)
        const stickyHeaderHeight = await page.locator('header').first().evaluate(element => Math.ceil(element.getBoundingClientRect().height))
        const stride = height - stickyHeaderHeight
        const layers = []
        let coveredY = 0
        for (let desiredY = 0; desiredY < documentHeight; desiredY += stride) {
          await page.evaluate(y => window.scrollTo(0, y), desiredY)
          const scrollY = await page.evaluate(() => window.scrollY)
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
          const start = Math.max(coveredY - scrollY, scrollY === 0 ? 0 : stickyHeaderHeight)
          const segmentHeight = Math.min(height, documentHeight - scrollY) - start
          if (segmentHeight > 0) {
            const buffer = await page.screenshot({ animations: 'disabled' })
            layers.push({ input: await sharp(buffer).extract({ left: 0, top: start, width, height: segmentHeight }).toBuffer(), left: 0, top: scrollY + start })
            coveredY = scrollY + start + segmentHeight
          }
          if (coveredY >= documentHeight) break
        }
        if (coveredY !== documentHeight) throw Error(`Incomplete screenshot: ${coveredY}/${documentHeight}`)
        await sharp({ create: { width, height: documentHeight, channels: 4, background: '#fff' } }).composite(layers).png().toFile(screenshot)
        await page.evaluate(() => window.scrollTo(0, 0))
        await page.keyboard.press('Tab')
        const focus = await page.evaluate(() => {
          const el = document.activeElement
          const style = window.getComputedStyle(el)
          return { tag: el?.tagName, label: el?.getAttribute('aria-label') || el?.textContent?.trim().slice(0, 50), href: el?.getAttribute('href'), outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, boxShadow: style.boxShadow }
        })
        if (viewport === 'mobile') await page.screenshot({ path: path.join(output, `issue114-${phase}-${surface}-focus-mobile.png`), animations: 'disabled' })
        results.push({ phase, surface, route, viewport: { width, height }, status: response.status(), screenshot, lazyImages, ...beforeFocus, focus, errors })
        await context.close()
      }
    }
    const metricsPath = `/private/tmp/issue114-${phase}-metrics.json`
    await fs.writeFile(metricsPath, JSON.stringify({ source: phase === 'before' ? 'd72376dbd9f017d8b41f67d9915e58725b9c29fe' : 'working-tree', fixtureSha256: '5902ede29bed060bfda734ab5f17c8d9c3bf2ff3f82e6f839fa02ebea4d3434a', results }, null, 2) + '\n')
    console.log(metricsPath)
    for (const result of results) console.log(`${result.surface} ${result.viewport.width} ${result.status} overflow=${result.scrollWidth-result.innerWidth} images=${result.images.filter(x=>x.ok).length}/${result.images.length} errors=${result.errors.length} focus=${result.focus.outlineStyle}/${result.focus.outlineWidth}`)
  } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })

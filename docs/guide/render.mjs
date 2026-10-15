// Renders guide.html to a PDF and per-page PNGs, and reports overflow / broken-link problems. Run: node docs/guide/render.mjs
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'

const dir = fileURLToPath(new URL('./', import.meta.url))
const exe = process.env.CHROMIUM_PATH || 'C:/Users/Rohit Kakade/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe'
const b = await chromium.launch({ executablePath: exe })
const p = await b.newPage({ viewport: { width: 1123, height: 794 } })
await p.goto(pathToFileURL(`${dir}guide.html`).href)
await p.evaluate(() => document.fonts.ready)
await p.waitForFunction(() => window.__visReady === true)

const problems = await p.evaluate(() => {
  const out = []
  const ids = new Set([...document.querySelectorAll('[id]')].map((e) => e.id))
  document.querySelectorAll('a[href^="#"]').forEach((a) => { if (!ids.has(a.getAttribute('href').slice(1))) out.push(`broken link ${a.getAttribute('href')}`) })
  document.querySelectorAll('.page:not(.coverpage)').forEach((pg, i) => {
    const r = pg.getBoundingClientRect()
    const foot = pg.querySelector('footer').getBoundingClientRect()
    pg.querySelectorAll('*').forEach((el) => {
      if (el.closest('footer')) return
      const q = el.getBoundingClientRect()
      if (!q.width || !q.height) return
      if (q.right > r.right + 1 || q.bottom > foot.top + 1 || q.left < r.left - 1) out.push(`page ${i + 1}: <${el.tagName.toLowerCase()} ${el.className}> leaves the content area (bottom ${Math.round(q.bottom - r.top)} vs ${Math.round(foot.top - r.top)})`)
    })
  })
  return [...new Set(out)]
})
console.log(problems.length ? problems.join('\n') : 'layout OK: no overflow, no broken internal links')

mkdirSync(`${dir}pages`, { recursive: true })
const n = await p.locator('.page').count()
for (let i = 0; i < n; i++) await p.locator('.page').nth(i).screenshot({ path: `${dir}pages/p${String(i + 1).padStart(2, '0')}.png` })
await p.pdf({ path: `${dir}Questionnaire-desk-User-Guide.pdf`, preferCSSPageSize: true, printBackground: true })
await b.close()
console.log(`${n} pages rendered`)

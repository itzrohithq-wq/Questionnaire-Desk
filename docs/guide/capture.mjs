// Captures the live app's screens for the user guide (fictional data only). Run: node docs/guide/capture.mjs
// Every visual is a complete element (no cropping); the question list is limited to 5 rows so its card ends cleanly.
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const URL_ = process.env.APP_URL || 'https://questionnaire-desk.vercel.app/'
const out = fileURLToPath(new URL('./img/', import.meta.url))
mkdirSync(out, { recursive: true })
const exe = process.env.CHROMIUM_PATH || 'C:/Users/Rohit Kakade/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe'
const browser = await chromium.launch({ executablePath: exe })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce', acceptDownloads: true })
const page = await ctx.newPage()
const wait = (ms = 250) => page.waitForTimeout(ms)
const snap = async (sel, name) => { await wait(); await page.locator(sel).first().screenshot({ path: `${out}${name}.png` }) }
const pick = async (q) => { await page.locator(`#q-${q}`).click(); await wait(150) }
const btn = (name) => page.getByRole('button', { name, exact: true })
const limitList = (n) => page.evaluate((k) => { document.querySelectorAll('[data-testid=question-list] li').forEach((li, i) => { li.style.display = i < k ? '' : 'none' }) }, n)

await page.goto(URL_)
// The live app renders at 67% zoom; capture at 100% so text stays readable once the picture is placed on a printed page.
await page.addStyleTag({ content: 'html { zoom: 1 !important }' })
await snap('[aria-labelledby=try]', 'welcome-card')
await snap('[aria-labelledby=hero] div.mt-8', 'welcome-buttons')
await page.getByRole('button', { name: /Start the interactive demo/ }).click()
await page.waitForSelector('[data-testid=question-list]')
await pick('Q3')
await wait(400)

// Full workspace plus the boxes of the parts the guide points at (viewport pixels)
await page.screenshot({ path: `${out}workspace.png` })
const box = async (sel) => (await page.locator(sel).first().boundingBox())
const boxes = {
  viewport: { w: 1440, h: 900 },
  list: await box('[data-tour=list]'),
  stats: await box('section[aria-label="Review progress"]'),
  answer: await box('[data-testid=answer-block]'),
  evidence: await box('[data-tour=evidence]'),
  actions: await box('[data-tour=actions]'),
  exportBtn: await box('[data-tour=export]'),
}
writeFileSync(`${out}boxes.json`, JSON.stringify(boxes, null, 1))

await snap('section[aria-label="Review progress"]', 'stats-empty')
await snap('[data-tour=export]', 'export-button-off')
await snap('section[aria-labelledby=qtitle] > div', 'question-head')
await snap('[data-testid=answer-block]', 'answer-suggested')
await snap('[data-tour=evidence]', 'evidence-cited')
await snap('[data-tour=actions]', 'actions')
await snap('[data-testid=library]', 'library')

await limitList(5)
await snap('[data-tour=list]', 'list5')
await limitList(99)

await pick('Q2')
await snap('[data-testid=flag-needs-human]', 'flag-needs-human')
await pick('Q1')
await snap('[data-testid=flag-no-evidence]', 'flag-no-evidence')

// Edit and cite on Q1
await page.getByRole('button', { name: /Edit answer/ }).click()
await page.getByRole('radio', { name: 'Yes', exact: true }).check()
await page.locator('form[aria-label="Edit answer"] select').selectOption({ index: 1 })
await snap('form[aria-label="Edit answer"]', 'edit-form')
await page.getByRole('button', { name: 'Save edit' }).click()
await snap('[data-testid=answer-block]', 'answer-edited')

// Approve Q1 (edit), Q3, Q9; reject Q10; hold Q12
await btn('Approve').click()
await pick('Q3'); await btn('Approve').click()
await snap('[data-testid=answer-block]', 'answer-approved')
await pick('Q9'); await btn('Approve').click()
await pick('Q10'); await btn('Reject').click()
await snap('[data-testid=answer-block]', 'answer-rejected')
await pick('Q12'); await btn('Needs more evidence').click()
await snap('section[aria-label="Review progress"]', 'stats-reviewed')
await limitList(5)
await snap('[data-tour=list]', 'list5-reviewed')
await limitList(99)
await snap('[data-tour=export]', 'export-button')

// Export a real file for the table in the guide
const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Export Excel/ }).click()])
await dl.saveAs(`${out}export.xlsx`)

// Sidebar with tooltips (hide page content so only the sidebar and tooltip show)
const side = async (label, name) => {
  await page.getByRole('button', { name: label }).first().hover()
  await page.evaluate(() => { document.querySelector('main').style.visibility = 'hidden'; document.querySelector('header').style.visibility = 'hidden' })
  await wait()
  await page.screenshot({ path: `${out}${name}.png`, clip: { x: 0, y: 0, width: 220, height: 215 } })
  await page.evaluate(() => { document.querySelector('main').style.visibility = ''; document.querySelector('header').style.visibility = '' })
}
await side('Guided tour', 'sidebar-tour')
await side('Reset demo', 'sidebar-reset')

await page.getByRole('button', { name: 'Guided tour' }).first().click()
await page.waitForSelector('[data-testid=tour]')
await snap('[data-testid=tour]', 'tour')
await page.getByRole('button', { name: /End the guide/ }).click()
await page.getByRole('button', { name: 'Limits' }).first().click()
await snap('[role=dialog]', 'limits')
await page.keyboard.press('Escape')

// Phone screens
const m = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' })).newPage()
await m.goto(URL_)
await m.addStyleTag({ content: 'html { zoom: 1 !important }' })
await m.getByRole('button', { name: /Start the interactive demo/ }).click()
await m.waitForSelector('[data-testid=question-list]')
await m.waitForTimeout(300)
await m.screenshot({ path: `${out}mobile-questions.png` })
await m.locator('#q-Q3').click()
await m.getByRole('navigation', { name: 'Panels' }).getByRole('button', { name: /Evidence/ }).click()
await m.waitForTimeout(300)
await m.screenshot({ path: `${out}mobile-evidence.png` })
await browser.close()
console.log('captured from', URL_)

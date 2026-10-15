// Captures the real app's screens for the user guide (synthetic data only). Run: node docs/guide/capture.mjs  (needs `npm run serve` running on :3100)
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const out = fileURLToPath(new URL('./img/', import.meta.url))
mkdirSync(out, { recursive: true })
const exe = process.env.CHROMIUM_PATH || 'C:/Users/Rohit Kakade/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe'
const browser = await chromium.launch({ executablePath: exe })
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' })).newPage()
const snap = async (target, name) => { await page.waitForTimeout(250); await (typeof target === 'string' ? page.locator(target).first() : target).screenshot({ path: `${out}${name}.png` }) }
const top = async (sel, name, h = 540) => { await page.waitForTimeout(250); const b = await page.locator(sel).first().boundingBox(); await page.screenshot({ path: `${out}${name}.png`, clip: { x: b.x, y: b.y, width: b.width, height: Math.min(h, b.height) } }) }
const pick = async (q) => { await page.locator(`#q-${q}`).click(); await page.waitForTimeout(150) }
const btn = (name) => page.getByRole('button', { name, exact: true })

await page.goto('http://localhost:3100/')
await snap('[aria-labelledby=hero]', 'welcome-hero')
await snap('[aria-labelledby=try]', 'welcome-card')
await page.getByRole('button', { name: /Start the interactive demo/ }).click()
await page.waitForSelector('[data-testid=question-list]')
await snap(page, 'workspace-initial')
await top('[data-tour=list]', 'question-list')
await snap('section[aria-label="Review progress"]', 'stats-empty')
await snap('header', 'header')

await pick('Q3')
await snap('[data-testid=answer-block]', 'answer-suggested')
await snap('section[aria-labelledby=qtitle] > div', 'question-head')
await snap('[data-tour=evidence]', 'evidence-cited')
await snap('[data-tour=actions]', 'actions')
await snap('[data-testid=library]', 'library')
await snap(page, 'workspace-q3')

await pick('Q2')
await snap('[data-testid=flag-needs-human]', 'flag-needs-human')
await snap('[data-tour=evidence]', 'evidence-q2')
await pick('Q1')
await snap('[data-testid=flag-no-evidence]', 'flag-no-evidence')

// Edit and cite on Q1
await page.getByRole('button', { name: /Edit answer/ }).click()
await page.getByRole('radio', { name: 'Yes', exact: true }).check()
await page.locator('form[aria-label="Edit answer"] select').selectOption({ index: 1 })
await snap('form[aria-label="Edit answer"]', 'edit-form')
await page.getByRole('button', { name: 'Save edit' }).click()
await snap('[data-testid=answer-block]', 'answer-edited')

// Approve the Q1 edit, approve Q3 and Q9, reject Q10, hold Q12
await btn('Approve').click()
await pick('Q3'); await btn('Approve').click()
await snap('[data-testid=answer-block]', 'answer-approved')
await pick('Q9'); await btn('Approve').click()
await pick('Q10'); await btn('Reject').click()
await snap('[data-testid=answer-block]', 'answer-rejected')
await pick('Q12'); await btn('Needs more evidence').click()
await snap('section[aria-label="Review progress"]', 'stats-reviewed')
await top('[data-tour=list]', 'question-list-reviewed')
await snap('header', 'header-export')

await page.getByRole('button', { name: 'Guided tour' }).first().hover()
await page.evaluate(() => { document.querySelector('main').style.visibility = 'hidden'; document.querySelector('header').style.visibility = 'hidden' })
await page.screenshot({ path: `${out}sidebar.png`, clip: { x: 0, y: 0, width: 190, height: 250 } })
await page.evaluate(() => { document.querySelector('main').style.visibility = ''; document.querySelector('header').style.visibility = '' })
await page.getByRole('button', { name: 'Guided tour' }).first().click()
await page.waitForSelector('[data-testid=tour]')
await snap('[data-testid=tour]', 'tour')
await page.getByRole('button', { name: /End the guide/ }).click()
await page.getByRole('button', { name: 'Limits' }).first().click()
await snap('[role=dialog]', 'limits')
await page.keyboard.press('Escape')

// Mobile view
const m = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' })).newPage()
await m.goto('http://localhost:3100/')
await m.getByRole('button', { name: /Start the interactive demo/ }).click()
await m.waitForSelector('[data-testid=question-list]')
await m.waitForTimeout(250)
await m.screenshot({ path: `${out}mobile-questions.png` })
await browser.close()
console.log('captured')

import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const POC = 'C:/Users/Rohit Kakade/OneDrive/Documents/Claude/secq-poc'
const PY = `${POC}/.venv/Scripts/python.exe`
const SHOTS = process.env.SHOTS_DIR || ''
const errors = new WeakMap<Page, string[]>()

test.beforeEach(async ({ page }) => {
  const list: string[] = []
  errors.set(page, list)
  page.on('console', (m) => { if (m.type() === 'error') list.push(m.text()) })
  page.on('pageerror', (e) => list.push(String(e)))
  await page.goto('/')
})
test.afterEach(async ({ page }) => { expect(errors.get(page), 'console errors').toEqual([]) })

const shot = async (page: Page, name: string, project: string) => {
  if (!SHOTS) return
  mkdirSync(SHOTS, { recursive: true })
  await page.screenshot({ path: join(SHOTS, `${project}-${name}.png`) })
}

const start = async (page: Page) => {
  await page.getByRole('button', { name: /Start the interactive demo/ }).click()
  await expect(page.getByRole('navigation', { name: 'Panels' }).or(page.getByTestId('question-list')).first()).toBeVisible()
}
// On mobile the three panes are tabs; on desktop they are all visible.
const pane = async (page: Page, name: RegExp) => {
  const t = page.getByRole('navigation', { name: 'Panels' }).getByRole('button', { name })
  if (await t.isVisible()) await t.click()
}
const pick = async (page: Page, q: string) => {
  await pane(page, /Questions/)
  await page.locator(`#q-${q}`).click()
  await pane(page, /Answer/)
}
const act = async (page: Page, name: string | RegExp) => {
  await pane(page, /Evidence/)
  await page.getByRole('button', { name, exact: typeof name === 'string' }).click()
}

test('welcome screen content', async ({ page }, ti) => {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByTestId('mini-row')).toBeVisible()
  await expect(page.getByRole('link', { name: /sample/i }).first()).toHaveAttribute('href', /Northwind-Security-Questionnaire\.xlsx/)
  await shot(page, '01-welcome', ti.project.name)
})

test('sample questionnaire loads with 21 questions and evidence library', async ({ page }, ti) => {
  await start(page)
  await pane(page, /Questions/)
  await expect(page.getByTestId('question-list').locator('button[id^="q-"]')).toHaveCount(21)
  await pane(page, /Evidence/)
  await expect(page.getByTestId('library')).toBeVisible()
  await shot(page, '02-workspace', ti.project.name)
})

test('a supported question shows its supporting passage', async ({ page }, ti) => {
  await start(page)
  await pick(page, 'Q3')
  await expect(page.getByTestId('answer-text')).toBeVisible()
  await pane(page, /Evidence/)
  await expect(page.getByTestId('cited-passage')).toContainText(/AES-256/)
  await shot(page, '03-evidence', ti.project.name)
})

test('unsupported questions get no drafted answer and cannot be approved', async ({ page }) => {
  await start(page)
  for (const q of ['Q1', 'Q4', 'Q6']) { // no matching evidence
    await pick(page, q)
    await expect(page.getByTestId('flag-no-evidence'), q).toBeVisible()
    await pane(page, /Evidence/)
    await expect(page.getByTestId('cited-passage'), q).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Approve', exact: true }), q).toBeDisabled()
  }
  for (const q of ['Q2', 'Q5']) { // evidence is negative or conditional: flagged, answer left to a human
    await pick(page, q)
    await expect(page.getByTestId('flag-needs-human'), q).toBeVisible()
    await pane(page, /Evidence/)
    await expect(page.getByRole('button', { name: 'Approve', exact: true }), q).toBeDisabled()
  }
})

test('approve, reject, edit-requires-reapproval, restore, needs-evidence', async ({ page }) => {
  await start(page)
  const exportBtn = page.getByRole('button', { name: /Export Excel/ })
  await expect(exportBtn).toContainText('0 approved')
  await pick(page, 'Q3')
  await act(page, 'Approve')
  await expect(exportBtn).toContainText('1 approved')
  await act(page, 'Reject')
  await expect(exportBtn).toContainText('0 approved')
  await act(page, 'Approve')
  await expect(exportBtn).toContainText('1 approved')
  await act(page, /Edit answer/)
  await page.getByRole('radio', { name: 'No', exact: true }).check()
  await page.getByRole('button', { name: /Save/ }).click()
  await expect(exportBtn).toContainText('0 approved')
  await act(page, 'Approve')
  await expect(exportBtn).toContainText('1 approved')
  await act(page, /Restore the original suggestion/)
  await expect(exportBtn).toContainText('0 approved')
  await act(page, /Needs more evidence/)
  await expect(exportBtn).toContainText('0 approved')
})

test('review state is kept while moving between questions', async ({ page }) => {
  await start(page)
  await pick(page, 'Q3')
  await act(page, 'Approve')
  await pick(page, 'Q9')
  await pick(page, 'Q3')
  await expect(page.getByRole('button', { name: /Export Excel/ })).toContainText('1 approved')
})

test('only approved answers are exported and formatting is preserved', async ({ page }, ti) => {
  test.skip(ti.project.name !== 'desktop', 'export is verified once, on desktop')
  await start(page)
  for (const q of ['Q3', 'Q9']) {
    await pick(page, q)
    await act(page, 'Approve')
  }
  await pick(page, 'Q10') // suggested but left unreviewed: must not be exported
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Export Excel/ }).click()])
  const file = ti.outputPath('export.xlsx')
  await dl.saveAs(file)
  const filled = execFileSync(PY, ['-c', `import sys,openpyxl;ws=openpyxl.load_workbook(sys.argv[1])['Questionnaire'];print(sum(1 for r in range(2,23) if ws.cell(r,3).value not in (None,'')))`, file], { encoding: 'utf8' }).trim()
  expect(filled).toBe('2')
  const cmp = execFileSync(PY, [`${POC}/compare_xlsx.py`, `${POC}/fixtures_out/questionnaire.xlsx`, file], { cwd: POC, encoding: 'utf8' })
  expect(cmp).toContain('FIDELITY: PASS')
  if (SHOTS) { mkdirSync(SHOTS, { recursive: true }); await dl.saveAs(join(SHOTS, 'verified-export.xlsx')) }
})

test('limits dialog lists what is and is not supported', async ({ page }) => {
  await start(page)
  await page.getByRole('button', { name: /Limits/ }).first().click()
  const d = page.getByRole('dialog')
  await expect(d).toContainText(/images/i)
  await expect(d).toContainText(/macros/i)
  await page.keyboard.press('Escape')
  await expect(d).toHaveCount(0)
})

test('guided tour completes its 5 steps', async ({ page }, ti) => {
  await start(page)
  await page.getByRole('button', { name: /Guided tour/ }).first().click()
  const tour = page.getByTestId('tour')
  await expect(tour).toBeVisible()
  await shot(page, '04-tour', ti.project.name)
  for (let i = 0; i < 4; i++) await tour.getByRole('button', { name: /Next/ }).click()
  await tour.getByRole('button', { name: /Finish/ }).click()
  await expect(tour).toHaveCount(0)
})

test('keyboard navigation moves through questions', async ({ page }, ti) => {
  test.skip(ti.project.name !== 'desktop')
  await start(page)
  await page.locator('#q-Q1').focus()
  await page.keyboard.press('ArrowDown')
  await expect(page.locator('#q-Q2')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#q-Q2')).toHaveAttribute('aria-current', /true|step|page/)
})

test('no horizontal overflow and no serious accessibility violations', async ({ page }) => {
  for (const stage of ['welcome', 'workspace']) {
    if (stage === 'workspace') await start(page)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, stage).toBeLessThanOrEqual(1)
    await page.waitForTimeout(600) // let entrance animations finish so contrast is measured at full opacity
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    const bad = r.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
    expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`), stage).toEqual([])
  }
})

test('there is no real-file upload control in the public demo', async ({ page }) => {
  await start(page)
  await expect(page.locator('input[type=file]')).toHaveCount(0)
})

test('sidebar tooltips are drawn above the page content', async ({ page }, ti) => {
  test.skip(ti.project.name !== 'desktop')
  await start(page)
  await page.getByRole('button', { name: 'Guided tour' }).first().hover()
  const covered = await page.evaluate(() => {
    const tip = [...document.querySelectorAll('.tip')].find((t) => (t.parentElement as HTMLElement).matches(':hover'))!
    ;(tip as HTMLElement).style.pointerEvents = 'auto' // the tip ignores the pointer; probe its stacking order
    const r = tip.getBoundingClientRect()
    return !document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('.tip')
  })
  expect(covered).toBe(false)
})

for (const scheme of ['light', 'dark'] as const) {
  test(`favicon block is ${scheme === 'light' ? 'ink' : 'paper'} in ${scheme} colour scheme`, async ({ browser }, ti) => {
    test.skip(ti.project.name !== 'desktop')
    const ctx = await browser.newContext({ colorScheme: scheme })
    const page = await ctx.newPage()
    await page.goto('/')
    const href = await page.locator('link[rel~=icon]').first().getAttribute('href')
    expect(href).toContain('data:image/svg+xml')
    await page.setContent(`<canvas id=c width=200 height=200></canvas><img id=i src="${href}" width=200 height=200>`)
    const px = await page.evaluate(async () => {
      const img = document.getElementById('i') as HTMLImageElement; await img.decode()
      const c = document.getElementById('c') as HTMLCanvasElement; const x = c.getContext('2d')!
      x.drawImage(img, 0, 0, 200, 200)
      const lime = x.getImageData(40, 100, 1, 1).data, block = x.getImageData(150, 40, 1, 1).data
      return { lime: [...lime].slice(0, 3), block: [...block].slice(0, 3) }
    })
    expect(px.lime).toEqual([167, 255, 53])
    expect(px.block).toEqual(scheme === 'light' ? [23, 23, 23] : [245, 246, 244])
    await ctx.close()
  })
}

test('approvals survive a page reload and Reset clears them for good', async ({ page }, ti) => {
  test.skip(ti.project.name !== 'desktop')
  await start(page)
  await pick(page, 'Q3')
  await act(page, 'Approve')
  await page.reload()
  await start(page)
  await expect(page.getByRole('button', { name: /Export Excel/ })).toContainText('1 approved')
  await page.getByRole('button', { name: 'Reset demo' }).first().click()
  await page.reload()
  await start(page)
  await expect(page.getByRole('button', { name: /Export Excel/ })).toContainText('0 approved')
})

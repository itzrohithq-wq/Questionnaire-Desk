// Renders the demo's REAL React components to static HTML for the user guide (vector pictures, same markup/classes as the app).
// Run: npx vitest run --config docs/guide/vitest.config.ts   ->  writes docs/guide/vis.json and docs/guide/app.css
import { it } from 'vitest'
import { renderToStaticMarkup as R } from 'react-dom/server'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { Compass, Download, Info, RotateCcw } from 'lucide-react'
import evidenceData from '@/data/evidence.json'
import type { EvidenceData, Item, Review } from '@/lib/types'
import { Index } from '@/lib/matcher'
import { readQuestions } from '@/lib/workbook'
import { counts, initialReview, reduce, type Action } from '@/lib/review'
import QuestionList from '@/components/QuestionList'
import AnswerPanel from '@/components/AnswerPanel'
import ReviewPanel from '@/components/ReviewPanel'
import Stats from '@/components/Stats'
import Tour from '@/components/Tour'
import Limits from '@/components/Limits'
import Welcome from '@/components/Welcome'
import Logo from '@/components/Logo'

const ev = evidenceData as EvidenceData
const noop = () => {}
const ic = { size: 18, strokeWidth: 1.75, 'aria-hidden': true } as const
const tools: [string, typeof Compass][] = [['Guided tour', Compass], ['Limits', Info], ['Reset demo', RotateCcw]]

// helpers to cut static markup into the pieces the guide shows
const section = (h: string, label: string) => { const i = h.indexOf(`<section aria-labelledby="${label}"`); return h.slice(i, h.indexOf('</section>', i) + 10) }
const firstItems = (h: string, n: number) => { // keep the first n <li> rows of the question list so its card ends cleanly
  const open = h.indexOf('<ul'), start = h.indexOf('<li>', open), close = h.indexOf('</ul>', open)
  let end = start, k = 0
  while (k < n) { end = h.indexOf('</li>', end) + 5; k++ }
  return h.slice(0, end) + h.slice(close)
}

it('renders guide visuals', async () => {
  const buf = readFileSync('public/sample/Northwind-Security-Questionnaire.xlsx')
  const qs = await readQuestions(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer)
  const index = new Index(ev.passages)
  const items: Item[] = qs.map((q) => ({ q, engine: index.suggest(q.question) }))
  const item = (id: string) => items.find((i) => i.q.id === id)!
  const idx = (id: string) => items.findIndex((i) => i.q.id === id)
  const run = (id: string, ...a: Action[]) => a.reduce((r, x) => reduce(item(id), r, x), initialReview(item(id)))
  const q1edit: Action = { type: 'edit', answer: 'Yes', comment: '', passage: ev.passages[0].id }
  const reviewed: Record<string, Review> = {
    Q1: run('Q1', q1edit, { type: 'approve' }), Q3: run('Q3', { type: 'approve' }), Q9: run('Q9', { type: 'approve' }),
    Q10: run('Q10', { type: 'reject' }), Q12: run('Q12', { type: 'needs-evidence' }),
  }
  const none: Record<string, Review> = {}
  const rv = (m: Record<string, Review>) => { const c = counts(items, m); return { c, reviewed: c.approved + c.rejected + c['needs-evidence'] } }

  const list = (m: Record<string, Review>, sel: string, n = 5) => firstItems(R(<QuestionList items={items} reviews={m} selected={sel} onSelect={noop} />), n)
  const stats = (m: Record<string, Review>) => { const { c, reviewed: r } = rv(m); return R(<Stats items={items} reviews={m} counts={c} reviewed={r} />) }
  const answer = (id: string, review: Review, editing = false) => R(<AnswerPanel index={idx(id)} item={item(id)} review={review} passages={ev.passages} docs={ev.documents} editing={editing} setEditing={noop} dispatch={noop} />)
  const right = (id: string, review: Review) => R(<ReviewPanel item={item(id)} review={review} passages={ev.passages} docs={ev.documents} editing={false} setEditing={noop} dispatch={noop} />)
  const wrap = (inner: string) => `<div class="flex flex-col gap-5">${inner}</div>`
  const exportBtn = (n: number) => R(<button className="btn btn-primary px-5 py-2.5" data-tour="export" disabled={n === 0}><Download {...ic} />Export Excel ({n} approved)</button>)

  const sidebar = (tip?: string) => R(
    <div className="flex flex-col items-center gap-2" style={{ width: 76, padding: '12px 0' }}>
      <div className="mb-3"><Logo size={48} /></div>
      <div className="card flex flex-col gap-1 rounded-full p-1.5">
        {tools.map(([label, Icon]) => <button key={label} aria-label={label} className="icon-btn"><Icon {...ic} /><span className="tip" aria-hidden="true" style={tip === label ? { opacity: 1 } : undefined}>{label}</span></button>)}
      </div>
    </div>)

  const header = (n: number) => `<header class="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 pb-2 pt-5 lg:px-6"><div class="min-w-0 flex-1"><h1 class="text-2xl font-semibold tracking-tight">Questionnaire desk</h1><p class="text-sm text-muted">Demo with fictional data: Northwind Synthetic Ltd</p></div>${exportBtn(n)}</header>`

  const q3 = initialReview(item('Q3')), q1 = initialReview(item('Q1')), q2 = initialReview(item('Q2'))
  const edited = run('Q1', q1edit)

  const out: Record<string, { w: number; html: string }> = {}
  const put = (name: string, w: number, html: string) => { out[name] = { w, html } }
  const side = right('Q3', q3)

  // Whole workspace (as in the app at 1440 px wide), list shortened to 7 rows so nothing is cut
  const railTools = tools.map(([l, I]) => R(<button aria-label={l} className="icon-btn"><I {...ic} /></button>)).join('')
  put('workspace', 1440, `<div style="width:1440px;background:#f5f6f4" class="lg:grid lg:grid-cols-[76px_minmax(0,1fr)]"><aside class="flex flex-col items-center py-5"><div class="mb-3">${R(<Logo size={48} />)}</div><div class="card flex flex-col gap-1 rounded-full p-1.5">${railTools}</div></aside><div class="flex min-w-0 flex-col pb-4">${header(0)}<main class="grid gap-5 p-4 lg:grid-cols-[300px_minmax(0,1fr)_360px] lg:items-start lg:p-6"><div data-tour="list">${list(none, 'Q3', 7)}</div><div class="flex flex-col gap-5">${stats(none)}${answer('Q3', q3)}</div><div>${side}</div></main></div></div>`)

  const wel = R(<Welcome onStart={noop} loading={false} error={null} />)
  put('welcome-card', 508, section(wel, 'try'))
  const hero = section(wel, 'hero')
  const bi = hero.indexOf('<div class="mt-8'); put('welcome-buttons', 533, hero.slice(bi, hero.indexOf('</div>', bi) + 6))

  put('list-before', 300, list(none, 'Q3'))
  put('list-after', 300, list(reviewed, 'Q3'))
  put('stats-empty', 616, stats(none))
  put('stats-reviewed', 616, stats(reviewed))
  put('answer-q3', 616, answer('Q3', q3))
  put('answer-q2', 616, answer('Q2', q2))
  put('answer-q1', 616, answer('Q1', q1))
  put('answer-approved', 616, answer('Q3', reviewed.Q3))
  put('answer-rejected', 616, answer('Q10', reviewed.Q10))
  put('answer-edit', 616, answer('Q1', edited, true))
  put('evidence', 360, wrap(section(side, 'ev-h')))
  put('actions', 360, wrap(section(side, 'act-h')))
  put('library', 360, wrap(section(side, 'lib-h')))
  put('export-button', 260, exportBtn(3))
  put('export-button-off', 260, exportBtn(0))
  put('tour', 384, `<div class="vis-static">${R(<Tour step={0} setStep={noop} onClose={noop} />)}</div>`)
  const lim = R(<Limits onClose={noop} />)
  put('limits', 512, `<div class="vis-static">${lim.slice(lim.indexOf('<div role="dialog"'), lim.length - 6)}</div>`)
  put('sidebar-tour', 230, sidebar('Guided tour'))
  put('sidebar-reset', 230, sidebar('Reset demo'))

  // Phone screens (390 px wide), composed from the same components the app uses below the lg breakpoint
  const phoneTools = tools.map(([l, I]) => R(<button className="btn px-3"><I size={16} strokeWidth={1.75} aria-hidden="true" />{l}</button>)).join('')
  const tabs = (on: number) => `<nav aria-label="Panels" class="card grid grid-cols-3 gap-1 rounded-full p-1.5" style="margin:12px">${['Questions', 'Answer', 'Evidence and review'].map((t, i) => `<button class="pill-tab" aria-pressed="${i === on}">${t}</button>`).join('')}</nav>`
  const phone = (body: string, on: number) => `<div style="width:390px;background:#f5f6f4;border-radius:28px;border:2px solid #171717;overflow:hidden"><header class="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 pb-2 pt-5"><div class="min-w-0 flex-1"><h1 class="text-2xl font-semibold tracking-tight">Questionnaire desk</h1><p class="text-sm text-muted">Demo with fictional data: Northwind Synthetic Ltd</p></div><div class="flex flex-wrap items-center gap-2">${phoneTools}</div>${exportBtn(0)}</header><main class="grid gap-5 p-4">${body}</main>${tabs(on)}</div>`
  put('phone-questions', 394, phone(list(none, 'Q1', 4), 0))
  put('phone-evidence', 394, phone(`<div class="flex flex-col gap-5">${section(side, 'ev-h')}${section(side, 'act-h')}</div>`, 2))

  writeFileSync('docs/guide/vis.json', JSON.stringify(out))
  // The app's compiled stylesheet, minus font-face blocks (the guide loads the fonts itself) and the page-level zoom
  const css = readdirSync('out/_next/static/chunks').filter((f) => f.endsWith('.css')).map((f) => readFileSync('out/_next/static/chunks/' + f, 'utf8')).join('\n')
  writeFileSync('docs/guide/app.css', css.replace(/@font-face\{[^}]*\}/g, '').replace(/zoom:\s*[.\d]+;?/g, ''))
})

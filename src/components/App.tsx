'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import evidenceData from '@/data/evidence.json'
import type { EvidenceData, Item, Review } from '@/lib/types'
import { Index } from '@/lib/matcher'
import { readQuestions, writeWorkbook } from '@/lib/workbook'
import { counts, exportRows, initialReview, reduce, type Action } from '@/lib/review'
import Welcome from './Welcome'
import QuestionList from './QuestionList'
import AnswerPanel from './AnswerPanel'
import ReviewPanel from './ReviewPanel'
import Tour, { STEPS } from './Tour'
import Limits from './Limits'
import Stats from './Stats'
import { Compass, Download, Info, RotateCcw } from 'lucide-react'
import Logo from './Logo'

const evidence = evidenceData as EvidenceData
const SAMPLE = 'sample/Northwind-Security-Questionnaire.xlsx'
const KEY = 'secq-demo-review-v1'
const ALLOW_UPLOAD = process.env.NEXT_PUBLIC_ALLOW_UPLOAD === '1' // local testing only; the public build keeps upload off
type Panel = 'questions' | 'answer' | 'evidence'

// Page transitions via the browser's View Transitions API (cross-fade/slide); falls back to an instant update where unsupported.
const transition = (update: () => void) => {
  const d = document as Document & { startViewTransition?: (cb: () => void) => unknown }
  if (!d.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return update()
  d.startViewTransition(() => flushSync(update))
}

export default function App() {
  const [stage, setStage] = useState<'welcome' | 'workspace'>('welcome')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [reviews, setReviews] = useState<Record<string, Review>>({})
  const [selected, setSelected] = useState('Q1')
  const [panel, setPanel] = useState<Panel>('questions')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [tour, setTour] = useState<number | null>(null)
  const [showLimits, setShowLimits] = useState(false)
  const [message, setMessage] = useState('')
  const [source, setSource] = useState<'sample' | 'upload'>('sample')
  const buf = useRef<ArrayBuffer | null>(null)
  const index = useMemo(() => new Index(evidence.passages), [])

  const load = useCallback(async (data: ArrayBuffer, src: 'sample' | 'upload') => {
    const qs = await readQuestions(data)
    if (!qs.length) throw new Error('No question and answer columns were found in this workbook.')
    const its = qs.map((q) => ({ q, engine: index.suggest(q.question) }))
    buf.current = data
    setItems(its); setSelected(its[0].q.id); setSource(src)
    let saved: Record<string, Review> = {}
    if (src === 'sample') { try { saved = JSON.parse(sessionStorage.getItem(KEY) ?? '{}') } catch { /* session storage unavailable */ } }
    setReviews(saved)
  }, [index])

  const ensureLoaded = useCallback(async () => {
    if (buf.current) return
    const res = await fetch(new URL(SAMPLE, document.baseURI))
    if (!res.ok) throw new Error('The sample questionnaire could not be loaded.')
    await load(await res.arrayBuffer(), 'sample')
  }, [load])

  useEffect(() => { ensureLoaded().catch(() => { /* the Start button retries and shows the error */ }) }, [ensureLoaded])
  useEffect(() => {
    if (source !== 'sample' || !items.length) return // before the first load `reviews` is empty and would overwrite the saved choices
    try { sessionStorage.setItem(KEY, JSON.stringify(reviews)) } catch { /* ignore */ }
  }, [reviews, source, items.length])

  const start = async () => {
    setLoading(true); setError(null)
    try { await ensureLoaded(); transition(() => setStage('workspace')) } catch (e) { setError((e as Error).message) }
    setLoading(false)
  }

  const idx = Math.max(0, items.findIndex((i) => i.q.id === selected))
  const item = items[idx]
  const review = item ? reviews[item.q.id] ?? initialReview(item) : undefined
  const c = useMemo(() => counts(items, reviews), [items, reviews])
  const reviewed = c.approved + c.rejected + c['needs-evidence']

  const select = (id: string) => transition(() => { setSelected(id); setEditingId(null); setPanel('answer') })

  const dispatch = (a: Action) => {
    if (!item || !review) return
    const next = reduce(item, review, a)
    setReviews((r) => ({ ...r, [item.q.id]: next }))
    const n = idx + 1
    setMessage(
      a.type === 'approve' ? (next.decision === 'approved' ? `Question ${n} approved. It will be exported.` : `Question ${n} cannot be approved yet: there is no answer.`)
      : a.type === 'reject' ? `Question ${n} rejected. It will not be exported.`
      : a.type === 'needs-evidence' ? `Question ${n} marked as needing more evidence.`
      : a.type === 'restore' ? `Question ${n} restored to the original suggestion.`
      : `Question ${n} edit saved. It needs approval before export.`,
    )
  }

  const doExport = async () => {
    if (!buf.current) return
    try {
      const rows = exportRows(items, reviews, evidence.passages, evidence.documents)
      const out = await writeWorkbook(buf.current, rows)
      const url = URL.createObjectURL(new Blob([out as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
      const a = document.createElement('a')
      a.href = url; a.download = 'Northwind-Security-Questionnaire-reviewed.xlsx'
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1500)
      setMessage(`Exported ${rows.length} approved ${rows.length === 1 ? 'answer' : 'answers'}. Everything else was left blank.`)
    } catch (e) { setMessage(`The export failed: ${(e as Error).message}`) }
  }

  const reset = () => { setReviews({}); setEditingId(null); try { sessionStorage.removeItem(KEY) } catch { /* ignore */ } setMessage('Demo reset. All review choices were cleared.') }

  const upload = async (f: File | undefined) => {
    if (!f) return
    try { await load(await f.arrayBuffer(), 'upload'); setMessage(`Loaded ${f.name} for local testing.`) } catch (e) { setMessage((e as Error).message) }
  }

  // Guided tour: move to the right question and panel, and outline the target.
  useEffect(() => {
    if (tour === null) return
    const t = STEPS[tour].target
    if (tour >= 1 && items.some((i) => i.q.id === 'Q3')) setSelected('Q3')
    setPanel(t === 'list' ? 'questions' : t === 'evidence' || t === 'actions' ? 'evidence' : 'answer')
    const el = document.querySelector(`[data-tour="${t}"]`)
    el?.classList.add('tour-target')
    el?.scrollIntoView?.({ block: 'nearest' })
    return () => el?.classList.remove('tour-target')
  }, [tour, items])

  if (stage === 'welcome' || !item || !review) return <Welcome onStart={start} loading={loading} error={error} />

  const tab = (p: Panel, label: string) => (
    <button key={p} onClick={() => setPanel(p)} aria-pressed={panel === p} className="pill-tab">{label}</button>
  )
  const show = (p: Panel) => (panel === p ? '' : 'hidden lg:block')
  const ic = { size: 18, strokeWidth: 1.75, 'aria-hidden': true } as const
  const tools: [string, typeof Compass, () => void][] = [['Guided tour', Compass, () => setTour(0)], ['Limits', Info, () => setShowLimits(true)], ['Reset demo', RotateCcw, reset]]

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[76px_minmax(0,1fr)]">
      <aside aria-label="Tools" className="sticky top-0 z-20 hidden h-screen flex-col items-center gap-2 py-5 lg:flex">
        <div className="mb-3"><Logo size={48} /></div>
        <div className="card flex flex-col gap-1 rounded-full p-1.5">
          {tools.map(([label, Icon, run]) => (
            <button key={label} onClick={run} aria-label={label} className="icon-btn"><Icon {...ic} /><span className="tip" aria-hidden="true">{label}</span></button>
          ))}
        </div>
      </aside>

      <div className="flex min-w-0 flex-col pb-20 lg:pb-0">
        <header className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 pb-2 pt-5 lg:px-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">Questionnaire desk</h1>
            <p className="text-sm text-muted">Demo with fictional data: Northwind Synthetic Ltd</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:hidden">
            {tools.map(([label, Icon, run]) => <button key={label} onClick={run} className="btn px-3"><Icon size={16} strokeWidth={1.75} aria-hidden="true" />{label}</button>)}
          </div>
          <button onClick={doExport} disabled={c.approved === 0} data-tour="export" className="btn btn-primary px-5 py-2.5">
            <Download {...ic} />Export Excel ({c.approved} approved)
          </button>
          {ALLOW_UPLOAD && (
            <label className="w-full text-xs text-muted">Local testing only, fictional files only:{' '}
              <input type="file" accept=".xlsx" onChange={(e) => upload(e.target.files?.[0])} />
            </label>
          )}
        </header>

        <main id="main" className="grid flex-1 gap-5 p-4 lg:grid-cols-[300px_minmax(0,1fr)_360px] lg:items-start lg:p-6">
          <div data-tour="list" className={`${show('questions')} lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)]`}>
            <QuestionList items={items} reviews={reviews} selected={selected} onSelect={select} />
          </div>
          <div className={`${show('answer')} flex flex-col gap-5`}>
            <Stats items={items} reviews={reviews} counts={c} reviewed={reviewed} />
            <AnswerPanel key={`${selected}:${review.answer}:${review.comment}:${review.passage}:${editingId === selected}`} index={idx} item={item} review={review}
              passages={evidence.passages} docs={evidence.documents} editing={editingId === selected} setEditing={(v) => setEditingId(v ? selected : null)} dispatch={dispatch} />
          </div>
          <div className={show('evidence')}>
            <ReviewPanel item={item} review={review} passages={evidence.passages} docs={evidence.documents}
              editing={editingId === selected} setEditing={(v) => { setEditingId(v ? selected : null); if (v) setPanel('answer') }} dispatch={dispatch} />
          </div>
        </main>
      </div>

      <nav aria-label="Panels" className="card fixed inset-x-3 bottom-3 z-30 grid grid-cols-3 gap-1 rounded-full p-1.5 lg:hidden">
        {tab('questions', 'Questions')}{tab('answer', 'Answer')}{tab('evidence', 'Evidence and review')}
      </nav>
      <p role="status" aria-live="polite" className="sr-only" data-testid="live">{message}</p>
      {message && <p className="rise fixed bottom-6 left-1/2 z-30 hidden -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm text-white shadow-lg lg:block" aria-hidden="true">{message}</p>}
      {tour !== null && <Tour step={tour} setStep={setTour} onClose={() => setTour(null)} />}
      {showLimits && <Limits onClose={() => setShowLimits(false)} />}
    </div>
  )
}

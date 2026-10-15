'use client'
import type { DocMeta, Item, Passage, Review } from '@/lib/types'
import { Check, Pencil, RotateCcw, X, CircleAlert } from 'lucide-react'
import { canApprove, statusOf, type Action } from '@/lib/review'

export default function ReviewPanel({ item, review, passages, docs, editing, setEditing, dispatch }: {
  item: Item; review: Review; passages: Passage[]; docs: DocMeta[]
  editing: boolean; setEditing: (v: boolean) => void; dispatch: (a: Action) => void
}) {
  const cited = review.passage ? passages.find((p) => p.id === review.passage) : undefined
  const citedDoc = cited ? docs.find((d) => d.id === cited.doc) : undefined
  const st = statusOf(item, review)
  const ok = canApprove(item, review)
  const ic = { size: 16, strokeWidth: 1.75, 'aria-hidden': true } as const

  return (
    <aside aria-label="Evidence and review" className="flex flex-col gap-5">
      <section aria-labelledby="ev-h" data-tour="evidence" className="card p-5">
        <h2 id="ev-h" className="text-base font-semibold tracking-tight">Cited evidence</h2>
        {cited && citedDoc ? (
          <figure className="mt-3 rounded-2xl bg-sunken p-4" data-testid="cited-passage">
            <figcaption className="text-sm">
              <span className="font-semibold">{citedDoc.title}</span>
              <span className="block text-muted">{citedDoc.version}, reviewed {citedDoc.reviewed}</span>
              <span className="block text-muted">Status: {citedDoc.status}. Section: {cited.section}</span>
            </figcaption>
            <blockquote className="passage mt-3 text-base"><span className="marker">{cited.text}</span></blockquote>
            <p className="mt-2 text-xs text-muted">Source text from a fictional policy. The highlight is the exact passage.</p>
          </figure>
        ) : (
          <p className="mt-3 rounded-2xl border border-dashed border-line-strong bg-sunken p-4 text-sm text-muted" data-testid="no-cited">No policy passage is cited for this answer.</p>
        )}
      </section>

      <section aria-labelledby="act-h" data-tour="actions" className="card p-5">
        <h2 id="act-h" className="text-base font-semibold tracking-tight">Reviewer actions</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={() => dispatch({ type: 'approve' })} disabled={!ok || st === 'approved'} className="btn btn-primary col-span-2 py-2.5"><Check {...ic} />Approve</button>
          <button onClick={() => setEditing(true)} className="btn"><Pencil {...ic} />Edit answer</button>
          <button onClick={() => dispatch({ type: 'reject' })} disabled={st === 'rejected'} className="btn text-danger"><X {...ic} />Reject</button>
          <button onClick={() => dispatch({ type: 'needs-evidence' })} disabled={st === 'needs-evidence'} className="btn col-span-2 text-warn"><CircleAlert {...ic} />Needs more evidence</button>
          <button onClick={() => dispatch({ type: 'restore' })} disabled={!review.edited && review.decision === 'none'} className="btn col-span-2 border-transparent text-muted"><RotateCcw {...ic} />Restore the original suggestion</button>
        </div>
        {!ok && <p className="mt-2 text-sm text-muted" data-testid="approve-hint">There is nothing to approve yet. Choose Edit answer and write your own, citing the policy.</p>}
      </section>

      <section aria-labelledby="lib-h" className="card p-5">
        <h2 id="lib-h" className="text-base font-semibold tracking-tight">Evidence library</h2>
        <p className="mt-1 text-sm text-muted">Fictional policies for Northwind Synthetic Ltd. This is source text, not generated text.</p>
        <div className="mt-3 space-y-2" data-testid="library">
          {docs.map((d) => (
            <details key={d.id} className="rounded-2xl border border-line bg-sunken p-3" open={cited?.doc === d.id}>
              <summary className="cursor-pointer text-sm font-medium">{d.title}<span className="ml-2 text-xs font-normal text-muted">{d.version}</span></summary>
              <p className="mt-1 text-xs text-muted">Reviewed {d.reviewed}. {d.status}.</p>
              <ul className="mt-2 space-y-2">
                {passages.filter((p) => p.doc === d.id).map((p) => (
                  <li key={p.id} className={`passage text-sm ${p.id === review.passage ? 'rounded bg-marker/50 px-1' : ''}`}>
                    <span className="block font-sans text-xs text-muted">{p.section}</span>
                    {p.text}
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </section>
    </aside>
  )
}

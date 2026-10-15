'use client'
import { useState } from 'react'
import type { DocMeta, Item, Passage, Review } from '@/lib/types'
import { statusOf, type Action } from '@/lib/review'
import StatusChip from './StatusChip'

const passageLabel = (p: Passage, docs: DocMeta[]) => {
  const d = docs.find((x) => x.id === p.doc)
  return `${d?.title ?? p.doc}: ${p.text.length > 70 ? p.text.slice(0, 70) + '…' : p.text}`
}

export default function AnswerPanel({ index, item, review, passages, docs, editing, setEditing, dispatch }: {
  index: number; item: Item; review: Review; passages: Passage[]; docs: DocMeta[]
  editing: boolean; setEditing: (v: boolean) => void; dispatch: (a: Action) => void
}) {
  const st = statusOf(item, review)
  const { q, engine } = item
  const [answer, setAnswer] = useState(review.answer)
  const [comment, setComment] = useState(review.comment)
  const [passage, setPassage] = useState<string>(review.passage ?? '')
  const cited = review.passage ? passages.find((p) => p.id === review.passage) : undefined
  const citedDoc = cited ? docs.find((d) => d.id === cited.doc) : undefined

  const block =
    st === 'approved' ? { cls: 'approved stamp', title: 'Approved answer' }
    : st === 'edited' ? { cls: 'suggestion', title: 'Your edit, waiting for your approval' }
    : engine.answer && !review.edited ? { cls: 'suggestion', title: 'Software suggestion, not yet reviewed' }
    : { cls: 'border-2 border-dashed border-line-strong bg-sunken', title: 'No suggested answer' }

  const save = () => { dispatch({ type: 'edit', answer: answer.trim(), comment: comment.trim(), passage: passage || null }); setEditing(false) }

  return (
    <section aria-labelledby="qtitle" className="flex flex-col gap-5">
      <div className="card rise p-6">
        <p className="text-sm text-muted">Question {index + 1}, sheet “{q.sheet}”, row {q.row}</p>
        <h2 id="qtitle" className="mt-2 text-2xl font-semibold leading-snug tracking-tight md:text-3xl">{q.question}</h2>
        <StatusChip status={st} className="mt-4" />
      </div>

      {engine.status === 'NEEDS_HUMAN' && !review.edited && (
        <p className="rounded-2xl bg-warn-soft p-4 text-sm text-warn" data-testid="flag-needs-human">
          <strong>The software did not draft an answer.</strong> The closest policy passage is negative, partial or conditional, or the question asks for a value the evidence does not contain ({engine.note}). Read the cited passage and decide.
        </p>
      )}
      {engine.status === 'NO_EVIDENCE' && !review.edited && (
        <p className="card p-4 text-sm text-muted" data-testid="flag-no-evidence">
          <strong className="text-ink">No supporting evidence was found, so nothing was drafted.</strong> The matcher is simple keyword matching and can miss wording. If a policy does cover this, find the passage in the library, write the answer, and cite it.
        </p>
      )}

      <div className={`rounded-[20px] p-6 ${block.cls}`} data-tour="answer" data-testid="answer-block">
        <h3 className="text-sm font-semibold">{block.title}</h3>
        {review.answer ? <p className="mt-2 text-4xl font-semibold tracking-tight" data-testid="answer-text">{review.answer}</p> : <p className="mt-2 text-muted">Nothing to approve yet.</p>}
        {review.comment && <p className="mt-2 text-sm">{review.comment}</p>}
        {cited && <p className="mt-3 text-sm text-muted">Cites {citedDoc?.title} {citedDoc?.version}, {cited.section}.</p>}
        {st === 'approved' && <p className="mt-3 text-sm font-medium text-accent-ink">This answer will be written to the Excel file.</p>}
        {st === 'rejected' && <p className="mt-3 text-sm font-medium text-danger">Rejected: the cell stays blank in the export.</p>}
        {st === 'needs-evidence' && <p className="mt-3 text-sm font-medium text-warn">Marked as needing more evidence: the cell stays blank in the export.</p>}
      </div>

      {editing && (
        <form className="card space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); save() }} aria-label="Edit answer">
          {q.options ? (
            <fieldset>
              <legend className="text-sm font-semibold">Answer (this cell is a dropdown in the workbook)</legend>
              <div className="mt-2 flex gap-4">
                {q.options.map((o) => (
                  <label key={o} className="flex items-center gap-2">
                    <input type="radio" name="answer" value={o} checked={answer === o} onChange={() => setAnswer(o)} className="size-4 accent-ink" />
                    {o}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : (
            <label className="block text-sm font-semibold">Answer
              <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={3} className="field mt-1 font-normal" />
            </label>
          )}
          {q.ecol && (
            <label className="block text-sm font-semibold">Comment for the Comments column
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} className="field mt-1 font-normal" />
            </label>
          )}
          <label className="block text-sm font-semibold">Cited evidence
            <select value={passage} onChange={(e) => setPassage(e.target.value)} className="field mt-1 font-normal">
              <option value="">No evidence cited</option>
              {passages.map((p) => <option key={p.id} value={p.id}>{passageLabel(p, docs)}</option>)}
            </select>
          </label>
          <div className="flex gap-3">
            <button type="submit" className="btn btn-primary">Save edit</button>
            <button type="button" onClick={() => setEditing(false)} className="btn">Cancel</button>
          </div>
          <p className="text-xs text-muted">Saving an edit does not approve it. You approve it as a separate step.</p>
        </form>
      )}
    </section>
  )
}

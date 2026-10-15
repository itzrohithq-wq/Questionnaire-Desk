// Review rules. The only path to an exported answer is an explicit approval by the reviewer.
import type { ExportRow, Item, Passage, DocMeta, Review, Status } from './types'

export const initialReview = (it: Item): Review => ({
  decision: 'none',
  edited: false,
  answer: it.engine.answer ?? '',
  comment: '',
  passage: it.engine.passage,
})

export function statusOf(it: Item, r: Review): Status {
  if (r.decision === 'approved') return 'approved'
  if (r.decision === 'rejected') return 'rejected'
  if (r.decision === 'needs-evidence') return 'needs-evidence'
  if (r.edited) return 'edited'
  return it.engine.status === 'SUGGESTED' ? 'suggested' : it.engine.status === 'NEEDS_HUMAN' ? 'needs-judgment' : 'no-evidence'
}

/** An answer can be approved only if it is non-empty and, for a dropdown cell, one of the allowed values. */
export function canApprove(it: Item, r: Review): boolean {
  const a = r.answer.trim()
  if (!a) return false
  return it.q.options ? it.q.options.includes(a) : true
}

export type Action =
  | { type: 'approve' }
  | { type: 'reject' }
  | { type: 'needs-evidence' }
  | { type: 'restore' }
  | { type: 'edit'; answer: string; comment: string; passage: string | null }

export function reduce(it: Item, r: Review, a: Action): Review {
  switch (a.type) {
    case 'approve':
      return canApprove(it, r) ? { ...r, decision: 'approved' } : r
    case 'reject':
      return { ...r, decision: 'rejected' }
    case 'needs-evidence':
      return { ...r, decision: 'needs-evidence' }
    case 'restore':
      return initialReview(it)
    case 'edit': {
      // Any edit withdraws a previous approval: edited text must be approved again.
      const base = initialReview(it)
      const edited = a.answer !== base.answer || a.comment !== '' || a.passage !== base.passage
      return { decision: 'none', edited, answer: a.answer, comment: a.comment, passage: a.passage }
    }
  }
}

export function sourceLine(p: Passage, docs: DocMeta[]): string {
  const d = docs.find((x) => x.id === p.doc)
  return `Source: ${d ? `${d.title} ${d.version}` : p.doc}, ${p.section}: "${p.text}"`
}

/** Only approved answers are exported. Rejected, unreviewed, edited-but-unapproved and needs-evidence items are left blank. */
export function exportRows(items: Item[], reviews: Record<string, Review>, passages: Passage[], docs: DocMeta[]): ExportRow[] {
  const rows: ExportRow[] = []
  for (const it of items) {
    const r = reviews[it.q.id]
    if (!r || r.decision !== 'approved' || !canApprove(it, r)) continue
    const p = r.passage ? passages.find((x) => x.id === r.passage) : undefined
    // An approved answer with no cited passage says so, rather than looking policy-backed.
    const parts = [r.comment.trim(), p ? sourceLine(p, docs) : 'Source: none cited; answer entered by the reviewer.'].filter(Boolean)
    rows.push({ sheet: it.q.sheet, row: it.q.row, acol: it.q.acol, ecol: it.q.ecol, answer: r.answer.trim(), comment: parts.join(' ') })
  }
  return rows
}

export const counts = (items: Item[], reviews: Record<string, Review>) => {
  const c: Record<Status, number> = { suggested: 0, 'needs-judgment': 0, 'no-evidence': 0, edited: 0, approved: 0, rejected: 0, 'needs-evidence': 0 }
  for (const it of items) c[statusOf(it, reviews[it.q.id] ?? initialReview(it))]++
  return c
}

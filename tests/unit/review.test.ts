import { describe, expect, it } from 'vitest'
import evidence from '@/data/evidence.json'
import { Index } from '@/lib/matcher'
import { canApprove, exportRows, initialReview, reduce, statusOf, type Action } from '@/lib/review'
import type { EvidenceData, Item, Review } from '@/lib/types'

const data = evidence as EvidenceData
const index = new Index(data.passages)
const mk = (id: string, question: string, options: string[] | null = ['Yes', 'No', 'N/A']): Item => ({
  q: { id, sheet: 'Questionnaire', row: 2, acol: 3, ecol: 4, question, options },
  engine: index.suggest(question),
})
const suggested = mk('Q3', 'Is customer data encrypted at rest?')
const none = mk('Q7', 'Do you have FedRAMP authorization?')
const run = (it: Item, r: Review, ...a: Action[]) => a.reduce((x, y) => reduce(it, x, y), r)
const rows = (items: Item[], rs: Record<string, Review>) => exportRows(items, rs, data.passages, data.documents)

describe('review rules', () => {
  it('a suggestion starts unreviewed and is not exported', () => {
    const r = initialReview(suggested)
    expect(statusOf(suggested, r)).toBe('suggested')
    expect(rows([suggested], { Q3: r })).toHaveLength(0)
  })
  it('approving a suggestion exports it with its source line', () => {
    const r = run(suggested, initialReview(suggested), { type: 'approve' })
    expect(statusOf(suggested, r)).toBe('approved')
    const out = rows([suggested], { Q3: r })
    expect(out).toHaveLength(1)
    expect(out[0].answer).toBe('Yes')
    expect(out[0].comment).toContain('Encryption Standard v1.4')
    expect(out[0].comment).toContain('AES-256')
  })
  it('rejected answers are excluded', () => {
    const r = run(suggested, initialReview(suggested), { type: 'approve' }, { type: 'reject' })
    expect(statusOf(suggested, r)).toBe('rejected')
    expect(rows([suggested], { Q3: r })).toHaveLength(0)
  })
  it('needs-more-evidence answers are excluded', () => {
    const r = run(suggested, initialReview(suggested), { type: 'needs-evidence' })
    expect(rows([suggested], { Q3: r })).toHaveLength(0)
  })
  it('an edit withdraws approval and must be approved again', () => {
    let r = run(suggested, initialReview(suggested), { type: 'approve' })
    r = run(suggested, r, { type: 'edit', answer: 'No', comment: 'Changed by reviewer', passage: null })
    expect(statusOf(suggested, r)).toBe('edited')
    expect(rows([suggested], { Q3: r })).toHaveLength(0)
    r = run(suggested, r, { type: 'approve' })
    const out = rows([suggested], { Q3: r })
    expect(out[0].answer).toBe('No')
    expect(out[0].comment).toBe('Changed by reviewer Source: none cited; answer entered by the reviewer.')
  })
  it('an item with no evidence cannot be approved until the reviewer writes an answer', () => {
    const r0 = initialReview(none)
    expect(canApprove(none, r0)).toBe(false)
    expect(run(none, r0, { type: 'approve' }).decision).toBe('none')
    const r1 = run(none, r0, { type: 'edit', answer: 'No', comment: '', passage: null }, { type: 'approve' })
    expect(rows([none], { Q7: r1 })[0].answer).toBe('No')
    expect(rows([none], { Q7: r1 })[0].comment).toContain('none cited')
  })
  it('a dropdown cell only accepts its allowed values', () => {
    const r = run(none, initialReview(none), { type: 'edit', answer: 'Maybe', comment: '', passage: null }, { type: 'approve' })
    expect(r.decision).toBe('none')
  })
  it('restore returns to the original suggestion', () => {
    const r = run(suggested, initialReview(suggested), { type: 'edit', answer: 'No', comment: 'x', passage: null }, { type: 'restore' })
    expect(r).toEqual(initialReview(suggested))
  })
  it('an attached passage is cited on export', () => {
    const p = data.passages.find((x) => x.text.includes('required for all employee accounts'))!
    const it = mk('Q1', 'Do you enforce MFA for all employee accounts?')
    expect(it.engine.status).toBe('NO_EVIDENCE')
    const r = run(it, initialReview(it), { type: 'edit', answer: 'Yes', comment: '', passage: p.id }, { type: 'approve' })
    expect(rows([it], { Q1: r })[0].comment).toContain('required for all employee accounts')
  })
})

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import evidence from '@/data/evidence.json'
import golden from '@/data/golden.json'
import { Index } from '@/lib/matcher'
import type { EvidenceData } from '@/lib/types'

const data = evidence as EvidenceData
const index = new Index(data.passages)
// The answer key from the prototype's fixtures; the demo must never auto-answer these.
const key: { question: string; expected: string }[] = JSON.parse(
  readFileSync('C:/Users/Rohit Kakade/OneDrive/Documents/Claude/secq-poc/fixtures_out/ANSWER_KEY_do_not_upload.json', 'utf8'),
)

describe('matcher parity with the Python prototype', () => {
  it.each(golden)('$id matches the Python engine: $question', (g) => {
    const e = index.suggest(g.question)
    expect(e.status).toBe(g.status)
    expect(e.answer).toBe(g.answer)
    expect(e.passage).toBe(g.passage)
  })
})

describe('guardrails: no unsupported claims', () => {
  it('never drafts an answer for questions that must not be auto-answered', () => {
    for (const k of key.filter((x) => x.expected === 'must_not_auto_answer')) {
      expect(index.suggest(k.question).answer, k.question).toBeNull()
    }
  })
  it('every drafted answer cites a passage that exists in the evidence', () => {
    for (const g of golden) {
      const e = index.suggest(g.question)
      if (e.answer) {
        expect(data.passages.find((x) => x.id === e.passage), g.question).toBeTruthy()
        expect(e.status).toBe('SUGGESTED')
      }
    }
  })
  it('does not invent controls for unrelated questions', () => {
    for (const q of ['Do you have FedRAMP authorization?', 'Do you hold ISO 27001 certification?', 'Do you run a public bug bounty program?']) {
      expect(index.suggest(q).answer).toBeNull()
    }
  })
})

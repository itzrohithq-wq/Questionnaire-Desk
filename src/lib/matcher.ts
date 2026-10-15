// TypeScript port of the deterministic engine in secq-poc/secq.py. Keyword matching only: it is not AI and does not
// understand paraphrases. Parity with the Python engine is checked by tests/unit/matcher.test.ts against golden.json.
import type { Engine, Passage } from './types'

const STOP = new Set('a an and are as at be by do does for from has have how in is it of on or our that the their there they this to we what when which with you your any all'.split(' '))
const WEAK = /\b(do not|does not|don't|not currently|no longer|never|none|without|planned|roadmap|will be|in progress|plan to|optional|not yet|no report)\b/i
const YESNO = /^(do|does|is|are|have|has|can|will|did)\b/i
const MIN_COVERAGE = 0.6

export function toks(s: string): string[] {
  return (s.toLowerCase().match(/[a-z0-9][a-z0-9.\-]*/g) ?? [])
    .filter((w) => !STOP.has(w))
    .map((w) => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w))
}

export class Index {
  private sets: Set<string>[]
  private idf = new Map<string, number>()
  constructor(private passages: Passage[]) {
    this.sets = passages.map((p) => new Set(toks(p.text + ' ' + p.section)))
    const df = new Map<string, number>()
    for (const s of this.sets) for (const t of s) df.set(t, (df.get(t) ?? 0) + 1)
    const n = passages.length
    for (const [t, c] of df) this.idf.set(t, Math.log(1 + n / c))
  }

  best(q: string): { passage: Passage | null; cov: number; missing: string[] } {
    const qt = new Set(toks(q))
    if (!qt.size) return { passage: null, cov: 0, missing: [] }
    const w = (t: string) => this.idf.get(t) ?? Math.log(1 + this.passages.length)
    let total = 0
    for (const t of qt) total += w(t)
    let bestCov = -1, bestI = -1
    this.sets.forEach((ts, i) => {
      let sum = 0
      for (const t of qt) if (ts.has(t)) sum += w(t)
      const cov = sum / total
      if (cov > bestCov || (cov === bestCov && i > bestI)) { bestCov = cov; bestI = i }
    })
    return { passage: this.passages[bestI], cov: bestCov, missing: [...qt].filter((t) => !this.sets[bestI].has(t)) }
  }

  suggest(question: string): Engine {
    const { passage, cov, missing } = this.best(question)
    if (!passage || cov < MIN_COVERAGE) return { status: 'NO_EVIDENCE', answer: null, passage: null, note: 'no supporting passage found' }
    const nums = missing.filter((t) => /\d/.test(t))
    if (nums.length) return { status: 'NEEDS_HUMAN', answer: null, passage: passage.id, note: `question names ${nums.join(', ')} not in evidence` }
    if (WEAK.test(passage.text) || (missing.length > 0 && cov < 0.8)) {
      return { status: 'NEEDS_HUMAN', answer: null, passage: passage.id, note: 'evidence is negative, partial or conditional' }
    }
    return { status: 'SUGGESTED', answer: YESNO.test(question.trim()) ? 'Yes' : passage.text, passage: passage.id, note: '' }
  }
}

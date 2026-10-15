export type EngineStatus = 'SUGGESTED' | 'NEEDS_HUMAN' | 'NO_EVIDENCE'

export interface Passage { id: string; doc: string; section: string; text: string }
export interface DocMeta { id: string; file: string; title: string; version: string; reviewed: string; status: string }
export interface EvidenceData { company: string; documents: DocMeta[]; passages: Passage[] }

/** One question row found in a workbook. `options` holds a dropdown list when the answer cell has one. */
export interface Question {
  id: string
  sheet: string
  row: number
  acol: number
  ecol: number | null
  question: string
  options: string[] | null
}

/** What the deterministic engine proposes. Never an approval. */
export interface Engine { status: EngineStatus; answer: string | null; passage: string | null; note: string }
export interface Item { q: Question; engine: Engine }

export type Decision = 'none' | 'approved' | 'rejected' | 'needs-evidence'

/** The reviewer's working copy for one question. `edited` is true once anything differs from the engine's suggestion. */
export interface Review { decision: Decision; edited: boolean; answer: string; comment: string; passage: string | null }

export type Status = 'suggested' | 'needs-judgment' | 'no-evidence' | 'edited' | 'approved' | 'rejected' | 'needs-evidence'

export interface ExportRow { sheet: string; row: number; acol: number; ecol: number | null; answer: string; comment: string }

// Workbook reading and exporting with ExcelJS. Mirrors secq.py: find the header row, the question and answer columns,
// and an optional comments/evidence column. Export edits only the answer and comment cells of approved rows.
import type ExcelJSNS from 'exceljs'
import type { ExportRow, Question } from './types'

type ExcelJS = typeof ExcelJSNS
const load = async (): Promise<ExcelJS> => (await import('exceljs')).default as unknown as ExcelJS

export const SUPPORTED = [
  'worksheet order and hidden sheets', 'column widths and row heights', 'merged cells', 'basic cell formatting',
  'Yes/No/N/A validation dropdowns', 'conditional formatting', 'freeze panes',
]
export const UNSUPPORTED = ['embedded images', 'charts', 'macros (.xlsm)', 'pivot tables', 'form controls', 'web-portal questionnaires and PDFs']

const lower = (v: unknown) => String(v ?? '').toLowerCase()

export async function readQuestions(buf: ArrayBuffer): Promise<Question[]> {
  const Excel = await load()
  const wb = new Excel.Workbook()
  await wb.xlsx.load(buf)
  const out: Question[] = []
  for (const ws of wb.worksheets) {
    let found: { hdr: number; q: number; a: number; e: number | null } | null = null
    for (let r = 1; r <= Math.min(15, ws.rowCount) && !found; r++) {
      const cells: Record<number, string> = {}
      ws.getRow(r).eachCell((c, n) => { cells[n] = lower(c.value) })
      const q = Object.keys(cells).map(Number).find((n) => cells[n].includes('question'))
      const a = Object.keys(cells).map(Number).find((n) => cells[n].includes('response') || cells[n].includes('answer'))
      if (q && a) {
        const e = Object.keys(cells).map(Number).find((n) => ['comment', 'evidence', 'note'].some((k) => cells[n].includes(k)))
        found = { hdr: r, q, a, e: e ?? null }
      }
    }
    if (!found) continue
    for (let r = found.hdr + 1; r <= ws.rowCount; r++) {
      const text = String(ws.getCell(r, found.q).value ?? '').trim()
      if (!text) continue
      const dv = ws.getCell(r, found.a).dataValidation
      let options: string[] | null = null
      if (dv && dv.type === 'list' && dv.formulae?.[0]) options = dv.formulae[0].replace(/^"|"$/g, '').split(',').map((s: string) => s.trim())
      out.push({ id: `Q${out.length + 1}`, sheet: ws.name, row: r, acol: found.a, ecol: found.e, question: text, options })
    }
  }
  return out
}

export async function writeWorkbook(buf: ArrayBuffer, rows: ExportRow[]): Promise<Uint8Array> {
  const Excel = await load()
  const wb = new Excel.Workbook()
  await wb.xlsx.load(buf)
  for (const r of rows) {
    const ws = wb.getWorksheet(r.sheet)
    if (!ws) continue
    ws.getCell(r.row, r.acol).value = r.answer
    if (r.ecol && r.comment) ws.getCell(r.row, r.ecol).value = r.comment
  }
  return restoreValidations(buf, new Uint8Array(await wb.xlsx.writeBuffer()))
}

// ExcelJS explodes a validation range into per-cell entries and re-merges them wrongly on save (C2:C22 became C10:C22 + C2:C22).
// Copy each sheet's original <dataValidations> block back, matching sheets by position.
async function restoreValidations(original: ArrayBuffer, exported: Uint8Array): Promise<Uint8Array> {
  const JSZip = (await import('jszip')).default
  const [a, b] = await Promise.all([JSZip.loadAsync(original), JSZip.loadAsync(exported)])
  const sheets = (z: typeof a) => Object.keys(z.files).filter((f) => /^xl\/worksheets\/sheet\d+\.xml$/.test(f)).sort((x, y) => parseInt(x.replace(/\D/g, '')) - parseInt(y.replace(/\D/g, '')))
  const block = /<dataValidations[\s\S]*?<\/dataValidations>/
  const [sa, sb] = [sheets(a), sheets(b)]
  if (sa.length !== sb.length) return exported
  for (let i = 0; i < sa.length; i++) {
    const orig = (await a.file(sa[i])!.async('string')).match(block)?.[0]
    const out = await b.file(sb[i])!.async('string')
    if (orig && block.test(out)) b.file(sb[i], out.replace(block, () => orig))
  }
  return b.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })
}

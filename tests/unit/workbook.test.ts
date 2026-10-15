import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import ExcelJS from 'exceljs'
import { readQuestions, writeWorkbook } from '@/lib/workbook'

const SAMPLE = join(__dirname, '../../public/sample/Northwind-Security-Questionnaire.xlsx')
const POC = 'C:/Users/Rohit Kakade/OneDrive/Documents/Claude/secq-poc'
const buf = () => { const b = readFileSync(SAMPLE); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer }

describe('workbook reading', () => {
  it('finds the 21 sample questions, the answer and comment columns, and the dropdown options', async () => {
    const qs = await readQuestions(buf())
    expect(qs).toHaveLength(21)
    expect(qs[0]).toMatchObject({ id: 'Q1', sheet: 'Questionnaire', row: 2, acol: 3, ecol: 4, options: ['Yes', 'No', 'N/A'] })
  })
})

describe('export', () => {
  it('writes only the approved rows and preserves workbook formatting (checked by the prototype fidelity checker)', async () => {
    const out = await writeWorkbook(buf(), [
      { sheet: 'Questionnaire', row: 4, acol: 3, ecol: 4, answer: 'Yes', comment: 'Source: Encryption Standard v1.4, Encryption: "Customer data at rest is encrypted with AES-256."' },
      { sheet: 'Questionnaire', row: 2, acol: 3, ecol: 4, answer: 'No', comment: 'Reviewer comment' },
    ])
    const dir = mkdtempSync(join(tmpdir(), 'secq-'))
    const file = join(dir, 'export.xlsx')
    writeFileSync(file, out)
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(file)
    const ws = wb.getWorksheet('Questionnaire')!
    expect(ws.getCell(4, 3).value).toBe('Yes')
    expect(ws.getCell(2, 3).value).toBe('No')
    expect(ws.getCell(5, 3).value).toBeNull() // unapproved row stays blank
    expect(ws.getCell(5, 4).value).toBeNull()
    const res = execFileSync(`${POC}/.venv/Scripts/python.exe`, [`${POC}/compare_xlsx.py`, `${POC}/fixtures_out/questionnaire.xlsx`, file], { cwd: POC, encoding: 'utf8' })
    expect(res).toContain('FIDELITY: PASS')
  })
})

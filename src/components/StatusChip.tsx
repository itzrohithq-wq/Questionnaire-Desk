import type { Status } from '@/lib/types'

// Status is always spelled out in words and a glyph, never colour alone.
export const STATUS: Record<Status, { label: string; glyph: string; cls: string }> = {
  suggested: { label: 'Suggested, needs review', glyph: '◌', cls: 'bg-white text-ink border-[#a3a3a0] border-dashed' },
  'needs-judgment': { label: 'Needs your judgment', glyph: '?', cls: 'bg-warn-soft text-warn border-warn/40' },
  'no-evidence': { label: 'No supporting evidence', glyph: '–', cls: 'bg-white text-muted border-line' },
  edited: { label: 'Edited, needs approval', glyph: '✎', cls: 'bg-white text-accent-ink border-accent-edge border-dashed' },
  approved: { label: 'Approved', glyph: '✓', cls: 'bg-accent text-ink border-accent-edge' },
  rejected: { label: 'Rejected, will not export', glyph: '✕', cls: 'bg-danger-soft text-danger border-danger/40' },
  'needs-evidence': { label: 'More evidence needed', glyph: '!', cls: 'bg-warn-soft text-warn border-warn/40' },
}

export default function StatusChip({ status, className = '' }: { status: Status; className?: string }) {
  const s = STATUS[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.cls} ${className}`}>
      <span aria-hidden="true">{s.glyph}</span>
      {s.label}
    </span>
  )
}

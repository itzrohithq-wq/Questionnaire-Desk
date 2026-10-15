import { Check, Clock, Hand } from 'lucide-react'
import type { Item, Review, Status } from '@/lib/types'
import { initialReview, statusOf } from '@/lib/review'

type Counts = Record<Status, number>

// One tick per question, coloured by review state. Decorative: the numbers beside it carry the same information as text.
const TICK: Partial<Record<Status, string>> = { approved: 'bg-accent-edge', rejected: 'bg-danger', 'needs-evidence': 'bg-warn' }

export default function Stats({ items, reviews, counts, reviewed }: { items: Item[]; reviews: Record<string, Review>; counts: Counts; reviewed: number }) {
  const held = counts.rejected + counts['needs-evidence']
  const waiting = items.length - counts.approved - held
  const tile = (label: string, value: number, Icon: typeof Check, tint: string) => (
    <div className="card card-hover flex flex-col justify-between p-4">
      <div className="flex items-center gap-2 text-sm text-muted"><span className={`grid size-7 place-items-center rounded-full ${tint}`}><Icon size={14} strokeWidth={2} aria-hidden="true" /></span>{label}</div>
      <p className="mt-3 text-4xl font-semibold tabular-nums tracking-tight">{value}</p>
    </div>
  )
  return (
    <section aria-label="Review progress" className="grid grid-cols-3 gap-3 sm:gap-4">
      {tile('Approved', counts.approved, Check, 'bg-accent text-ink')}
      {tile('Awaiting review', waiting, Clock, 'bg-sunken text-ink')}
      {tile('Held back', held, Hand, 'bg-warn-soft text-warn')}
      <div className="card col-span-3 p-4">
        <p className="text-sm" data-testid="progress">{counts.approved} approved, {reviewed} of {items.length} reviewed</p>
        <div className="mt-3 flex h-10 items-end gap-1" aria-hidden="true">
          {items.map((it) => {
            const st = statusOf(it, reviews[it.q.id] ?? initialReview(it))
            const on = TICK[st]
            return <span key={it.q.id} className={`flex-1 rounded-full transition-all duration-500 ${on ?? 'bg-line-strong'}`} style={{ height: on ? '100%' : '35%' }} />
          })}
        </div>
      </div>
    </section>
  )
}

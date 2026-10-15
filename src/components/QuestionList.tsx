'use client'
import type { Item, Review } from '@/lib/types'
import { initialReview, statusOf } from '@/lib/review'
import StatusChip from './StatusChip'

export default function QuestionList({ items, reviews, selected, onSelect }: { items: Item[]; reviews: Record<string, Review>; selected: string; onSelect: (id: string) => void }) {
  const move = (e: React.KeyboardEvent, i: number) => {
    const j = e.key === 'ArrowDown' ? i + 1 : e.key === 'ArrowUp' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : -1
    if (j < 0 || j >= items.length) return
    e.preventDefault()
    onSelect(items[j].q.id)
    document.getElementById(`q-${items[j].q.id}`)?.focus()
  }
  return (
    <nav aria-label="Questions" className="card flex h-full flex-col p-3">
      <h2 className="px-2 pb-3 pt-2 text-base font-semibold tracking-tight">Questionnaire <span className="font-normal text-muted">{items.length}</span></h2>
      <ul className="-mx-1 flex-1 space-y-1 overflow-y-auto px-1 pb-1" data-testid="question-list">
        {items.map((it, i) => {
          const st = statusOf(it, reviews[it.q.id] ?? initialReview(it))
          const on = it.q.id === selected
          return (
            <li key={it.q.id}>
              <button
                id={`q-${it.q.id}`}
                onClick={() => onSelect(it.q.id)}
                onKeyDown={(e) => move(e, i)}
                aria-current={on ? 'step' : undefined}
                className={`relative w-full rounded-2xl border p-3 text-left transition-colors ${on ? 'border-ink bg-sunken' : 'border-transparent hover:bg-sunken'}`}
              >
                {on && <span aria-hidden="true" className="absolute inset-y-3 left-0 w-1 rounded-full bg-accent" />}
                <span className="block text-xs text-muted">Question {i + 1}</span>
                <span className="mt-0.5 block text-sm font-medium leading-snug">{it.q.question}</span>
                <StatusChip status={st} className="mt-2" />
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

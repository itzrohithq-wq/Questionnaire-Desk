'use client'
import { useEffect, useRef } from 'react'

export const STEPS = [
  { target: 'list', title: 'Review the questionnaire', body: 'Each question shows its status. The software drafted an answer only where your policies support one.' },
  { target: 'evidence', title: 'Inspect the evidence', body: 'Open a question to see the policy passage it cites. The highlighted text is the exact source.' },
  { target: 'answer', title: 'Examine a suggestion', body: 'A dashed edge means software suggested it and nobody has reviewed it. Questions with no suggestion need your own answer.' },
  { target: 'actions', title: 'Approve or edit', body: 'Approve a suggestion you trust, edit it, reject it, or mark that more evidence is needed. An edit has to be approved again.' },
  { target: 'export', title: 'Export the reviewed file', body: 'Only approved answers are written into the Excel file. Everything else stays blank.' },
]

export default function Tour({ step, setStep, onClose }: { step: number; setStep: (n: number) => void; onClose: () => void }) {
  const head = useRef<HTMLHeadingElement>(null)
  useEffect(() => { head.current?.focus() }, [step])
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  const s = STEPS[step]
  return (
    <div role="dialog" aria-modal="false" aria-labelledby="tour-h" data-testid="tour"
      className="rise fixed inset-x-3 bottom-16 z-40 rounded-[20px] border border-line bg-white p-5 shadow-[0_20px_50px_-20px_rgb(23_23_23_/_0.35)] md:inset-x-auto md:bottom-6 md:right-6 md:w-96 lg:bottom-6">
      <p className="text-sm text-muted">Step {step + 1} of {STEPS.length}</p>
      <h2 id="tour-h" ref={head} tabIndex={-1} className="mt-1 text-xl font-semibold tracking-tight outline-none">{s.title}</h2>
      <p className="mt-2 text-sm">{s.body}</p>
      <div className="mt-4 flex items-center justify-between gap-2">
        <button onClick={onClose} className="text-sm text-muted underline">End the guide</button>
        <div className="flex gap-2">
          <button onClick={() => setStep(step - 1)} disabled={step === 0} className="btn py-1.5">Back</button>
          {step < STEPS.length - 1
            ? <button onClick={() => setStep(step + 1)} className="btn btn-primary py-1.5">Next</button>
            : <button onClick={onClose} className="btn btn-primary py-1.5">Finish</button>}
        </div>
      </div>
    </div>
  )
}

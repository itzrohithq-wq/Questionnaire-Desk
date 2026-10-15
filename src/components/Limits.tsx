'use client'
import { useEffect, useRef } from 'react'
import { SUPPORTED, UNSUPPORTED } from '@/lib/workbook'

export default function Limits({ onClose }: { onClose: () => void }) {
  const h = useRef<HTMLHeadingElement>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    h.current?.focus()
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') close.current() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="lim-h" onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[20px] bg-white p-6 shadow-xl">
        <h2 id="lim-h" ref={h} tabIndex={-1} className="text-xl font-semibold tracking-tight outline-none">What this demo can and cannot do</h2>
        <h3 className="mt-4 text-sm font-semibold">The Excel export keeps</h3>
        <ul className="mt-1 list-disc pl-5 text-sm">{SUPPORTED.map((s) => <li key={s}>{s}</li>)}</ul>
        <h3 className="mt-4 text-sm font-semibold">The Excel export does not support</h3>
        <ul className="mt-1 list-disc pl-5 text-sm">{UNSUPPORTED.map((s) => <li key={s}>{s}</li>)}</ul>
        <p className="mt-2 text-sm text-muted">Fidelity is checked on this sample workbook only. It is not promised for every file.</p>
        <h3 className="mt-4 text-sm font-semibold">Matching</h3>
        <p className="text-sm">Simple keyword matching, not AI. It misses reworded policies and says so. It never invents a control or certification, and it leaves unclear questions to the reviewer.</p>
        <h3 className="mt-4 text-sm font-semibold">Data</h3>
        <p className="text-sm">Everything here is fictional. The demo runs in your browser, uses no AI service, and stores review choices only in this browser tab&apos;s session. Do not load real company files.</p>
        <button onClick={onClose} className="btn btn-primary mt-5">Close</button>
      </div>
    </div>
  )
}

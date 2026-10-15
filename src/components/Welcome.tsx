'use client'
import { useState } from 'react'
import { ArrowRight, Download, Check } from 'lucide-react'

export default function Welcome({ onStart, loading, error }: { onStart: () => void; loading: boolean; error: string | null }) {
  const [approved, setApproved] = useState(false)
  return (
    <main id="main" className="mx-auto grid max-w-6xl gap-12 px-5 py-10 md:px-8 md:py-16 lg:grid-cols-[1.05fr_1fr] lg:items-center">
      <section aria-labelledby="hero">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-sm text-muted"><span aria-hidden="true" className="size-2 rounded-full bg-accent-edge"></span>Demo with fictional data. Nothing is uploaded.</p>
        <h1 id="hero" className="text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl">
          Security questionnaires answered from your approved policies. Nothing leaves without review.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          Try the workflow on a fictional company&apos;s questionnaire in about four minutes. Check the evidence, review each suggestion, and download the completed Excel file.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button onClick={onStart} disabled={loading} className="btn btn-primary px-6 py-3 text-base">
            {loading ? 'Loading the sample' : 'Start the interactive demo'}<ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <a href="./sample/Northwind-Security-Questionnaire.xlsx" download className="btn px-5 py-3 text-base">
            <Download size={18} strokeWidth={1.75} aria-hidden="true" />Download the sample questionnaire
          </a>
        </div>
        {error && <p role="alert" className="mt-4 rounded-lg bg-danger-soft p-3 text-danger">{error}</p>}
        <dl className="mt-10 grid max-w-xl grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          <div><dt className="text-muted">Company</dt><dd className="font-medium">Northwind Synthetic Ltd</dd></div>
          <div><dt className="text-muted">Questionnaire</dt><dd className="font-medium">21 questions, Excel</dd></div>
          <div><dt className="text-muted">Evidence</dt><dd className="font-medium">6 fictional policies</dd></div>
        </dl>
      </section>

      <section aria-labelledby="try" className="card rise p-6 md:p-8">
        <h2 id="try" className="text-xl font-semibold tracking-tight">Try the one idea behind it</h2>
        <p className="mt-1 text-sm text-muted">Software only suggests. A suggestion is drawn with a dashed edge until a reviewer approves it.</p>
        <div className="mt-5 rounded-[20px] bg-sunken p-4">
          <p className="text-sm text-muted">Question 3 of 21</p>
          <p className="mt-1 font-medium">Is customer data encrypted at rest?</p>
          <div className={`mt-3 rounded-xl p-4 ${approved ? 'approved stamp' : 'suggestion'}`} data-testid="mini-row">
            <p className="text-sm font-semibold">{approved ? 'Approved by the reviewer' : 'Software suggestion, not yet reviewed'}</p>
            <p className="mt-1 text-lg font-semibold">Yes</p>
            <p className="passage mt-2 text-sm"><span className="marker">Customer data at rest is encrypted with AES-256.</span></p>
            <p className="mt-1 text-xs text-muted">Encryption Standard v1.4, fictional</p>
          </div>
          <button onClick={() => setApproved((a) => !a)} aria-pressed={approved} className="btn mt-4">
            {approved ? <Check size={16} strokeWidth={1.75} aria-hidden="true" /> : null}{approved ? 'Undo approval' : 'Approve this suggestion'}
          </button>
        </div>
        <ul className="mt-6 space-y-2 text-sm text-muted">
          <li>The demo runs in your browser. No file you open here is sent anywhere.</li>
          <li>Matching is simple keyword matching, not AI. It stays cautious and hands anything unclear to you.</li>
          <li>You act as the reviewer. In the service we are exploring, a person on the service team does this review.</li>
          <li>Please do not load real company files into this demo.</li>
        </ul>
      </section>
    </main>
  )
}

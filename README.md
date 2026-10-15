# Questionnaire desk demo

Interactive, browser-only demo of a human-reviewed security-questionnaire workflow on **fictional** data (Northwind Synthetic Ltd).
Sample questionnaire (.xlsx) + six fictional policies -> keyword-matched suggestions -> human review -> Excel export of approved answers only.

Not AI. The matcher is a deterministic keyword engine (TypeScript port of `secq-poc/secq.py`, parity-tested). No network calls, no upload control in the default build, no external APIs.

## Run locally

```bash
npm install
npm run build
npm run serve      # http://localhost:3100
```

Dev mode: `npm run dev` (same port). Regenerate fixtures from the Python prototype: `npm run data` (needs `secq-poc/.venv`).

## Test

```bash
npm run test:unit  # matcher parity vs Python, review rules, export + fidelity checker
npm run test:e2e   # Playwright, desktop + mobile; config starts the static server
```

Playwright uses an already-installed Chromium (`CHROMIUM_PATH` to override). Export fidelity is checked by `secq-poc/compare_xlsx.py`.

## Supported in export
Sheet order and hidden sheets, column widths, row heights, merges, basic formatting, Yes/No/N/A dropdowns, conditional formatting, freeze panes.

## Not supported
Embedded images, charts, macros (.xlsm), pivot tables, form controls, web-portal questionnaires, PDFs. The fidelity checker cannot see images, charts or macros.

## Hosting
`out/` is a static site (`output: 'export'`); any free static host works (Cloudflare Pages, GitHub Pages, Vercel hobby). Not deployed.

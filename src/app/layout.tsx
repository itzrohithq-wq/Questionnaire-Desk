import type { Metadata, Viewport } from 'next'
import '@fontsource-variable/instrument-sans'
import '@fontsource-variable/source-serif-4'
import './globals.css'
import { faviconUri } from '@/lib/logo'

export const metadata: Metadata = {
  title: 'Questionnaire desk demo',
  description: 'Try a human-reviewed security questionnaire workflow on fictional data. Nothing is uploaded.',
  robots: { index: false, follow: false },
  icons: { icon: faviconUri },
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="sr-only-focusable fixed left-3 top-3 z-50 rounded-lg bg-ink px-3 py-2 text-white">Skip to main content</a>
        {children}
      </body>
    </html>
  )
}

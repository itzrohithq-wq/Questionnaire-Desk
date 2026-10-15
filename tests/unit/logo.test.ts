import { describe, expect, it } from 'vitest'
import { LOGO, faviconSvg, faviconUri } from '@/lib/logo'

describe('logo', () => {
  it('favicon is lime + ink by default and switches the block to paper in dark colour scheme', () => {
    expect(faviconSvg).toContain(`fill="${LOGO.lime}"`)
    expect(faviconSvg).toContain(`.b{fill:${LOGO.ink}}`)
    expect(faviconSvg).toMatch(/@media \(prefers-color-scheme:dark\)\{\.b\{fill:#f5f6f4\}\}/)
    expect(decodeURIComponent(faviconUri.split(',')[1])).toBe(faviconSvg)
  })
})

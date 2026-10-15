import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Only used to run the guide-visual generator (vis.guide.test.tsx) with the app's TSX and '@' alias.
export default defineConfig({
  root: fileURLToPath(new URL('../..', import.meta.url)),
  resolve: { alias: { '@': fileURLToPath(new URL('../../src', import.meta.url)) } },
  test: { include: ['docs/guide/vis.guide.test.tsx'], environment: 'node', testTimeout: 60000 },
})

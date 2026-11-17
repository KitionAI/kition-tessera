import { defineConfig } from 'vitest/config'
import { tesseraAlias } from './site/vite.config'

export default defineConfig({
  resolve: { alias: tesseraAlias },
  test: {
    include: ['packages/*/test/**/*.test.{ts,tsx}', 'packages/*/src/**/*.test.{ts,tsx}', 'site/src/**/*.test.{ts,tsx}'],
  },
})

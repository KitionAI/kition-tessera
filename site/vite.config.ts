import react from '@vitejs/plugin-react'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { thirdPartyLicenses } from './scripts/third-party-licenses.mjs'

const site = dirname(fileURLToPath(import.meta.url))
/** The repository root, for the files the site reads beside the packages' exports (kit icons, the version). */
export const tesseraAlias = { '@tessera': join(site, '..') }

// The Tessera site: docs, icons, tokens and skins, from the packages' source.
export default defineConfig({
  root: site,
  plugins: [react(), thirdPartyLicenses()],
  resolve: { alias: tesseraAlias, dedupe: ['react', 'react-dom'] },
  server: { port: 4340, host: '127.0.0.1' },
})

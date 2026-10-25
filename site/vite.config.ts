import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The Tessera preview site: icons, tokens and skins, and the components, from the packages' source.
export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: { dedupe: ['react', 'react-dom'] },
  server: { port: 4340, host: '127.0.0.1' },
})

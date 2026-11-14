import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

/** Preserve the licenses of the dependencies actually bundled into the static site. */
export function thirdPartyLicenses() {
  return {
    name: 'tessera-third-party-licenses',
    apply: (config, { command }) => command === 'build' && !config.build?.ssr,
    generateBundle(options, bundle) {
      const dependencies = new Map()
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') continue
        for (const id of Object.keys(chunk.modules)) {
          if (!id.includes('/node_modules/') || id.startsWith('\0')) continue
          let dir = dirname(id.split('?')[0])
          while (dirname(dir) !== dir) {
            const manifest = join(dir, 'package.json')
            if (existsSync(manifest)) {
              const pkg = JSON.parse(readFileSync(manifest, 'utf8'))
              if (pkg.name && pkg.version) {
                const key = `${pkg.name}@${pkg.version}`
                if (!dependencies.has(key)) {
                  const files = readdirSync(dir).filter((name) => /^(licen[cs]e|copying|notice)([.-].*)?$/i.test(name)).sort()
                  // These older releases omit their upstream MIT license from the npm archive.
                  const fallback = pkg.name.startsWith('@radix-ui/') && pkg.version === '1.1.1' || ['@radix-ui/react-context@1.1.2', '@radix-ui/react-compose-refs@1.1.2'].includes(key)
                    ? 'LICENSE-radix'
                    : key === 'react-remove-scroll-bar@2.3.8' ? 'LICENSE-react-remove-scroll-bar' : null
                  const texts = files.map((name) => readFileSync(join(dir, name), 'utf8').trim())
                  if (!files.some((name) => /^(licen[cs]e|copying)/i.test(name))) {
                    if (!fallback) this.error(`Missing license text for ${key}`)
                    texts.unshift(readFileSync(join(root, 'site/licenses', fallback), 'utf8').trim())
                  }
                  if (!['MIT', 'ISC', 'Apache-2.0', '0BSD', 'BSD-2-Clause', 'BSD-3-Clause'].includes(pkg.license)) this.error(`Review redistribution license for ${key}: ${pkg.license}`)
                  dependencies.set(key, `${key} (${pkg.license})\n\n${texts.join('\n\n')}`)
                }
                break
              }
            }
            dir = dirname(dir)
          }
        }
      }
      const notices = ['NOTICE', 'LICENSE', 'packages/icons/NOTICE', 'packages/icons/LICENSE-lucide'].map((file) => readFileSync(join(root, file), 'utf8').trim())
      this.emitFile({ type: 'asset', fileName: 'THIRD_PARTY_LICENSES.txt', source: [...notices, ...[...dependencies.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, notice]) => notice)].join('\n\n---\n\n') + '\n' })
    },
  }
}

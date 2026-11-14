#!/usr/bin/env node
/**
 * Tessera Icons load in plain Node (type stripping, no bundler): kits' plain-Node tests import
 * modules that hold icons. Fails when a module of the icons package uses JSX or an import without
 * its `.ts` extension.
 */
const icons = await import('../packages/icons/src/index.ts')
const react = await import('../packages/icons/src/react.ts')
await import('../packages/icons/src/registry.ts')
if (!icons.Layers || typeof react.LayersIcon !== 'object' || react.LayersIcon.displayName !== 'layersIcon') {
  console.error('@kition/tessera-icons did not load in Node as expected')
  process.exit(1)
}
console.log('tessera-icons: loads in plain Node')

/** Where things are: the site, the repository, and its Markdown docs. */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const site = join(dirname(fileURLToPath(import.meta.url)), '..')
export const root = join(site, '..')
export const docsDir = join(root, 'docs')

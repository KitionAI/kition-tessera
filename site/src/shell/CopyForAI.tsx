import { Button, MenuButton, MenuItem, MenuSeparator, toast } from '@kition/tessera-ui'
import { ChevronDownIcon, ExternalLinkIcon, FileTextIcon, MessageSquareIcon, SparklesIcon } from '@kition/tessera-icons/react'
import { SITE_URL } from '../routes'

/**
 * What an assistant needs to work with this page: the page as Markdown (the repository's docs/,
 * served under /markdown/), or a prompt that points at it and at the whole reference.
 */
export function CopyForAI({ markdown, subject, importLine }: { /** The page's Markdown file under /markdown/. */ markdown: string; /** What the prompt asks to use: "the NumberField component". */ subject: string; importLine?: string }) {
  const path = `/markdown/${markdown}`
  const copy = async (text: string | Promise<string>, done: string) => {
    try {
      await navigator.clipboard.writeText(await text)
      toast.success(done)
    } catch {
      toast.error('Could not copy: the browser blocked the clipboard.')
    }
  }
  const prompt = [
    `Use ${subject} of Kition Tessera, the design system for professional editors.`,
    importLine ? `Import: ${importLine}` : null,
    `Read its documentation first and follow it exactly: ${SITE_URL}${path}`,
    `The whole Tessera reference, in one file: ${SITE_URL}/llms-full.txt`,
    'Rules: use a Tessera component where there is one instead of styling a raw element; take every colour, radius, font and shadow from the --kit-* theme tokens, never as a literal; give every icon-only control a label.',
  ]
    .filter(Boolean)
    .join('\n')
  return (
    <MenuButton
      align="end"
      trigger={({ toggle }) => (
        <Button variant="secondary" size="md" onClick={toggle}>
          <SparklesIcon size={15} /> Copy for AI <ChevronDownIcon size={14} />
        </Button>
      )}
    >
      <MenuItem icon={FileTextIcon} label="Copy this page as Markdown" onSelect={() => void copy(fetch(path).then((response) => (response.ok ? response.text() : Promise.reject(new Error(String(response.status))))), 'Page copied as Markdown')} />
      <MenuItem icon={MessageSquareIcon} label="Copy a prompt for an assistant" onSelect={() => void copy(prompt, 'Prompt copied')} />
      <MenuSeparator />
      <MenuItem icon={ExternalLinkIcon} label="Open the Markdown" onSelect={() => window.open(path, '_self')} />
      <MenuItem icon={ExternalLinkIcon} label="Open llms.txt" onSelect={() => window.open('/llms.txt', '_self')} />
    </MenuButton>
  )
}

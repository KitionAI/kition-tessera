import { useEffect, useMemo, useState } from 'react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut, Modal, ModalContent, ModalDescription, ModalTitle, toast } from '@kition/tessera-ui'
import { ArrowUpRightIcon, BlocksIcon, BookOpenIcon, FileTextIcon, MoonIcon, ShapesIcon, SunIcon, SwatchBookIcon, createIcon, type IconComponent } from '@kition/tessera-icons/react'
import { SKIN_IDS, type SkinId } from '@kition/tessera-tokens'
import { REPO_URL, navigate } from '../routes'
import type { SearchEntry } from './searchIndex'

type Index = typeof import('./searchIndex')

const LIMIT = { page: 8, icon: 18, token: 6 }
/** What the palette offers before anything is typed. */
const START: { label: string; href: string; icon: IconComponent }[] = [
  { label: 'Installation', href: '/docs/installation/', icon: BookOpenIcon },
  { label: 'All components', href: '/components/', icon: BlocksIcon },
  { label: 'Icons', href: '/icons/', icon: ShapesIcon },
  { label: 'Tokens and skins', href: '/tokens/', icon: SwatchBookIcon },
  { label: 'Theming and skins', href: '/docs/theming/', icon: BookOpenIcon },
]

const isColor = (value: string) => /^(#|rgb|hsl)/.test(value)

/**
 * The site's command palette (Cmd or Ctrl + K, or `/`): one field that finds guides, components,
 * icons and tokens, and runs a few actions. Built from Tessera's own Modal and Command.
 */
export function CommandPalette({ open, onOpenChange, skin, onSkin }: { open: boolean; onOpenChange: (open: boolean) => void; skin: SkinId; onSkin: (skin: SkinId) => void }) {
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState<Index | null>(null)
  useEffect(() => {
    if (open && !index) void import('./searchIndex').then(setIndex)
    if (!open) setQuery('')
  }, [open, index])
  const results = useMemo(() => (index ? index.search(query, LIMIT) : []), [index, query])
  const of = <K extends SearchEntry['kind']>(kind: K) => results.filter((entry): entry is Extract<SearchEntry, { kind: K }> => entry.kind === kind)
  const go = (href: string) => {
    onOpenChange(false)
    navigate(href)
  }
  const copy = (text: string, done: string) => {
    void navigator.clipboard?.writeText(text)
    toast.success(done)
    onOpenChange(false)
  }
  const pages = of('page')
  const icons = of('icon')
  const tokens = of('token')
  const typed = query.trim().length > 0
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="none" hideClose className="palette">
        <ModalTitle className="kui-visually-hidden">Search Tessera</ModalTitle>
        <ModalDescription className="kui-visually-hidden">Find a guide, a component, an icon, or a token.</ModalDescription>
        <Command shouldFilter={false} loop>
          <CommandInput placeholder="Search components, icons, tokens…" value={query} onValueChange={setQuery} />
          <CommandList>
            {typed && index ? <CommandEmpty>Nothing matches “{query.trim()}”.</CommandEmpty> : null}
            {!typed ? (
              <>
                <CommandGroup heading="Go to">
                  {START.map(({ label, href, icon: Icon }) => (
                    <CommandItem key={href} value={href} onSelect={() => go(href)}>
                      <Icon size={16} /> {label}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandGroup heading="Actions">
                  {SKIN_IDS.filter((id) => id !== skin).map((id) => (
                    <CommandItem key={id} value={`skin-${id}`} onSelect={() => { onSkin(id); onOpenChange(false) }}>
                      {id === 'graphite' ? <MoonIcon size={16} /> : <SunIcon size={16} />} Switch to the {id[0].toUpperCase() + id.slice(1)} skin
                    </CommandItem>
                  ))}
                  <CommandItem value="llms" onSelect={() => copy(`${location.origin}/llms-full.txt`, 'Address of llms-full.txt copied')}>
                    <FileTextIcon size={16} /> Copy the address of llms-full.txt
                  </CommandItem>
                  <CommandItem value="github" onSelect={() => { onOpenChange(false); window.open(REPO_URL, '_blank', 'noopener') }}>
                    <ArrowUpRightIcon size={16} /> Open GitHub
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
            {pages.length ? (
              <CommandGroup heading="Docs and components">
                {pages.map((entry) => (
                  <CommandItem key={entry.id} value={`page-${entry.id}`} onSelect={() => go(entry.href)}>
                    {entry.guide ? <BookOpenIcon size={16} /> : <BlocksIcon size={16} />}
                    <span className="palette-title">{entry.title}</span>
                    <span className="palette-text">{entry.text}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            {icons.length && index ? (
              <CommandGroup heading="Icons">
                <div className="palette-icons">
                  {icons.map((entry) => {
                    const Icon = iconOf(index, entry.id)
                    return (
                      <CommandItem key={entry.id} value={`icon-${entry.id}`} onSelect={() => go(entry.href)} title={entry.id}>
                        <Icon size={20} />
                        <span>{entry.id}</span>
                      </CommandItem>
                    )
                  })}
                </div>
              </CommandGroup>
            ) : null}
            {tokens.length ? (
              <CommandGroup heading="Tokens">
                {tokens.map((entry) => (
                  <CommandItem key={entry.id} value={`token-${entry.id}`} onSelect={() => copy(`var(${entry.id})`, `var(${entry.id}) copied`)}>
                    <span className="palette-swatch" style={isColor(entry.value) ? { background: `var(${entry.id})` } : undefined} />
                    <code className="palette-title">{entry.id}</code>
                    <span className="palette-text">{entry.text}</span>
                    <CommandShortcut>Copy</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
          </CommandList>
          <div className="palette-foot">
            <span><kbd>↑</kbd><kbd>↓</kbd> move</span>
            <span><kbd>↵</kbd> open</span>
            <span><kbd>esc</kbd> close</span>
          </div>
        </Command>
      </ModalContent>
    </Modal>
  )
}

const components = new Map<string, IconComponent>()
function iconOf(index: Index, name: string) {
  let component = components.get(name)
  if (!component) components.set(name, (component = createIcon(index.ICONS[name])))
  return component
}

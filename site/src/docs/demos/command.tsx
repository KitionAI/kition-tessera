import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut, toast } from '@kition/tessera-ui'
import { FileTextIcon, SettingsIcon, TableIcon } from '@kition/tessera-icons/react'

export default function Demo() {
  const run = (name: string) => toast('info', name)
  return (
    <div style={{ width: 'min(100%, 420px)', border: '1px solid var(--kit-border)', borderRadius: 12, background: 'var(--kit-surface)' }}>
      <Command>
        <CommandInput placeholder="Type a command…" />
        <CommandList>
          <CommandEmpty>No matching command.</CommandEmpty>
          <CommandGroup heading="Create">
            <CommandItem onSelect={() => run('New document')}>
              <FileTextIcon size={16} /> New document <CommandShortcut>⌘N</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => run('New table')}>
              <TableIcon size={16} /> New table
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="App">
            <CommandItem onSelect={() => run('Settings')}>
              <SettingsIcon size={16} /> Settings <CommandShortcut>⌘,</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  )
}

# Strings and elements

What components ask of the app around them: strings (StringsProvider) and element states (ElementsProvider). Without them, components draw in English with every element shown.

Category: Integration · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/providers/)

```ts
import { StringsProvider, ElementsProvider, Element } from '@kition/tessera-ui'
```

## Example: Strings and element states of your own

zh-CN strings; one group disabled, one hidden by the host.

```tsx
import { ElementsProvider, StringsProvider, createStrings, TESSERA_CATALOGS, PasswordInput, RibbonButton, RibbonGroup, type Elements } from '@kition/tessera-ui'
import { ClipboardPasteIcon } from '@kition/tessera-icons/react'

// An app gives Tessera its strings and element states.
const elements: Elements = {
  state: (id) => ({ hidden: id === 'group:home/hidden', disabled: id === 'group:home/clipboard' }),
  renderExtras: () => null,
  drawn: () => undefined,
}

export default function Demo() {
  return (
    <StringsProvider strings={createStrings(TESSERA_CATALOGS, 'zh-CN')}>
      <ElementsProvider elements={elements}>
        <div className="demo-ribbon">
          <RibbonGroup id="group:home/clipboard" label="Clipboard (disabled by the host)">
            <RibbonButton icon={ClipboardPasteIcon} label="Paste" size="large" />
          </RibbonGroup>
          <RibbonGroup id="group:home/hidden" label="Hidden by the host">
            <RibbonButton icon={ClipboardPasteIcon} label="Never drawn" size="large" />
          </RibbonGroup>
        </div>
        <div style={{ marginTop: 12, maxWidth: 280 }}>
          <PasswordInput size="md" defaultValue="secret" aria-label="Password" />
        </div>
      </ElementsProvider>
    </StringsProvider>
  )
}
```

## StringsProvider props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `strings` (required) | `Strings` |  |  |
| `children` (required) | `ReactNode` |  |  |

## ElementsProvider props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `elements` (required) | `Elements` |  |  |
| `children` (required) | `ReactNode` |  |  |

## Element props

Content that belongs to one element: not drawn when hidden; its form controls disabled when
disabled. A `fieldset` disables every control inside it without each control knowing.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `id` (required) | `string` |  |  |
| `children` (required) | `ReactNode` |  |  |

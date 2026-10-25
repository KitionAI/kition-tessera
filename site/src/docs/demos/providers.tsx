import { ElementsProvider, StringsProvider, createStrings, TESSERA_CATALOGS, PasswordInput, RibbonButton, RibbonGroup, type Elements } from '@kition/tessera'
import { ClipboardPasteIcon } from '@kition/tessera-icons/react'

// A host outside kit-ui gives Tessera its strings and element states itself.
// (Inside a kit, kit-ui's KitEditorProvider does this from the Kit UI protocol.)
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

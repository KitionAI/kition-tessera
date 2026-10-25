import { useState } from 'react'
import { ColorGrid, MenuButton, RibbonButton, RibbonGroup, RibbonStack } from '@kition/tessera'
import { BoldIcon, ClipboardPasteIcon, CopyIcon, ItalicIcon, LayersIcon, ScissorsIcon, SquareIcon } from '@kition/tessera-icons/react'

export default function Demo() {
  const [bold, setBold] = useState(false)
  const [fill, setFill] = useState('#5645d4')
  return (
    <div className="demo-ribbon">
      <RibbonGroup label="Clipboard">
        <RibbonButton icon={ClipboardPasteIcon} label="Paste" size="large" />
        <RibbonStack>
          <RibbonButton icon={ScissorsIcon} label="Cut" />
          <RibbonButton icon={CopyIcon} label="Copy" />
        </RibbonStack>
      </RibbonGroup>
      <RibbonGroup label="Font">
        <RibbonStack>
          <RibbonButton icon={BoldIcon} label="Bold" size="icon" pressed={bold} onClick={() => setBold(!bold)} />
          <RibbonButton icon={ItalicIcon} label="Italic" size="icon" />
        </RibbonStack>
      </RibbonGroup>
      <RibbonGroup label="Fill">
        <MenuButton trigger={({ toggle }) => <RibbonButton icon={SquareIcon} label="Fill" swatch={fill} onClick={toggle} />}>
          <ColorGrid onPick={setFill} />
        </MenuButton>
      </RibbonGroup>
      <RibbonGroup label="Arrange">
        <RibbonButton icon={LayersIcon} label="Layers" size="large" />
      </RibbonGroup>
    </div>
  )
}

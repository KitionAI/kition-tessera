// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { LayersIcon, createIcon } from '@kition/tessera-icons/react'
import { describe, expect, it } from 'vitest'
import type { IconComponent } from './icon'
import { IconButton } from './ui'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('IconComponent', () => {
  it('takes Tessera icons and icons made with createIcon alike', () => {
    const Mark = createIcon({ name: 'mark', family: 'ui', paths: ['M5 12h14', 'M12 5v14', 'M4 4h16v16H4z'], fills: [], accents: [] })
    const icons: IconComponent[] = [LayersIcon, Mark]
    for (const icon of icons) {
      const host = document.createElement('div')
      const root = createRoot(host)
      act(() => root.render(<IconButton icon={icon} label="Layers" />))
      expect(host.querySelectorAll('svg path').length).toBe(3)
      act(() => root.unmount())
    }
  })
})

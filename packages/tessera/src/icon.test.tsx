// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { Layers } from 'lucide-react'
import { LayersIcon } from '@kition/tessera-icons/react'
import { describe, expect, it } from 'vitest'
import type { IconComponent } from './icon'
import { IconButton } from './ui'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('IconComponent', () => {
  it('takes Tessera icons and lucide-react icons alike', () => {
    const icons: IconComponent[] = [LayersIcon, Layers]
    for (const icon of icons) {
      const host = document.createElement('div')
      const root = createRoot(host)
      act(() => root.render(<IconButton icon={icon} label="Layers" />))
      expect(host.querySelectorAll('svg path').length).toBe(3)
      act(() => root.unmount())
    }
  })
})

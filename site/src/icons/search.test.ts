import { describe, expect, it } from 'vitest'
import { ICON_CATEGORIES, ICON_NAMES, ICON_SEARCH } from '@kition/tessera-icons/registry'
import { searchIcons } from './search'

/** What people type, and the icon they mean: it has to be among the first five. */
const EXPECTED: [string, string][] = [
  ['delete', 'trash'],
  ['remove', 'trash'],
  ['bin', 'trash'],
  ['undo', 'undo-2'],
  ['redo', 'redo-2'],
  ['save', 'save'],
  ['paste', 'clipboard-paste'],
  ['cut', 'scissors'],
  ['duplicate', 'copy'],
  ['find', 'search'],
  ['magnifier', 'search'],
  ['add', 'plus'],
  ['close', 'x'],
  ['confirm', 'check'],
  ['edit', 'pencil'],
  ['picture', 'image'],
  ['photo', 'image'],
  ['stack', 'layers'],
  ['hide', 'eye-off'],
  ['visible', 'eye'],
  ['unlock', 'lock-open'],
  ['hyperlink', 'link'],
  ['cog', 'settings'],
  ['gear', 'settings'],
  ['font', 'type'],
  ['fill', 'paint-bucket'],
  ['eyedropper', 'pipette'],
  ['round corner', 'fillet'],
  ['bevel', 'chamfer'],
  ['bezier', 'spline'],
  ['dimension', 'dimension-linear'],
  ['keyframe', 'keyframe'],
  ['删除', 'trash'],
  ['撤销', 'undo-2'],
  ['重做', 'redo-2'],
  ['保存', 'save'],
  ['复制', 'copy'],
  ['粘贴', 'clipboard-paste'],
  ['剪切', 'scissors'],
  ['搜索', 'search'],
  ['图层', 'layers'],
  ['图片', 'image'],
  ['加粗', 'bold'],
  ['左对齐', 'text-align-start'],
  ['链接', 'link'],
  ['设置', 'settings'],
  ['隐藏', 'eye-off'],
  ['锁定', 'lock'],
  ['圆角', 'fillet'],
  ['关键帧', 'keyframe'],
  ['表格', 'table'],
  ['播放', 'play'],
]

describe('icon search', () => {
  it('finds the icon people mean, in English and in Chinese, among the first five', () => {
    const misses = EXPECTED.filter(([query, name]) => !searchIcons(query).slice(0, 5).includes(name)).map(([query, name]) => `${query} → ${name} (got ${searchIcons(query).slice(0, 5).join(', ') || 'nothing'})`)
    expect(misses).toEqual([])
  })

  it('puts an exact name first, forgives one wrong letter, and needs every word', () => {
    expect(searchIcons('layers')[0]).toBe('layers')
    expect(searchIcons('layrs')).toContain('layers')
    expect(searchIcons('align left zzzz')).toEqual([])
    expect(searchIcons('')).toEqual([...ICON_NAMES])
  })

  it('has a category that exists and at least one word for every icon', () => {
    for (const name of ICON_NAMES) {
      expect(ICON_CATEGORIES[ICON_SEARCH[name].category], name).toBeDefined()
      expect(ICON_SEARCH[name].keywords.length, name).toBeGreaterThan(0)
    }
  })
})

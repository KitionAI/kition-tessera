import { describe, expect, it } from 'vitest'
import { allRoutes, metaOf, pathOf, routeOf } from './routes'

describe('site routes', () => {
  it('gives every page a path of its own that leads back to it, without #', () => {
    const routes = allRoutes()
    const paths = routes.map((route) => pathOf(route.page, route.detail))
    expect(new Set(paths).size).toBe(paths.length)
    for (const [i, route] of routes.entries()) {
      expect(paths[i]).toMatch(/^\/([a-z0-9-]+\/)*$/)
      expect(routeOf(paths[i])).toEqual(route)
    }
  })

  it('opens the overview for unknown paths and the docs overview for /docs/', () => {
    expect(routeOf('/nope/')).toEqual({ page: 'home', detail: null })
    expect(routeOf('/docs/')).toEqual({ page: 'docs', detail: 'overview' })
    expect(routeOf('/icons/not-an-icon/')).toEqual({ page: 'icons', detail: null })
  })

  it('titles and describes every page', () => {
    for (const route of allRoutes()) {
      const meta = metaOf(route)
      expect(meta.title.length).toBeGreaterThan(5)
      expect(meta.description.length).toBeGreaterThan(20)
    }
  })
})

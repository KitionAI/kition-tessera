import '@kition/tessera-ui/styles.css'
import './site.css'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { App } from './App'
import { loadPage, type PageKey } from './pages'
import { routeOf } from './routes'

const root = document.getElementById('root')!
// The page this address shows is loaded before the first draw, so it matches the prerendered markup.
const { page, detail } = routeOf(location.pathname)
void loadPage(page as PageKey, detail).then(() => {
  const app = <App path={location.pathname} />
  // A prerendered page (pnpm build) carries its markup; the dev server's does not.
  if (root.firstElementChild) hydrateRoot(root, app)
  else createRoot(root).render(app)
})

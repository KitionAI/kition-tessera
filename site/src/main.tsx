import '@kition/tessera-ui/styles.css'
import './site.css'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { App } from './App'

const root = document.getElementById('root')!
const app = <App path={location.pathname} />
// A prerendered page (pnpm build) carries its markup; the dev server's does not.
if (root.firstElementChild) hydrateRoot(root, app)
else createRoot(root).render(app)

// ⛔ First: nothing that reads localStorage may load before it.
import './browser/requireStorage'
// The global styles, in the old wallet's order (../frontend/src/main.js): copies of its own, held
// to its picture by the specs (tests/fixtures/picture.ts).
import '@/styles/gradido.scss'
import '@/styles/open-sans.css'
import m from 'mithril'
import { App } from '@/components/layout/App'
import { AppOutdatedBar } from '@/components/layout/AppOutdatedBar'
import { Toasts } from '@/components/ui/Toasts'
import { reloadOnStaleChunk, watchForNewVersion } from './browser/newVersion'
import { setLocale } from './i18n'
import { routeResolvers } from './router'
import { ROUTES } from './routes'
import { session } from './store/Session'
// follows the theme from here on, whether or not a page asks for it
import './store/Theme'

const root = document.getElementById('app')
if (!root) {
  throw new Error('index.html has no #app')
}
// before a language is fetched: a deploy takes the old files away
reloadOnStaleChunk()
watchForNewVersion()
// The language chosen on this device, else the browser's. Drawn only once its texts are here:
// nothing is shown in another language first.
setLocale(session.state.language ?? navigator.language).then(() => {
  m.mount(document.body.appendChild(document.createElement('div')), Toasts)
  // above the pages, which own #app
  m.mount(document.body.insertBefore(document.createElement('div'), root), AppOutdatedBar)
  m.route.prefix = ''
  m.route(root, '/', routeResolvers(ROUTES, App))
})

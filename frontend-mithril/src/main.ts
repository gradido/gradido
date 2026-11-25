// ⛔ First: nothing that reads localStorage may load before it.
import './browser/requireStorage'
// The old wallet's styles, in its order (../frontend/src/main.js). gradido.css is the very file the
// old wallet loads, compiled by its `compile-scss` (turbo.json runs it before a build).
import '@frontend/assets/css/gradido.css'
import '@frontend/assets/fonts/open-sans/open-sans.css'
import './components/bootstrapVueNext.css'
import m from 'mithril'
import { reloadOnStaleChunk, watchForNewVersion } from './browser/newVersion'
import { AppOutdatedBar } from './components/AppOutdatedBar'
import { Toasts } from './components/Toasts'
import { setLocale } from './i18n'
import { ROUTES, routeResolvers } from './routes'
import { session } from './store/Session'
// follows the theme from here on, whether or not a page asks for it
import './store/Theme'

const root = document.getElementById('app')
if (!root) {
  throw new Error('index.html has no #app')
}
// before anything that opens a page: a deploy takes the chunks of the pages away
reloadOnStaleChunk()
watchForNewVersion()
// The language chosen on this device, else the browser's. Drawn only once its texts are here:
// nothing is shown in another language first.
setLocale(session.state.language ?? navigator.language).then(() => {
  m.mount(document.body.appendChild(document.createElement('div')), Toasts)
  // above the pages, which own #app
  m.mount(document.body.insertBefore(document.createElement('div'), root), AppOutdatedBar)
  m.route.prefix = ''
  m.route(root, '/', routeResolvers(ROUTES))
})

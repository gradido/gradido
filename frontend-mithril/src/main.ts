// AI-GENERATED — not an architecture reference
// ⛔ First: nothing that reads localStorage may load before it.
import './browser/requireStorage'
// The old wallet's styles, in its order (../frontend/src/main.js). gradido.css is the very file the
// old wallet loads, compiled by its `compile-scss` (turbo.json runs it before a build).
import '@frontend/assets/css/gradido.css'
import '@frontend/assets/fonts/open-sans/open-sans.css'
import CONFIG from '@frontend/config'
import m from 'mithril'

const root = document.getElementById('app')
if (!root) {
  throw new Error('index.html has no #app')
}
// No page is ported yet (todo.md): every address answers with the build it is.
m.route.prefix = ''
m.route(root, '/', {
  '/:path...': { view: () => m('main', `Gradido ${CONFIG.APP_VERSION} (Mithril)`) },
})

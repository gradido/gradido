// AI-GENERATED — not an architecture reference
// Bootstrap's CSS first, before any component brings its own. A component's CSS module rule
// has the same specificity as Bootstrap's (a scoped rule had one attribute more), so where both
// set the same property, the one loaded later wins -- and that has to be the component's.
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'

import { createApp } from 'vue'
import { App } from './App'

// without this async calls are not working
import 'regenerator-runtime'

import { createBootstrap } from 'bootstrap-vue-next'
import PortalVue from 'portal-vue'
import { i18n } from './i18n'
import { apolloClient } from './plugins/apolloProvider'
import { addNavigationGuards } from './router/guards'
import { router } from './router/router'
import { pinia, store } from './store/store'
import { dropMapWindowName } from './utils/mapWindow'

/**
 * Builds the admin interface: the app with its router, store, language and plugins, and the
 * guards on its routes.
 *
 * It may be starting in the window a pin opened for the map. So the name of that window is
 * taken off this one first: no pin, of this window or another, may take it for the map window
 * (utils/mapWindow.ts).
 */
export function createAdminApp() {
  dropMapWindowName()

  const app = createApp(App)

  app.use(router)
  app.use(pinia)

  // the moderator's language as the server keeps it: one of the locales, as before unchecked
  i18n.global.locale.value = (
    store.moderator && store.moderator.language ? store.moderator.language : 'en'
  ) as typeof i18n.global.locale.value

  app.use(i18n)
  app.use(PortalVue)
  app.use(createBootstrap())

  addNavigationGuards(router, store, apolloClient, i18n)
  return app
}

if (process.env.NODE_ENV !== 'test') {
  const app = createAdminApp()
  app.mount('#app')
}

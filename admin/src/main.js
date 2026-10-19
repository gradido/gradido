import { createApp } from 'vue'
import App from './App.vue'

// without this async calls are not working
import 'regenerator-runtime'

import { createBootstrap } from 'bootstrap-vue-next'
import PortalVue from 'portal-vue'
import { i18n } from './i18n'
import { addNavigationGuards } from './router/guards'
import { router } from './router/router'
import { pinia, store } from './store/store'

// Add the necessary CSS
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'

import { apolloClient } from './plugins/apolloProvider'
import { dropMapWindowName } from './utils/mapWindow'

/**
 * Builds the admin interface: the app with its router, store, language and plugins, and the
 * guards on its routes.
 *
 * It may be starting in the window a pin opened for the map. So the name of that window is
 * taken off this one first: no pin, of this window or another, may take it for the map window
 * (utils/mapWindow.js).
 */
export function createAdminApp() {
  dropMapWindowName()

  const app = createApp(App)

  app.use(router)
  app.use(pinia)

  i18n.global.locale.value =
    store.moderator && store.moderator.language ? store.moderator.language : 'en'

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

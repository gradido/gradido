import { createApp } from 'vue'

// import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'
import './assets/css/gradido.css'
// import './assets/scss/gradido.scss'

import App from './App'
import { createFilters } from './filters/amount'
import i18n from './i18n.js'
import { loadAllRules } from './validation-rules'

import 'regenerator-runtime'

import addNavigationGuards from './routes/guards'

import { store } from './store/store'

import router from './routes/router'

import { apolloProvider } from './plugins/apolloProvider'

import 'clipboard-polyfill/overwrite-globals'

import { createBootstrap } from 'bootstrap-vue-next'

import GlobalDirectives from '@/plugins/globalDirectives'
import { plugin as vueTransitionsPlugin } from '@morev/vue-transitions/vue3'
import PortalVue from 'portal-vue'
import '@morev/vue-transitions/styles'

const app = createApp(App)

app.use(router)
app.use(store)
app.use(i18n)
app.use(createBootstrap())
app.use(GlobalDirectives)
app.use(PortalVue)
app.use(() => apolloProvider)
// app.use(VueTimers)
app.use(vueTransitionsPlugin())

const filters = createFilters(i18n)
app.config.globalProperties.$filters = {
  amount: filters.amount,
  GDD: filters.GDD,
}

loadAllRules(i18n.global, apolloProvider.defaultClient)

addNavigationGuards(router, store, apolloProvider.defaultClient)

// Apply the device-local theme (system | light | dark) before mount so the first
// paint already carries the correct light/dark class.
store.dispatch('applyTheme')

// Restore the persisted UI language before mount. vuex-persistedstate rehydrates
// state.language without firing the `language` mutation (which is what sets the
// i18n locale). Previously this was masked by the login layout briefly rendering
// its language switcher on boot; now that we mount straight into the target route
// (see router.isReady below), sync the locale here so the app is not stuck on the
// default language until Settings is opened.
if (store.state.language) {
  i18n.global.locale.value = store.state.language
}

if (!store) {
  setTimeout(
    window.location.assign('https://github.com/gradido/gradido/tree/master/support#cookies'),
    5000,
  )
}

// Wait for the router's initial navigation to resolve before mounting. Otherwise
// the first render happens on the start location (which has no route meta), so
// App.vue picks the AuthLayout and the login page flashes for a moment on every
// reload of an authenticated route before the router lands on it and swaps in the
// DashboardLayout (also seen when returning from the admin interface).
router.isReady().then(() => {
  app.mount('#app', {
    stub: {
      ValidationObserver: {
        template: '<div>Validation Observer MOCK</div>',
      },
      ValidationProvider: {
        template: '<div>Validation Observer MOCK</div>',
      },
    },
  })
})

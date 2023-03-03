import Vue from 'vue'
import DashboardPlugin from './plugins/dashboard-plugin'
import App from './App'
import i18n from './i18n.js'
import { loadAllRules } from './validation-rules'
import { toasters } from './mixins/toaster'
import { loadFilters } from './filters/amount'

import 'regenerator-runtime'

import addNavigationGuards from './routes/guards'

import { store } from './store/store'

import router from './routes/router'

import { apolloProvider } from './plugins/apolloProvider'

import 'clipboard-polyfill/overwrite-globals'

// plugin setup
Vue.use(DashboardPlugin)
Vue.config.productionTip = false

Vue.mixin(toasters)
const filters = loadFilters(i18n)
Vue.filter('amount', filters.amount)
Vue.filter('GDD', filters.GDD)

loadAllRules(i18n)

addNavigationGuards(router, store, apolloProvider.defaultClient)

if (!store) {
  setTimeout(
    window.location.assign('https://github.com/gradido/gradido/tree/master/support#cookies'),
    5000,
  )
}

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  i18n,
  apolloProvider,
  render: (h) => h(App),
})

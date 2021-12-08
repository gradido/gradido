import Vue from 'vue'
import DashboardPlugin from './plugins/dashboard-plugin'
import App from './App.vue'
import i18n from './i18n.js'
import { loadAllRules } from './validation-rules'

import addNavigationGuards from './routes/guards'

import { store } from './store/store'

import router from './routes/router'

import { apolloProvider } from './plugins/apolloProvider'

// plugin setup
Vue.use(DashboardPlugin)
Vue.config.productionTip = false

loadAllRules(i18n)

addNavigationGuards(router, store, apolloProvider.defaultClient)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  i18n,
  apolloProvider,
  render: (h) => h(App),
})

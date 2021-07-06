import Vue from 'vue'
import DashboardPlugin from './plugins/dashboard-plugin'
import App from './App.vue'
import i18n from './i18n.js'
import { loadAllRules } from './validation-rules'

import { store } from './store/store'

import router from './routes/router'

// plugin setup
Vue.use(DashboardPlugin)
Vue.config.productionTip = false

loadAllRules(i18n)

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !store.state.sessionId) {
    next({ path: '/login' })
  } else {
    next()
  }
})

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  i18n,
  render: (h) => h(App),
})

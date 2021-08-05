import Vue from 'vue'
import DashboardPlugin from './plugins/dashboard-plugin'
import App from './App.vue'
import i18n from './i18n.js'
import { loadAllRules } from './validation-rules'
import ApolloClient from 'apollo-boost'
import VueApollo from 'vue-apollo'
import CONFIG from './config'

import { store } from './store/store'

import router from './routes/router'

const apolloClient = new ApolloClient({
  uri: CONFIG.GRAPHQL_URI,
})

const apolloProvider = new VueApollo({
  defaultClient: apolloClient,
})

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
  apolloProvider,
  render: (h) => h(App),
})

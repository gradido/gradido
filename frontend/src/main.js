import { createApp } from 'vue'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'

// import DashboardPlugin from './plugins/dashboard-plugin'
import App from './App'
import i18n from './i18n.js'
import { loadAllRules } from './validation-rules'
import { createFilters } from './filters/amount'

import 'regenerator-runtime'

import addNavigationGuards from './routes/guards'

import { store } from './store/store'

import router from './routes/router'

import { apolloProvider } from './plugins/apolloProvider'

import 'clipboard-polyfill/overwrite-globals'

import { createBootstrap } from 'bootstrap-vue-next'

// import GlobalComponents from '@/plugins/globalComponents'
import GlobalDirectives from '@/plugins/globalDirectives'
import PortalVue from 'portal-vue'
import FlatPickr from 'vue-flatpickr-component'

const app = createApp(App)

// plugin setup
// app.use(DashboardPlugin)
// Vue.config.productionTip = false
app.use(router)
app.use(store)
app.use(i18n)
app.use(createBootstrap())
// app.use(GlobalComponents)
app.use(GlobalDirectives)
app.use(PortalVue)
app.use(FlatPickr)
app.use(() => apolloProvider)
// app.use(VueTimers)

const filters = createFilters(i18n)
app.config.globalProperties.$filters = {
  amount: filters.amount,
  GDD: filters.GDD,
}

loadAllRules(i18n.global, apolloProvider.defaultClient)

loadAllRules(i18n.global, apolloProvider.defaultClient)

addNavigationGuards(router, store, apolloProvider.defaultClient)

if (!store) {
  setTimeout(
    window.location.assign('https://github.com/gradido/gradido/tree/master/support#cookies'),
    5000,
  )
}

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

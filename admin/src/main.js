import Vue from 'vue'
import App from './App'

// without this async calls are not working
import 'regenerator-runtime'

import store from './store/store'

import router from './router/router'
import addNavigationGuards from './router/guards'

import i18n from './i18n'

import VueApollo from 'vue-apollo'

import PortalVue from 'portal-vue'

import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import { toasters } from './mixins/toaster'

import { apolloProvider } from './plugins/apolloProvider'

Vue.use(PortalVue)
Vue.use(BootstrapVue)

Vue.use(IconsPlugin)

Vue.use(VueApollo)

Vue.mixin(toasters)

addNavigationGuards(router, store, apolloProvider.defaultClient, i18n)

i18n.locale =
  store.state.moderator && store.state.moderator.language ? store.state.moderator.language : 'en'

new Vue({
  router,
  store,
  i18n,
  apolloProvider,
  render: (h) => h(App),
}).$mount('#app')

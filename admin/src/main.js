import Vue from 'vue'
import App from './App.vue'

// without this async calls are not working
import 'regenerator-runtime'

import store from './store/store'

import router from './router/router'
import addNavigationGuards from './router/guards'

import i18n from './i18n'

import VueApollo from 'vue-apollo'

import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'

// asset imports
import '@/assets/scss/argon.scss'
import '@/assets/vendor/nucleo/css/nucleo.css'

import Toasted from 'vue-toasted'

import { apolloProvider } from './plugins/apolloProvider'

Vue.use(BootstrapVue)

Vue.use(IconsPlugin)

Vue.use(VueApollo)

Vue.use(Toasted, {
  position: 'top-center',
  duration: 5000,
  fullWidth: true,
  action: {
    text: 'x',
    onClick: (e, toastObject) => {
      toastObject.goAway(0)
    },
  },
})

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

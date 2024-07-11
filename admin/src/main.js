import { createApp } from 'vue'
import App from './App.vue'

// without this async calls are not working
import 'regenerator-runtime'

import store from './store/store'

import router from './router/router'
import addNavigationGuards from './router/guards'

import i18n from './i18n'

import VueApollo from 'vue-apollo'

import PortalVue from 'portal-vue'

import { createBootstrap } from 'bootstrap-vue-next'

// Add the necessary CSS
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'

import { toasters } from './mixins/toaster'

import { apolloProvider } from './plugins/apolloProvider'

const app = createApp(App)

app.use(router)
app.use(store)
app.use(i18n)
app.use(PortalVue)
app.use(createBootstrap())

app.use(VueApollo)
app.use(apolloProvider)

app.mixin(toasters)

addNavigationGuards(router, store, apolloProvider.defaultClient, i18n)

i18n.locale =
  store.state.moderator && store.state.moderator.language ? store.state.moderator.language : 'en'

app.mount('#app')

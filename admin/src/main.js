import Vue from 'vue'
import App from './App.vue'

// without this async calls are not working
import 'regenerator-runtime'

import store from './store/store'

import router from './router/router'
import addNavigationGuards from './router/guards'

import i18n from './i18n'

import { ApolloClient, ApolloLink, InMemoryCache, HttpLink } from 'apollo-boost'
import VueApollo from 'vue-apollo'

import CONFIG from './config'

import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import moment from 'vue-moment'
import Toasted from 'vue-toasted'

const httpLink = new HttpLink({ uri: CONFIG.GRAPHQL_URI })

const authLink = new ApolloLink((operation, forward) => {
  const token = store.state.token

  operation.setContext({
    headers: {
      Authorization: token && token.length > 0 ? `Bearer ${token}` : '',
    },
  })
  return forward(operation).map((response) => {
    if (response.errors && response.errors[0].message === '403.13 - Client certificate revoked') {
      response.errors[0].message = i18n.t('error.session-expired')
      store.dispatch('logout', null)
      if (router.currentRoute.path !== '/logout') router.push('/logout')
      return response
    }
    const newToken = operation.getContext().response.headers.get('token')
    if (newToken) store.commit('token', newToken)
    return response
  })
})

const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
})

const apolloProvider = new VueApollo({
  defaultClient: apolloClient,
})

Vue.use(BootstrapVue)

Vue.use(IconsPlugin)

Vue.use(moment)

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

addNavigationGuards(router, store, apolloProvider.defaultClient)

new Vue({
  moment,
  router,
  store,
  i18n,
  apolloProvider,
  render: (h) => h(App),
}).$mount('#app')

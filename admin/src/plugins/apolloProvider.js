import { ApolloClient, ApolloLink, InMemoryCache, HttpLink } from 'apollo-boost'
import VueApollo from 'vue-apollo'
import CONFIG from '../config'
import store from '../store/store'
import { provideApolloClient } from '@vue/apollo-composable'

const httpLink = new HttpLink({ uri: CONFIG.GRAPHQL_URL })

const authLink = new ApolloLink((operation, forward) => {
  const token = store.state.token
  operation.setContext({
    headers: {
      Authorization: token && token.length > 0 ? `Bearer ${token}` : '',
      clientTimezoneOffset: new Date().getTimezoneOffset(),
    },
  })
  return forward(operation).map((response) => {
    if (response.errors && response.errors[0].message === '403.13 - Client certificate revoked') {
      store.dispatch('logout', null)
      window.location.assign(CONFIG.WALLET_LOGIN_URL)
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

provideApolloClient(apolloClient)

export const apolloProvider = new VueApollo({
  defaultClient: apolloClient,
})

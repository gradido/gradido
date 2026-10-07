import { ApolloClient, ApolloLink, InMemoryCache, HttpLink } from '@apollo/client/core'
import { onError } from '@apollo/client/link/error'
import VueApollo from 'vue-apollo'
import CONFIG from '../config'
import store from '../store/store'
import { provideApolloClient } from '@vue/apollo-composable'
import { isSchemaMismatch, markAppOutdated } from '@/composables/useAppOutdated'

const httpLink = new HttpLink({ uri: CONFIG.GRAPHQL_URI })

// A tab kept open across a deploy still sends the documents its bundle was built with, and
// the server validates a document in full before running it -- so a renamed field kills the
// whole operation and no retry helps until the page is reloaded. Raise a flag so
// AppOutdatedBar can offer that reload. The decision lives in useAppOutdated, testable
// without Apollo.
const outdatedLink = onError((failure) => {
  if (isSchemaMismatch(failure)) {
    markAppOutdated()
  }
})

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
  link: ApolloLink.from([outdatedLink, authLink, httpLink]),
  cache: new InMemoryCache(),
})

provideApolloClient(apolloClient)

export const apolloProvider = new VueApollo({
  defaultClient: apolloClient,
})

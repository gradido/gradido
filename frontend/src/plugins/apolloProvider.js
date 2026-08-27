import CONFIG from '../config'
import { store } from '@/store/store'
import router from '../routes/router'
import i18n from '../i18n'
import { createHttpLink, ApolloLink, ApolloClient, InMemoryCache } from '@apollo/client/core'
import { onError } from '@apollo/client/link/error'
import { createApolloProvider } from '@vue/apollo-option'
import { provideApolloClient } from '@vue/apollo-composable'
import { registerApolloCacheClear } from '@/plugins/apolloCache'
import { isSchemaMismatch, markAppOutdated } from '@/composables/useAppOutdated'

const httpLink = createHttpLink({ uri: CONFIG.GRAPHQL_URI })

// A tab kept open across a deploy still sends the documents its bundle was built with. The
// server validates a document in full before running it, so a renamed field kills the whole
// operation -- the member cannot file a contribution and no retry helps, because the bundle
// is fixed until the page is reloaded. Raise a flag so AppOutdatedBar can offer that reload.
// The decision itself lives in useAppOutdated, where it is testable without Apollo.
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
      response.errors[0].message = i18n.global.t('error.session-expired')
      store.dispatch('logout', null)
      if (router.currentRoute.path !== '/login') router.push('/login')
      return response
    }
    const newToken = operation.getContext().response.headers.get('token')
    if (newToken) store.commit('token', newToken)
    return response
  })
})

const apolloClient = new ApolloClient({
  link: ApolloLink.from([outdatedLink, authLink, httpLink]),
  cache: new InMemoryCache({
    possibleTypes: {
      QueryLinkResult: ['TransactionLink', 'ContributionLink'],
    },
  }),
})

provideApolloClient(apolloClient)

// Handed to the store, which cannot import this file - see apolloCache.js.
registerApolloCacheClear(() => apolloClient.clearStore())

export const apolloProvider = createApolloProvider({
  defaultClient: apolloClient,
})

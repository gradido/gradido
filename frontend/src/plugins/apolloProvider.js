import CONFIG from '../config'
import { store } from '../store/store'
import router from '../routes/router'
import i18n from '../i18n'
import { createHttpLink, ApolloLink, ApolloClient, InMemoryCache } from '@apollo/client/core'
import { createApolloProvider } from '@vue/apollo-option'
import { provideApolloClient } from '@vue/apollo-composable'

const httpLink = createHttpLink({ uri: CONFIG.GRAPHQL_URI })

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
      response.errors[0].message = i18n.t('error.session-expired')
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
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    possibleTypes: {
      QueryLinkResult: ['TransactionLink', 'ContributionLink'],
    },
  }),
})

provideApolloClient(apolloClient)

export const apolloProvider = createApolloProvider({
  defaultClient: apolloClient,
})

import { ApolloClient, ApolloLink, InMemoryCache, HttpLink } from 'apollo-boost'
import VueApollo from 'vue-apollo'
import CONFIG from '../config'
import { store } from '../store/store'
import router from '../routes/router'
import i18n from '../i18n'

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

export const apolloProvider = new VueApollo({
  defaultClient: apolloClient,
})

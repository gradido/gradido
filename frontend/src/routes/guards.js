import { verifyLogin } from '../graphql/queries'
import { clearApolloCache } from '../plugins/apolloCache'

const addNavigationGuards = (router, store, apollo) => {
  // handle publisherId
  router.beforeEach((to, from, next) => {
    const publisherId = to.query.pid
    if (publisherId) {
      store.commit('publisherId', publisherId)
      delete to.query.pid
    }
    next()
  })

  // store token on authenticate
  router.beforeEach(async (to, from, next) => {
    if (to.path === '/authenticate' && to.query.token) {
      // Another account may have been signed in here without logging out. Queries that
      // take no variables share one cache key, so they would answer from that account's
      // cache until the network catches up.
      await clearApolloCache()
      store.commit('token', to.query.token)
      await apollo
        .query({
          query: verifyLogin,
          fetchPolicy: 'network-only',
        })
        .then((result) => {
          store.dispatch('login', result.data.verifyLogin)
          // The picture is not part of the login action, because the login mutation cannot
          // carry it -- verifyLogin is the only query that hands it over. Whoever holds a
          // verifyLogin result puts it in the store; here that is free, since the result
          // is already in hand.
          store.commit('avatar', result.data.verifyLogin.avatar ?? null)
          store.commit(
            'avatarVisibleToMembers',
            result.data.verifyLogin.avatarVisibleToMembers ?? null,
          )
          next({ path: '/overview' })
        })
        .catch(() => {
          store.dispatch('logout')
          next()
        })
    } else {
      next()
    }
  })

  // handle authentication
  router.beforeEach((to, from, next) => {
    if (to.meta.requiresAuth && !store.state.token) {
      // store redirect path
      store.commit('redirectPath', to.path)
      next({ path: '/login' })
    } else {
      next()
    }
  })
}

export default addNavigationGuards

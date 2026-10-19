import { verifyLogin } from '../graphql/verifyLogin'
import CONFIG from '../config'
import { takeHandedOverToken } from '../utils/authToken'

const addNavigationGuards = (router, store, apollo, i18n) => {
  // store token on `authenticate`
  //
  // ⛔ The token comes out of localStorage where the wallet shares this origin, and out of the
  // address only where it does not (utils/authToken.js): on a deployment, a link with `?token=`
  // signs nobody in.
  router.beforeEach(async (to, from, next) => {
    const token =
      to.path === '/authenticate'
        ? takeHandedOverToken(to.query?.token, CONFIG.WALLET_AUTH_URL)
        : null
    if (token) {
      store.setToken(token)
      await apollo
        .query({
          query: verifyLogin,
          fetchPolicy: 'network-only',
        })
        .then((result) => {
          const moderator = result.data.verifyLogin
          if (moderator.role) {
            i18n.global.locale.value = moderator.language
            store.setModerator(moderator)
            next({ path: '/' })
          } else {
            next({ path: '/not-found' })
          }
        })
        .catch(() => {
          next({ path: '/not-found' })
        })
    } else {
      next()
    }
  })

  // protect all routes but `not-found`
  router.beforeEach((to, from, next) => {
    if (
      !CONFIG.DEBUG_DISABLE_AUTH && // we did not disabled the auth module for debug purposes
      (!store.token || // we do not have a token
        !store.moderator || // no moderator set in store
        !store.moderator.role) && // user is no admin
      to.path !== '/not-found' && // we are not on `not-found`
      to.path !== '/logout' // we are not on `logout`
    ) {
      next({ path: '/not-found' })
    } else {
      next()
    }
  })

  // Routes marked `requiresAdmin` are reserved for administrators. Menu visibility is a
  // convenience, not an access boundary, so the restriction is enforced here on the route
  // itself as well; the backend rights remain the final word.
  router.beforeEach((to, from, next) => {
    if (!CONFIG.DEBUG_DISABLE_AUTH && to.meta?.requiresAdmin && store.moderator?.role !== 'ADMIN') {
      next({ path: '/not-found' })
    } else {
      next()
    }
  })
}

export default addNavigationGuards

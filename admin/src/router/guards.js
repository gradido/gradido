import { verifyLogin } from '../graphql/verifyLogin'
import CONFIG from '../config'

const addNavigationGuards = (router, store, apollo, i18n) => {
  // store token on `authenticate`
  router.beforeEach(async (to, from, next) => {
    if (to.path === '/authenticate' && to.query && to.query.token) {
      store.commit('token', to.query.token)
      await apollo
        .query({
          query: verifyLogin,
          fetchPolicy: 'network-only',
        })
        .then((result) => {
          const moderator = result.data.verifyLogin
          if (moderator.roles.includes('ADMIN', 0) || moderator.roles.includes('MODERATOR', 0)) {
            i18n.locale = moderator.language
            moderator.isAdmin = moderator.roles.includes('ADMIN', 0)
            moderator.isModerator = moderator.roles.includes('MODERATOR', 0)
            store.commit('moderator', moderator)
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
      (!store.state.token || // we do not have a token
        !store.state.moderator || // no moderator set in store
        !(store.state.moderator.isAdmin || store.state.moderator.isModerator)) && // user is no admin
      to.path !== '/not-found' && // we are not on `not-found`
      to.path !== '/logout' // we are not on `logout`
    ) {
      next({ path: '/not-found' })
    } else {
      next()
    }
  })
}

export default addNavigationGuards

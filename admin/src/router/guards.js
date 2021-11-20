import CONFIG from '../config'

const addNavigationGuards = (router, store) => {
  // store token on `authenticate`
  router.beforeEach((to, from, next) => {
    if (to.path === '/authenticate' && to.query.token) {
      // TODO verify user to get user data
      store.commit('token', to.query.token)
      next({ path: '/' })
    } else {
      next()
    }
  })

  // protect all routes but `not-found`
  router.beforeEach((to, from, next) => {
    if (
      !CONFIG.DEBUG_DISABLE_AUTH && // we did not disabled the auth module for debug purposes
      !store.state.token && // we do not have a token
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

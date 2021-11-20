const addNavigationGuards = (router, store) => {
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
  router.beforeEach((to, from, next) => {
    if (to.path === '/authenticate' && to.query.token) {
      // TODO verify user in order to get user data
      store.commit('token', to.query.token)
      next({ path: '/overview' })
    } else {
      next()
    }
  })

  // handle authentication
  router.beforeEach((to, from, next) => {
    if (to.meta.requiresAuth && !store.state.token) {
      next({ path: '/login' })
    } else {
      next()
    }
  })
}

export default addNavigationGuards

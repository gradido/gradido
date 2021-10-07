const addNavigationGuards = (router, store) => {
  router.beforeEach((to, from, next) => {
    // handle publisherId
    const publisherId = to.query.pid
    if (publisherId) {
      store.commit('publisherId', publisherId)
      delete to.query.pid
    }
    // handle authentication
    if (to.meta.requiresAuth && !store.state.token) {
      next({ path: '/login' })
    } else {
      next()
    }
  })
}

export default addNavigationGuards

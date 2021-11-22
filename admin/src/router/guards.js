const addNavigationGuards = (router, store) => {
  router.beforeEach((to, from, next) => {
    // handle authentication
    if (to.meta.requiresAuth && !store.state.token) {
      next({ path: '/not-found' })
    } else {
      next()
    }
  })
}

export default addNavigationGuards

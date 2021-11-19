const addNavigationGuards = (router, store) => {
  // store token on authenticate
  router.beforeEach((to, from, next) => {
    console.log('token', to.path, from.path, to.query)
    // handle authentication
    if (to.path === '/authenticate' && to.query.token) {
      console.log('token', to.query.token, to)
      store.commit('token',to.query.token)
      // to.query = {}
      next({path: '/'})
    } else {
      next()
    }
  })

  // protect all routes but not-found  
  router.beforeEach((to, from, next) => {
    console.log('protect', to.path, from.path)
    // handle authentication
    if (!store.state.token && to.path !== '/not-found') {
      next({ path: '/not-found' })
    } else {
      next()
    }
  })
}

export default addNavigationGuards

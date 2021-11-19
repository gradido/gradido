const addNavigationGuards = (router, store) => {
  // store token on authenticate
  router.beforeEach((to, from, next) => {
    if (to.path === '/authenticate' && to.query.token) {
      store.commit('token',to.query.token)
      next({path: '/'})
    } else {
      next()
    }
  })

  // protect all routes but not-found  
  router.beforeEach((to, from, next) => {
    console.log('protect', to.path, from.path)
    // handle authentication
    if (!store.state.token && to.path !== '/not-found' && to.path !== '/logout') {
      next({ path: '/not-found' })
    } else {
      next()
    }
  })
}

export default addNavigationGuards

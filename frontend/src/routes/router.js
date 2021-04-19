import Vue from 'vue'
import VueRouter from 'vue-router'
import routes from './routes'
import { store } from '../store/store'

Vue.use(VueRouter)

// configure router
const router = new VueRouter({
  routes, // short for routes: routes
  linkActiveClass: 'active',
  mode: 'history',
  scrollBehavior: (to, from, savedPosition) => {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return { selector: to.hash }
    }
    return { x: 0, y: 0 }
  },
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !store.state.session_id) {
    next({ path: '/login' })
  } else {
    next()
  }
})

export default router

import Vue from 'vue'
import VueRouter from 'vue-router'
import routes from './routes'
import CONFIG from '../config'

Vue.use(VueRouter)

// configure router
const router = new VueRouter({
  base: '/vue',
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

if (CONFIG.VUE_APP_ALLOW_REGISTER) {
  router.addRoute({
    path: '/register',
    component: () => import('../views/Pages/Register.vue'),
  })
}

export default router

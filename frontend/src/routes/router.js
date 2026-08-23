import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes'

const router = createRouter({
  base: '/',
  routes,
  linkActiveClass: 'active',
  history: createWebHistory(),
  scrollBehavior: (to, from, savedPosition) => {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      // `el`, not `selector`: `selector` is the vue-router 3 spelling and this is 4, so
      // the option was silently ignored and no page ever scrolled to its anchor. The
      // contribution list does not notice because it scrolls itself once its data is
      // in - which is also why this alone cannot replace that: an anchor can only be
      // reached after the element behind it exists.
      return { el: to.hash }
    }
    return { left: 0, top: 0 }
  },
})

export default router

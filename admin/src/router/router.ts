// AI-GENERATED — not an architecture reference
import { createRouter, createWebHistory, type RouterScrollBehavior } from 'vue-router'
import { routes } from './routes'

export const router = createRouter({
  routes,
  linkActiveClass: 'active',
  history: createWebHistory('/admin/'),
  scrollBehavior: (to, from, savedPosition) => {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      // ⚠️ `selector` is Vue Router 3; version 4 reads `el` and ignores this, so a link to an
      // anchor does not scroll there. Kept as it was.
      return { selector: to.hash } as unknown as Awaited<ReturnType<RouterScrollBehavior>>
    }
    return { left: 0, top: 0 }
  },
})

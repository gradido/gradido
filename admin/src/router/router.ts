// AI-GENERATED — not an architecture reference
import { createRouter, createWebHistory, type RouterScrollBehavior } from 'vue-router'
import { ROUTER_BASE } from '@/constants'
import { routes } from './routes'

export const router = createRouter({
  routes,
  linkActiveClass: 'active',
  history: createWebHistory(ROUTER_BASE),
  scrollBehavior: (to, from, savedPosition) => {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      // ⚠️ `selector` is Vue Router 3; version 4 reads `el` and ignores this, so a link to an
      // anchor does not scroll there. Kept as it was.
      return { selector: to.hash } as unknown as Awaited<ReturnType<RouterScrollBehavior>>
    }
    // The same page with another query stays where it stands: a page that takes the view of the
    // way back out of its address (utils/wayBackView.ts) rolls to its row itself.
    if (from.matched?.length && to.path === from.path) {
      return false
    }
    // At once, not with Bootstrap's smooth scrolling (`scroll-behavior: smooth` on the root): in
    // the app on an iPhone the glide to the top came after the page had rolled to the row of the
    // way back, and took the moderator to the top again (Bernd, 25.10.2026: "kurz der richtige
    // Bildschirm", then the top of the page).
    return { left: 0, top: 0, behavior: 'instant' }
  },
})

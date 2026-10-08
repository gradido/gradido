// AI-GENERATED — not an architecture reference
import { describe, it, expect, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'
import { backOrOverview } from './backOrOverview'

const page = { template: '<div />' }

/**
 * A real router: the rule reads the MATCHED RECORD of the entry behind the page, and a
 * hand-made `resolve` would only return what the test put into it.
 */
const routerAt = async (...paths) => {
  const router = createRouter({
    // Web history, not memory history: only it keeps `state.back`, which is what the rule reads.
    history: createWebHistory(),
    routes: [
      { path: '/login/:code?', name: 'Login', component: page },
      { path: '/register', component: page },
      { path: '/overview', component: page, meta: { requiresAuth: true } },
      { path: '/send', component: page, meta: { requiresAuth: true } },
      { path: '/my-thank-you-card', component: page, meta: { requiresAuth: true } },
    ],
  })
  for (const path of paths) await router.push(path)
  await router.isReady()
  vi.spyOn(router, 'back')
  vi.spyOn(router, 'push')
  return router
}

describe('backOrOverview', () => {
  it('steps back to the wallet page the member came from', async () => {
    const router = await routerAt('/send', '/my-thank-you-card')

    backOrOverview(router)

    expect(router.back).toHaveBeenCalled()
    expect(router.push).not.toHaveBeenCalledWith('/overview')
  })

  it('lands on the overview when the page was opened directly', async () => {
    const router = await routerAt('/my-thank-you-card')
    // jsdom has ONE history for the whole file, so "nothing behind this page" cannot be
    // produced by navigating; this is what vue-router reports on a fresh start.
    vi.spyOn(router.options.history, 'state', 'get').mockReturnValue({ back: null })

    backOrOverview(router)

    expect(router.back).not.toHaveBeenCalled()
    expect(router.push).toHaveBeenCalledWith('/overview')
  })

  /**
   * ⛔ The loop of 08.10.2026: session run out, sign-in form, sign in, the form sends the
   * member on to the page they wanted. The entry behind the page is the form.
   */
  it.each(['/login', '/login?x=1', '/login/abc', '/register'])(
    'does not step back to %s, a page that needs no sign-in',
    async (publicPage) => {
      const router = await routerAt(publicPage, '/my-thank-you-card')

      backOrOverview(router)

      expect(router.back).not.toHaveBeenCalled()
      expect(router.push).toHaveBeenCalledWith('/overview')
    },
  )

  it('treats an entry that resolves to nothing like no history', async () => {
    const router = await routerAt('/send', '/my-thank-you-card')
    vi.spyOn(router, 'resolve').mockImplementation(() => {
      throw new Error('no match')
    })

    backOrOverview(router)

    expect(router.back).not.toHaveBeenCalled()
    expect(router.push).toHaveBeenCalledWith('/overview')
  })
})

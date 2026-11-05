// AI-GENERATED — not an architecture reference
import { describe, it, expect, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'
import { backOrOverview, backOrOverviewUnless, staysInWallet } from './backOrOverview'

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
      // The send route as the wallet has it: one record for the form with and without a recipient.
      {
        path: '/send/:communityIdentifier?/:userIdentifier?',
        name: 'Send',
        component: page,
        meta: { requiresAuth: true },
      },
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

  it('answers for a page with another landing: wallet page yes, sign-in form and nothing no', async () => {
    const router = await routerAt('/send')

    expect(staysInWallet(router, '/send')).toBe(true)
    expect(staysInWallet(router, '/login')).toBe(false)
    expect(staysInWallet(router, null)).toBe(false)
    expect(staysInWallet(router, undefined)).toBe(false)
  })
})

/**
 * The send form's "Zurück" (E-043): out of the form, never through it. A tap in the column of
 * contacts or the strip of favourites patches the form to another recipient, and the entry behind
 * it is the form for the one before.
 */
describe('backOrOverviewUnless', () => {
  it.each(['/send/home-uuid/sarah-id', '/send/home-uuid/sarah-id?art=send', '/send'])(
    'does not step back to %s, the page itself',
    async (form) => {
      const router = await routerAt(form, '/send/home-uuid/carla-id')

      backOrOverviewUnless(router, 'Send')

      expect(router.back).not.toHaveBeenCalled()
      expect(router.push).toHaveBeenCalledWith('/overview')
    },
  )

  // The same history, asked by a page that has no such exception: there it is a step back.
  it('leaves the rule of backOrOverview as it was for every other page', async () => {
    const router = await routerAt('/send/home-uuid/sarah-id', '/my-thank-you-card')

    backOrOverview(router)

    expect(router.back).toHaveBeenCalled()
    expect(router.push).not.toHaveBeenCalledWith('/overview')
  })

  it('steps back to the wallet page the member came from', async () => {
    const router = await routerAt('/overview', '/send/home-uuid/carla-id')

    backOrOverviewUnless(router, 'Send')

    expect(router.back).toHaveBeenCalled()
    expect(router.push).not.toHaveBeenCalledWith('/overview')
  })

  it('lands on the overview when the page was opened directly', async () => {
    const router = await routerAt('/send/home-uuid/carla-id')
    // jsdom has ONE history for the whole file (see above).
    vi.spyOn(router.options.history, 'state', 'get').mockReturnValue({ back: null })

    backOrOverviewUnless(router, 'Send')

    expect(router.back).not.toHaveBeenCalled()
    expect(router.push).toHaveBeenCalledWith('/overview')
  })

  // ⛔ The loop of 08.10.2026 stays shut on this way too.
  it.each(['/login', '/register'])(
    'does not step back to %s, a page that needs no sign-in',
    async (publicPage) => {
      const router = await routerAt(publicPage, '/send/home-uuid/carla-id')

      backOrOverviewUnless(router, 'Send')

      expect(router.back).not.toHaveBeenCalled()
      expect(router.push).toHaveBeenCalledWith('/overview')
    },
  )
})

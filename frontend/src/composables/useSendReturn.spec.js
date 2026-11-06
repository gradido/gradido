// AI-GENERATED — not an architecture reference
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { clearSendReturn, SEND_RETURN_HOLDS_MS, useSendReturn } from './useSendReturn'
import { useWalletStore } from '@/store/useWalletStore'
import { walletStore } from '@test/walletStore'

const page = { template: '<div />' }

/**
 * A real router: the handover is bound to a path as the router resolves it, and a hand-made
 * `resolve` would only return what the test put into it. The send route as the wallet has it.
 */
const makeRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/send/:communityIdentifier?/:userIdentifier?', name: 'Send', component: page },
      { path: '/contacts', component: page },
      { path: '/overview', component: page },
    ],
  })

/**
 * The way back from a window into the page of the send form. Used as the wallet uses it: inside a
 * component, with the store of whoever is signed in and the router.
 */
const withStore = (pinia, router = makeRouter()) => {
  let handover
  mount(
    {
      setup() {
        handover = useSendReturn()
        return () => null
      },
    },
    { global: { plugins: [pinia, router] } },
  )
  return handover
}
const as = (gradidoID) => withStore(walletStore({ gradidoID }))

// The conversation with Sarah, and the form with her named.
const TO_SARAH = '/send/home-uuid/sarah-id'
const BACK_TO_SARAH = { path: '/contacts', query: { with: 'sarah-id', community: 'home-uuid' } }
const TO_CARLA = '/send/home-uuid/carla-id'
const BACK_TO_GROUP = { path: '/contacts', query: { group: 'group-uuid' } }

describe('useSendReturn', () => {
  beforeEach(() => {
    // What is held lives at module level, so one test must not hand anything to the next.
    clearSendReturn()
  })

  it('holds nothing until something is handed over', () => {
    expect(as('emma').take(TO_SARAH)).toBeNull()
  })

  it('carries the way back over to the page of the send form, on the path it was handed for', () => {
    as('emma').put({ to: TO_SARAH, back: BACK_TO_SARAH })

    expect(as('emma').take(TO_SARAH)).toEqual(BACK_TO_SARAH)
  })

  it('is the same handover for both sides, not one each', () => {
    // The window puts and the page takes -- two callers, one handover.
    const window = as('emma')
    const form = as('emma')
    window.put({ to: TO_SARAH, back: BACK_TO_SARAH })

    expect(form.take(TO_SARAH)).toEqual(BACK_TO_SARAH)
  })

  // ⛔ Otherwise a later visit of the form, by the menu, would lead back to the conversation.
  it('is one-shot', () => {
    const handover = as('emma')
    handover.put({ to: TO_SARAH, back: BACK_TO_SARAH })

    expect(handover.take(TO_SARAH)).toEqual(BACK_TO_SARAH)
    expect(handover.take(TO_SARAH)).toBeNull()
  })

  it('keeps only the newest where one is handed over after another', () => {
    const handover = as('emma')
    handover.put({ to: TO_SARAH, back: BACK_TO_SARAH })
    handover.put({ to: TO_CARLA, back: BACK_TO_GROUP })

    expect(handover.take(TO_CARLA)).toEqual(BACK_TO_GROUP)
  })

  describe('for which page it is', () => {
    // The window pushes the form with the mode it is opened in; the page is asked by its path.
    it('takes no account of the query the form is opened with', async () => {
      const router = makeRouter()
      const handover = withStore(walletStore({ gradidoID: 'emma' }), router)
      handover.put({ to: TO_SARAH, back: BACK_TO_SARAH })
      await router.push({ path: TO_SARAH, query: { art: 'send' } })

      expect(handover.take(router.currentRoute.value.path)).toEqual(BACK_TO_SARAH)
    })

    // Bound to the path as the router resolves it, whichever way the handover names it.
    it('binds to the path alone, also where the handover names it with a query', () => {
      const handover = as('emma')
      handover.put({ to: `${TO_SARAH}?art=send`, back: BACK_TO_SARAH })

      expect(handover.take(TO_SARAH)).toEqual(BACK_TO_SARAH)
    })

    /**
     * ⛔ A way back handed over for another recipient is a stale one: a tap whose navigation never
     * arrived, then the form opened for somebody else. That one came from nowhere this names.
     */
    it('is not handed to the form for another recipient, and is gone', () => {
      const handover = as('emma')
      handover.put({ to: TO_SARAH, back: BACK_TO_SARAH })

      expect(handover.take(TO_CARLA)).toBeNull()
      // Not kept for the form it was meant for either: the member is somewhere else by now.
      expect(handover.take(TO_SARAH)).toBeNull()
    })

    it('is not handed to the form with nobody named', () => {
      const handover = as('emma')
      handover.put({ to: TO_SARAH, back: BACK_TO_SARAH })

      expect(handover.take('/send')).toBeNull()
    })

    it.each([[undefined], [null], ['']])('is handed to no page that has no path (%s)', (path) => {
      const handover = as('emma')
      handover.put({ to: TO_SARAH, back: BACK_TO_SARAH })

      expect(handover.take(path)).toBeNull()
      expect(handover.take(TO_SARAH)).toBeNull()
    })
  })

  describe('whose it is', () => {
    it('is not handed to another member, and is gone', () => {
      as('emma').put({ to: TO_SARAH, back: BACK_TO_SARAH })

      expect(as('dave').take(TO_SARAH)).toBeNull()
      // Not kept for whoever comes next either.
      expect(as('emma').take(TO_SARAH)).toBeNull()
    })

    // A tap in the moment after a sign-out, while the sign-in page is loaded, hands over
    // something that is nobody's.
    it.each([[null], [undefined], ['']])(
      'hands nothing on that was handed over while nobody was signed in (%s)',
      (nobody) => {
        as(nobody).put({ to: TO_SARAH, back: BACK_TO_SARAH })
        expect(as('dave').take(TO_SARAH)).toBeNull()

        as(nobody).put({ to: TO_SARAH, back: BACK_TO_SARAH })
        expect(as(nobody).take(TO_SARAH)).toBeNull()
      },
    )

    // The member is read when it is taken, not when the component was set up.
    it('asks who is signed in at the moment of taking', () => {
      const pinia = walletStore({ gradidoID: 'emma' })
      const handover = withStore(pinia)
      handover.put({ to: TO_SARAH, back: BACK_TO_SARAH })

      useWalletStore(pinia).gradidoID = 'dave'

      expect(handover.take(TO_SARAH)).toBeNull()
    })
  })

  /**
   * ⛔ For ten minutes, and not one moment longer: a way back left lying -- the form was opened
   * some other way -- must not lead a later visit somewhere it did not come from.
   */
  describe('how long it waits', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date('2026-11-05T08:00:00.000Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('is handed over up to ten minutes after it was put', () => {
      as('emma').put({ to: TO_SARAH, back: BACK_TO_SARAH })

      vi.setSystemTime(Date.now() + SEND_RETURN_HOLDS_MS)

      expect(as('emma').take(TO_SARAH)).toEqual(BACK_TO_SARAH)
    })

    it('is let go after that, and gone', () => {
      as('emma').put({ to: TO_SARAH, back: BACK_TO_SARAH })

      vi.setSystemTime(Date.now() + SEND_RETURN_HOLDS_MS + 1)

      expect(as('emma').take(TO_SARAH)).toBeNull()
      vi.setSystemTime(Date.now() - SEND_RETURN_HOLDS_MS)
      expect(as('emma').take(TO_SARAH)).toBeNull()
    })

    it('waits ten minutes', () => {
      expect(SEND_RETURN_HOLDS_MS).toBe(10 * 60 * 1000)
    })
  })

  // Signing out does not reload the page, so this module lives on (the store calls this;
  // store.test.js holds that it does).
  it('is emptied when a session ends', () => {
    as('emma').put({ to: TO_SARAH, back: BACK_TO_SARAH })

    clearSendReturn()

    expect(as('emma').take(TO_SARAH)).toBeNull()
  })

  /**
   * The window takes back what it handed over where the send form was never reached -- the same
   * person tapped twice, and the router refused the second navigation as a duplicate.
   */
  describe('taking back', () => {
    it('takes back what was handed over', () => {
      const handover = as('emma')
      const handed = handover.put({ to: TO_SARAH, back: BACK_TO_SARAH })

      handover.drop(handed)

      expect(handover.take(TO_SARAH)).toBeNull()
    })

    // A second tap handed over something newer while the first way was still being opened.
    it('takes back only its own', () => {
      const handover = as('emma')
      const first = handover.put({ to: TO_SARAH, back: BACK_TO_SARAH })
      handover.put({ to: TO_CARLA, back: BACK_TO_GROUP })

      handover.drop(first)

      expect(handover.take(TO_CARLA)).toEqual(BACK_TO_GROUP)
    })
  })
})

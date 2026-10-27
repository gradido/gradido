// AI-GENERATED — not an architecture reference
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { clearPassOnDraft, PASS_ON_DRAFT_HOLDS_MS, usePassOnDraft } from './usePassOnDraft'
import { useWalletStore } from '@/store/useWalletStore'
import { walletStore } from '@test/walletStore'

/**
 * The handover from "Jemandem danken" to the page of the send form: which thank-you received the
 * transfer about to be made passes on. Used as the wallet uses it: inside a component, with the
 * store of whoever is signed in.
 */
const withStore = (pinia) => {
  let draft
  mount(
    {
      setup() {
        draft = usePassOnDraft()
        return () => null
      },
    },
    { global: { plugins: [pinia] } },
  )
  return draft
}
const as = (gradidoID) => withStore(walletStore({ gradidoID }))

// Emma's own RECEIVE bookings of two thank-yous.
const RECEIVED = 1002
const ANOTHER = 1003

describe('usePassOnDraft', () => {
  beforeEach(() => {
    // What is held lives at module level, so one test must not hand anything to the next.
    clearPassOnDraft()
  })

  it('holds nothing until something is handed over', () => {
    expect(as('emma').take()).toBeNull()
  })

  it('carries the thank-you over to the page of the send form', () => {
    as('emma').put(RECEIVED)

    expect(as('emma').take()).toBe(RECEIVED)
  })

  it('is the same handover for both sides, not one each', () => {
    // The row puts and the page takes -- two callers, one handover.
    const row = as('emma')
    const page = as('emma')
    row.put(RECEIVED)

    expect(page.take()).toBe(RECEIVED)
  })

  // ⛔ Otherwise every later transfer of the visit would pass the thank-you on again.
  it('is one-shot', () => {
    const draft = as('emma')
    draft.put(RECEIVED)

    expect(draft.take()).toBe(RECEIVED)
    expect(draft.take()).toBeNull()
  })

  it('keeps only the newest where one is handed over after another', () => {
    const draft = as('emma')
    draft.put(RECEIVED)
    draft.put(ANOTHER)

    expect(draft.take()).toBe(ANOTHER)
  })

  describe('whose it is', () => {
    it('is not handed to another member, and is gone', () => {
      as('emma').put(RECEIVED)

      expect(as('dave').take()).toBeNull()
      // Not kept for whoever comes next either.
      expect(as('emma').take()).toBeNull()
    })

    // A tap in the moment after a sign-out, while the sign-in page is loaded, hands over
    // something that is nobody's.
    it.each([[null], [undefined], ['']])(
      'hands nothing on that was handed over while nobody was signed in (%s)',
      (nobody) => {
        as(nobody).put(RECEIVED)
        expect(as('dave').take()).toBeNull()

        as(nobody).put(RECEIVED)
        expect(as(nobody).take()).toBeNull()
      },
    )

    // The member is read when it is taken, not when the component was set up.
    it('asks who is signed in at the moment of taking', () => {
      const pinia = walletStore({ gradidoID: 'emma' })
      const draft = withStore(pinia)
      draft.put(RECEIVED)

      useWalletStore(pinia).gradidoID = 'dave'

      expect(draft.take()).toBeNull()
    })
  })

  /**
   * ⛔ For ten minutes, and not one moment longer: a handover left lying -- the form was opened
   * some other way -- must not turn a later, different transfer into one that passes this
   * thank-you on.
   */
  describe('how long it waits', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date('2026-10-27T08:00:00.000Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('is handed over up to ten minutes after it was put', () => {
      as('emma').put(RECEIVED)

      vi.setSystemTime(Date.now() + PASS_ON_DRAFT_HOLDS_MS)

      expect(as('emma').take()).toBe(RECEIVED)
    })

    it('is let go after that, and gone', () => {
      as('emma').put(RECEIVED)

      vi.setSystemTime(Date.now() + PASS_ON_DRAFT_HOLDS_MS + 1)

      expect(as('emma').take()).toBeNull()
      vi.setSystemTime(Date.now() - PASS_ON_DRAFT_HOLDS_MS)
      expect(as('emma').take()).toBeNull()
    })

    it('waits ten minutes', () => {
      expect(PASS_ON_DRAFT_HOLDS_MS).toBe(10 * 60 * 1000)
    })
  })

  // Signing out does not reload the page, so this module lives on (store.js calls this;
  // store.test.js holds that it does).
  it('is emptied when a session ends', () => {
    as('emma').put(RECEIVED)

    clearPassOnDraft()

    expect(as('emma').take()).toBeNull()
  })

  /**
   * The line takes back what it handed over where the send form was never reached -- the member
   * tapped on while the page was loading.
   */
  describe('taking back', () => {
    it('takes back what was handed over', () => {
      const draft = as('emma')
      const handed = draft.put(RECEIVED)

      draft.drop(handed)

      expect(draft.take()).toBeNull()
    })

    // A second tap handed over something newer while the first way was still being opened.
    it('takes back only its own', () => {
      const draft = as('emma')
      const first = draft.put(RECEIVED)
      draft.put(ANOTHER)

      draft.drop(first)

      expect(draft.take()).toBe(ANOTHER)
    })
  })
})

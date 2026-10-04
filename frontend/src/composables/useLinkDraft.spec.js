// AI-GENERATED — not an architecture reference
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { clearLinkDraft, useLinkDraft } from './useLinkDraft'

/**
 * The handover from a link in the member's own list to the way a link is made ("Duplizieren").
 * Used as the wallet uses it: inside a component, with the store of whoever is signed in.
 */
const withStore = (store) => {
  let draft
  mount(
    {
      setup() {
        draft = useLinkDraft()
        return () => null
      },
    },
    { global: { provide: { store } } },
  )
  return draft
}
const as = (gradidoID) => withStore({ state: { gradidoID } })

const PLAIN = { id: 7, amount: 12.5, memo: 'Danke fürs Mähen!', greeting: null }
const GREETING = {
  id: 8,
  amount: 20,
  memo: 'Einfach so — weil es Dich gibt.\nLiebe Sarah, bis bald.',
  greeting: {
    motif: 'bouquet',
    line: 'Einfach so — weil es Dich gibt.',
    recipientName: 'Sarah',
    hasPicture: false,
  },
}

describe('useLinkDraft', () => {
  beforeEach(() => {
    // What is held lives at module level, so one test must not hand anything to the next.
    clearLinkDraft()
  })

  it('holds nothing until something is handed over', () => {
    expect(as('emma').takeLink()).toBeNull()
    expect(as('emma').takeGreeting()).toBeNull()
  })

  it('carries a plain link over to the send form', () => {
    as('emma').put(PLAIN)

    expect(as('emma').takeLink()).toEqual(PLAIN)
  })

  it('carries a thank-you greeting over to its page', () => {
    as('emma').put(GREETING)

    expect(as('emma').takeGreeting()).toEqual(GREETING)
  })

  it('is the same handover for both sides, not one each', () => {
    // The row puts and the page takes -- two callers, one handover. If each call built its
    // own, nothing would ever arrive.
    const row = as('emma')
    const page = as('emma')
    row.put(PLAIN)

    expect(page.takeLink()?.memo).toBe('Danke fürs Mähen!')
  })

  it('is one-shot: what was handed over stands in the fields of one visit only', () => {
    // Otherwise the send form would open with an old link's amount every time it is opened.
    const draft = as('emma')
    draft.put(PLAIN)

    expect(draft.takeLink()).not.toBeNull()
    expect(draft.takeLink()).toBeNull()
  })

  it('keeps only the newest where one is handed over after another', () => {
    const draft = as('emma')
    draft.put(PLAIN)
    draft.put({ ...PLAIN, id: 9, memo: 'Für den Kuchen' })

    expect(draft.takeLink()).toEqual({ ...PLAIN, id: 9, memo: 'Für den Kuchen' })
  })

  /**
   * ⛔ Each way takes its own kind only. A greeting's memo is its first line, a line break and
   * the words: in the send form's memo field it would be a text nobody wrote that way. And what
   * the other way finds is left over from a visit that went elsewhere -- it is let go, so that it
   * cannot turn up later.
   */
  describe('the two ways', () => {
    it('does not hand a greeting to the send form, and lets it go', () => {
      as('emma').put(GREETING)

      expect(as('emma').takeLink()).toBeNull()
      expect(as('emma').takeGreeting()).toBeNull()
    })

    it('does not hand a plain link to the page of the greeting, and lets it go', () => {
      as('emma').put(PLAIN)

      expect(as('emma').takeGreeting()).toBeNull()
      expect(as('emma').takeLink()).toBeNull()
    })
  })

  /**
   * ⛔ What is handed over carries an amount, a memo and the name of a third person, and it
   * belongs to the member who handed it over.
   */
  describe('whose it is', () => {
    it('is not handed to another member, and is gone', () => {
      as('emma').put(GREETING)

      expect(as('dave').takeGreeting()).toBeNull()
      // Not kept for whoever comes next either.
      expect(as('emma').takeGreeting()).toBeNull()
    })

    it('is not handed to somebody signed out', () => {
      as('emma').put(PLAIN)

      expect(as(null).takeLink()).toBeNull()
    })

    // The list stays on screen for a moment after a sign-out, while the sign-in page is loaded:
    // a tap in that moment hands over something that is nobody's.
    it.each([[null], [undefined], ['']])(
      'hands nothing on that was handed over while nobody was signed in (%s)',
      (nobody) => {
        as(nobody).put(GREETING)

        expect(as('dave').takeGreeting()).toBeNull()
        as(nobody).put(GREETING)
        expect(as(nobody).takeGreeting()).toBeNull()
      },
    )

    // The member is read when something is handed over and when it is taken, not when the
    // component was set up: a session can end and another begin under a component that stays.
    it('asks who is signed in at the moment of taking', () => {
      const store = { state: { gradidoID: 'emma' } }
      const draft = withStore(store)
      draft.put(PLAIN)

      store.state.gradidoID = 'dave'

      expect(draft.takeLink()).toBeNull()
    })
  })

  // Signing out clears the store and its stored copy but does not reload the page, so this
  // module lives on (store.js calls this; store.test.js holds that it does).
  it('is emptied when a session ends', () => {
    as('emma').put(GREETING)

    clearLinkDraft()

    expect(as('emma').takeGreeting()).toBeNull()
  })

  /**
   * The row takes back what it handed over where the way it opened was never reached -- the
   * member tapped on while the page was loading.
   */
  describe('taking back', () => {
    it('takes back what was handed over', () => {
      const draft = as('emma')
      const handed = draft.put(PLAIN)

      draft.drop(handed)

      expect(draft.takeLink()).toBeNull()
    })

    // A second tap handed over something newer while the first way was still being opened:
    // the first one failing must not take the second one's away.
    it('takes back only its own', () => {
      const draft = as('emma')
      const first = draft.put(PLAIN)
      draft.put({ ...PLAIN })

      draft.drop(first)

      expect(draft.takeLink()).toEqual(PLAIN)
    })

    it('takes back nothing where the way has taken it already', () => {
      const draft = as('emma')
      const handed = draft.put(PLAIN)
      expect(draft.takeLink()).toEqual(PLAIN)
      draft.put(GREETING)

      draft.drop(handed)

      expect(draft.takeGreeting()).toEqual(GREETING)
    })
  })
})

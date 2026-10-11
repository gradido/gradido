// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CHAT_DRAFT_MAX_AGE_MS,
  CHAT_DRAFT_PICTURES_KEPT,
  CHAT_DRAFTS_KEPT_ON_DEVICE,
  chatDraftFor,
  chatGroupDraftKey,
  forgetChatDrafts,
  letOldChatDraftsGo,
} from './chatDraft'
import { MESSAGE_MAX_CHARS } from '@/validationSchemas'

const LENA = 'home-uuid/lena-id'
const ANNA = 'home-uuid/anna-id'

describe('chatDraft', () => {
  /** Who is signed in, as the store would say it at the moment it is asked. */
  let signedIn = 'me-id'
  const draftOf = (thread = LENA) => chatDraftFor(() => signedIn, thread)
  /** A picture as the bar holds one: what was chosen, and what was done to it. */
  const picture = (name = 'photo') => ({ source: { image: { name } }, edit: { turns: 0 } })

  afterEach(() => {
    forgetChatDrafts()
    window.localStorage.clear()
    signedIn = 'me-id'
  })

  describe('one draft a conversation', () => {
    it('hands what one bar kept to the next bar of that conversation', () => {
      draftOf().keep({ text: 'Bis Samstag' })

      expect(draftOf().read()).toEqual({ text: 'Bis Samstag', picture: null, alsoByEmail: null })
    })

    it('holds nothing before anything was kept', () => {
      expect(draftOf().read()).toBeNull()
    })

    it('keeps the draft of one conversation apart from another', () => {
      draftOf(LENA).keep({ text: 'für Lena' })
      draftOf(ANNA).keep({ text: 'für Anna' })

      expect(draftOf(LENA).read().text).toBe('für Lena')
      expect(draftOf(ANNA).read().text).toBe('für Anna')
    })

    it('puts what stands in the bar now in place of what waited', () => {
      const shot = picture()
      draftOf().keep({ text: 'erst', picture: shot, alsoByEmail: true })
      draftOf().keep({ text: 'dann' })

      expect(draftOf().read()).toEqual({ text: 'dann', picture: null, alsoByEmail: null })
    })

    // Read again and again: it waits until it is sent or emptied, not until it was looked at.
    it('still holds the draft after it was read', () => {
      draftOf().keep({ text: 'Bis Samstag' })
      draftOf().read()

      expect(draftOf().read().text).toBe('Bis Samstag')
    })

    it('keeps nothing without a conversation to keep it for', () => {
      draftOf('').keep({ text: 'Bis Samstag' })

      expect(draftOf('').read()).toBeNull()
    })
  })

  describe('what a draft is', () => {
    it('keeps the words as they were typed, the space around them too', () => {
      draftOf().keep({ text: '  Bis Samstag\n' })

      expect(draftOf().read().text).toBe('  Bis Samstag\n')
    })

    it('holds a picture with what was done to it, the very one the bar held', () => {
      const shot = picture()
      draftOf().keep({ text: '', picture: shot })

      expect(draftOf().read()).toEqual({ text: '', picture: shot, alsoByEmail: null })
      expect(draftOf().read().picture).toBe(shot)
    })

    it.each([
      ['ticked', true],
      ['emptied', false],
    ])('holds the box where the member set it themselves: %s', (_, box) => {
      draftOf().keep({ text: 'Bis Samstag', alsoByEmail: box })

      expect(draftOf().read().alsoByEmail).toBe(box)
    })

    it.each([[null], [undefined], ['yes']])('holds no box where the bar names none: %s', (box) => {
      draftOf().keep({ text: 'Bis Samstag', alsoByEmail: box })

      expect(draftOf().read().alsoByEmail).toBeNull()
    })

    it.each([
      ['an empty field', ''],
      ['a field of spaces', '  \n '],
      ['no words at all', undefined],
    ])('is gone with %s and no picture', (_, text) => {
      draftOf().keep({ text: 'Bis Samstag' })
      draftOf().keep({ text })

      expect(draftOf().read()).toBeNull()
    })

    // A wish for a message that is not there is no draft.
    it('is not made by a ticked box alone', () => {
      draftOf().keep({ text: '', alsoByEmail: true })

      expect(draftOf().read()).toBeNull()
    })

    it('holds no more words than a message takes', () => {
      draftOf().keep({ text: 'a'.repeat(MESSAGE_MAX_CHARS + 50) })

      expect(draftOf().read().text).toHaveLength(MESSAGE_MAX_CHARS)
    })
  })

  /**
   * ⛔ One browser serves several members, and signing out does not reload the page: a draft is
   * the member's who wrote it.
   */
  describe('whose it is', () => {
    it('is not handed to another member signed in on this browser', () => {
      draftOf().keep({ text: 'Bis Samstag' })
      signedIn = 'somebody-else'

      expect(draftOf().read()).toBeNull()
    })

    it('waits for its member where another one was signed in meanwhile', () => {
      draftOf().keep({ text: 'Bis Samstag' })
      signedIn = 'somebody-else'
      draftOf().keep({ text: 'von jemand anderem' })
      signedIn = 'me-id'

      expect(draftOf().read().text).toBe('Bis Samstag')
    })

    it.each([[null], [undefined], ['']])(
      'keeps nothing while nobody is signed in: %s',
      (nobody) => {
        signedIn = nobody
        draftOf().keep({ text: 'Bis Samstag' })

        expect(draftOf().read()).toBeNull()
        signedIn = 'me-id'
        expect(draftOf().read()).toBeNull()
      },
    )

    /**
     * The idle timeout signs the member out while the window stands open: the bar is still there
     * for a moment, and what it says then is kept for nobody.
     */
    it('keeps nothing from a bar whose member was signed out meanwhile', () => {
      const bar = draftOf()
      signedIn = null
      bar.keep({ text: 'Bis Samstag' })

      signedIn = 'me-id'
      expect(draftOf().read()).toBeNull()
    })

    it('keeps nothing from a bar that outlived its member, under the next one', () => {
      const bar = draftOf()
      signedIn = 'somebody-else'
      bar.keep({ text: 'Bis Samstag' })

      expect(bar.read()).toBeNull()
      expect(draftOf().read()).toBeNull()
      signedIn = 'me-id'
      expect(draftOf().read()).toBeNull()
    })

    // Its member's draft is still there -- but a bar that outlived them is not the way to it.
    it('hands nothing out through a bar that outlived its member', () => {
      const bar = draftOf()
      bar.keep({ text: 'Bis Samstag' })
      signedIn = 'somebody-else'

      expect(bar.read()).toBeNull()
      signedIn = null
      expect(bar.read()).toBeNull()
      signedIn = 'me-id'
      expect(bar.read().text).toBe('Bis Samstag')
    })

    it('knows its member whatever the case their id is written in', () => {
      signedIn = 'Me-ID'
      draftOf().keep({ text: 'Bis Samstag' })
      signedIn = 'me-id'

      expect(draftOf().read().text).toBe('Bis Samstag')
    })

    it('is forgotten with every other one when the member signs out by their own word', () => {
      draftOf(LENA).keep({ text: 'für Lena', picture: picture() })
      draftOf(ANNA).keep({ text: 'für Anna' })

      forgetChatDrafts('me-id', { fromDevice: true })

      expect(draftOf(LENA).read()).toBeNull()
      expect(draftOf(ANNA).read()).toBeNull()
    })
  })

  /**
   * A picture waits whole, as it was chosen: only the three conversations written in last keep
   * one. The number is a decision (a phone has little room for a pile of photos), so the tests
   * name it.
   */
  describe('the pictures that wait', () => {
    const [FIRST, SECOND, THIRD, FOURTH] = ['a', 'b', 'c', 'd'].map((id) => `home-uuid/${id}`)

    it('keeps the pictures of three conversations', () => {
      expect(CHAT_DRAFT_PICTURES_KEPT).toBe(3)
      for (const thread of [FIRST, SECOND, THIRD]) {
        draftOf(thread).keep({ text: 'Schau mal', picture: picture() })
      }

      for (const thread of [FIRST, SECOND, THIRD]) {
        expect(draftOf(thread).read().picture).not.toBeNull()
      }
    })

    it('lets the picture written in longest ago go with a fourth, and keeps its words', () => {
      for (const thread of [FIRST, SECOND, THIRD, FOURTH]) {
        draftOf(thread).keep({ text: 'Schau mal', picture: picture() })
      }

      expect(draftOf(FIRST).read()).toEqual({ text: 'Schau mal', picture: null, alsoByEmail: null })
      for (const thread of [SECOND, THIRD, FOURTH]) {
        expect(draftOf(thread).read().picture).not.toBeNull()
      }
    })

    // What else of the draft waits in memory stays with it: the box the member set.
    it('lets the box of such a draft wait on with its words', () => {
      draftOf(FIRST).keep({ text: 'Schau mal', picture: picture(), alsoByEmail: true })
      for (const thread of [SECOND, THIRD, FOURTH]) {
        draftOf(thread).keep({ text: 'Schau mal', picture: picture() })
      }

      expect(draftOf(FIRST).read()).toEqual({ text: 'Schau mal', picture: null, alsoByEmail: true })
    })

    it('lets such a draft go altogether where the picture was all of it', () => {
      for (const thread of [FIRST, SECOND, THIRD, FOURTH]) {
        draftOf(thread).keep({ text: '', picture: picture() })
      }

      expect(draftOf(FIRST).read()).toBeNull()
      expect(draftOf(SECOND).read()).not.toBeNull()
    })

    it('counts a conversation written in again as written in last', () => {
      for (const thread of [FIRST, SECOND, THIRD]) {
        draftOf(thread).keep({ text: '', picture: picture() })
      }
      const first = draftOf(FIRST).read().picture
      draftOf(FIRST).keep({ text: 'noch ein Wort', picture: first })
      draftOf(FOURTH).keep({ text: '', picture: picture() })

      expect(draftOf(FIRST).read().picture).toBe(first)
      expect(draftOf(SECOND).read()).toBeNull()
    })

    // Words take no room: however many drafts of words came after, the three pictures wait.
    it('counts only the drafts that hold a picture', () => {
      for (const thread of [FIRST, SECOND, THIRD]) {
        draftOf(thread).keep({ text: '', picture: picture() })
      }
      for (const thread of [LENA, ANNA, FOURTH, 'home-uuid/e']) {
        draftOf(thread).keep({ text: 'nur Worte' })
      }

      for (const thread of [FIRST, SECOND, THIRD]) {
        expect(draftOf(thread).read().picture).not.toBeNull()
      }
      for (const thread of [LENA, ANNA, FOURTH, 'home-uuid/e']) {
        expect(draftOf(thread).read().text).toBe('nur Worte')
      }
    })
  })

  /**
   * The words lie on this device (Bernd's choice among three, 11.10.2026): they outlast a reload, a
   * closed tab and a session that ran out. The picture and the box never lie there.
   */
  describe('the words on this device', () => {
    const NOW = new Date('2026-10-11T16:00:00Z').getTime()
    const DAY = 24 * 60 * 60 * 1000
    const raw = (me = 'me-id') => window.localStorage.getItem(`chat-drafts:${me}`)
    const stored = (me = 'me-id') => JSON.parse(raw(me))
    /** The wallet starts anew, or its session ran out: nothing waits in memory any more. */
    const memoryGone = () => forgetChatDrafts(signedIn)

    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(NOW)
    })
    afterEach(() => {
      vi.useRealTimers()
      vi.restoreAllMocks()
    })

    it('lie under the key of the member signed in, by conversation, with the time they were written', () => {
      draftOf().keep({ text: 'Bis Samstag' })

      expect(stored()).toEqual({ [LENA]: { text: 'Bis Samstag', at: NOW } })
    })

    it('are all that lies there: no picture, no box', () => {
      draftOf().keep({ text: 'Bis Samstag', picture: picture(), alsoByEmail: true })

      expect(stored()).toEqual({ [LENA]: { text: 'Bis Samstag', at: NOW } })
      expect(window.localStorage).toHaveLength(1)
    })

    it('are no more there than a message takes', () => {
      draftOf().keep({ text: 'a'.repeat(MESSAGE_MAX_CHARS + 50) })

      expect(stored()[LENA].text).toHaveLength(MESSAGE_MAX_CHARS)
    })

    it('are not there for a picture alone', () => {
      draftOf().keep({ text: '', picture: picture() })

      expect(raw()).toBeNull()
    })

    it('are read from there once nothing waits in memory, without the picture and the box', () => {
      draftOf().keep({ text: 'Bis Samstag', picture: picture(), alsoByEmail: true })
      memoryGone()

      expect(draftOf().read()).toEqual({ text: 'Bis Samstag', picture: null, alsoByEmail: null })
    })

    it('go from there with the draft, and the key with the last of them', () => {
      draftOf(LENA).keep({ text: 'für Lena' })
      draftOf(ANNA).keep({ text: 'für Anna' })

      draftOf(LENA).keep({ text: '' })
      expect(stored()).toEqual({ [ANNA]: { text: 'für Anna', at: NOW } })

      draftOf(ANNA).keep()
      expect(raw()).toBeNull()
    })

    it('name the member in lower case, whatever the case their id is written in', () => {
      signedIn = 'Me-ID'
      draftOf().keep({ text: 'Bis Samstag' })

      expect(stored('me-id')[LENA].text).toBe('Bis Samstag')
    })

    it('lie apart for every member of this browser', () => {
      draftOf().keep({ text: 'von mir' })
      signedIn = 'somebody-else'
      draftOf().keep({ text: 'von jemand anderem' })

      expect(stored('me-id')[LENA].text).toBe('von mir')
      expect(stored('somebody-else')[LENA].text).toBe('von jemand anderem')
    })

    describe('and the sign-out', () => {
      it('take them off the device where the member signs out by their own word', () => {
        draftOf().keep({ text: 'Bis Samstag' })

        forgetChatDrafts('me-id', { fromDevice: true })

        expect(raw()).toBeNull()
        expect(draftOf().read()).toBeNull()
      })

      it.each([
        ['nothing said of it', undefined],
        ['nothing at all', null],
        ['not by their own word', { fromDevice: false }],
        ['a word that is no yes', { fromDevice: 'yes' }],
      ])('leaves them there where the session ran out: %s', (_, how) => {
        draftOf().keep({ text: 'Bis Samstag', picture: picture() })

        forgetChatDrafts('me-id', how)

        expect(stored()).toEqual({ [LENA]: { text: 'Bis Samstag', at: NOW } })
        expect(draftOf().read()).toEqual({ text: 'Bis Samstag', picture: null, alsoByEmail: null })
      })

      it('finds the member’s words whatever the case their id is written in', () => {
        draftOf().keep({ text: 'Bis Samstag' })

        forgetChatDrafts('ME-ID', { fromDevice: true })

        expect(raw()).toBeNull()
      })

      it('takes only the words of the member who signs out', () => {
        signedIn = 'somebody-else'
        draftOf().keep({ text: 'von jemand anderem' })
        signedIn = 'me-id'
        draftOf().keep({ text: 'von mir' })

        forgetChatDrafts('me-id', { fromDevice: true })

        expect(raw('me-id')).toBeNull()
        expect(stored('somebody-else')[LENA].text).toBe('von jemand anderem')
      })

      it.each([[null], [undefined], ['']])(
        'takes nothing off the device for nobody: %s',
        (nobody) => {
          draftOf().keep({ text: 'Bis Samstag' })

          forgetChatDrafts(nobody, { fromDevice: true })

          expect(stored()[LENA].text).toBe('Bis Samstag')
        },
      )
    })

    /** Words nobody touched for fourteen days are let go: a shared computer keeps them no longer. */
    describe('and their age', () => {
      it('are fourteen days', () => {
        expect(CHAT_DRAFT_MAX_AGE_MS).toBe(14 * DAY)
      })

      it('are read for fourteen days, and not a moment longer', () => {
        draftOf().keep({ text: 'Bis Samstag' })

        vi.setSystemTime(NOW + 14 * DAY)
        expect(draftOf().read().text).toBe('Bis Samstag')

        vi.setSystemTime(NOW + 14 * DAY + 1)
        expect(draftOf().read()).toBeNull()
      })

      it('count from the last change', () => {
        draftOf().keep({ text: 'Bis Samstag' })
        vi.setSystemTime(NOW + 10 * DAY)
        draftOf().keep({ text: 'Bis Samstag um zehn' })

        vi.setSystemTime(NOW + 20 * DAY)

        expect(draftOf().read().text).toBe('Bis Samstag um zehn')
      })

      // A bar that only shows them writes nothing: looking at a draft does not make it younger.
      it('do not count from the last reading', () => {
        draftOf().keep({ text: 'Bis Samstag' })
        vi.setSystemTime(NOW + 10 * DAY)
        draftOf().read()

        expect(stored()[LENA].at).toBe(NOW)
      })

      /**
       * A member who does not come back to a shared computer must not leave words there for
       * good: every sign-out on this device lets go of what is that old, whoever wrote it. And
       * every sign-in: a wallet closed with its tab runs no sign-out.
       */
      it.each([
        ['sign-out', () => forgetChatDrafts('me-id')],
        ['sign-in', () => letOldChatDraftsGo()],
      ])('take the old words of every member off the device with the next %s there', (_, go) => {
        window.localStorage.setItem(
          'chat-drafts:somebody-else',
          JSON.stringify({
            [LENA]: { text: 'alt', at: NOW - 14 * DAY - 1 },
            [ANNA]: { text: 'jung', at: NOW - DAY },
          }),
        )
        window.localStorage.setItem(
          'chat-drafts:long-gone',
          JSON.stringify({ [LENA]: { text: 'sehr alt', at: NOW - 100 * DAY } }),
        )

        go()

        expect(stored('somebody-else')).toEqual({ [ANNA]: { text: 'jung', at: NOW - DAY } })
        expect(raw('long-gone')).toBeNull()
      })

      // A sign-in lets old words go and nothing else: what waits in memory is the member's.
      it('leave what waits in memory alone with a sign-in', () => {
        const shot = picture()
        draftOf().keep({ text: 'Bis Samstag', picture: shot, alsoByEmail: true })

        letOldChatDraftsGo()

        expect(draftOf().read()).toEqual({ text: 'Bis Samstag', picture: shot, alsoByEmail: true })
      })

      /**
       * A device whose clock was ahead when the words were written, and was put right since: a
       * time still to come counts as now. Such words would never grow old otherwise, and would
       * stand before everything written since.
       */
      it('count from now where their time is still to come', () => {
        window.localStorage.setItem(
          'chat-drafts:me-id',
          JSON.stringify({ [LENA]: { text: 'aus der Zukunft', at: NOW + 400 * DAY } }),
        )

        expect(draftOf(LENA).read().text).toBe('aus der Zukunft')
        // The next words written put the time right on the device ...
        draftOf(ANNA).keep({ text: 'für Anna' })
        expect(stored()[LENA].at).toBe(NOW)
        // ... and from there they grow old as all words do.
        vi.setSystemTime(NOW + 14 * DAY + 1)
        expect(draftOf(LENA).read()).toBeNull()
      })

      it('do not push what is written now off the device where thirty times are still to come', () => {
        const ahead = {}
        for (let index = 0; index < 30; index++) {
          ahead[`home-uuid/member-${index}`] = { text: `an ${index}`, at: NOW + 400 * DAY + index }
        }
        window.localStorage.setItem('chat-drafts:me-id', JSON.stringify(ahead))

        draftOf(LENA).keep({ text: 'von heute' })

        expect(Object.keys(stored())).toHaveLength(30)
        expect(stored()[LENA]).toEqual({ text: 'von heute', at: NOW })
        expect(draftOf(LENA).read().text).toBe('von heute')
      })

      it('leave everything else on the device alone', () => {
        window.localStorage.setItem('gradido-frontend', '{"token":"t"}')
        window.localStorage.setItem('chat-return:me-id', '{"gradidoID":"anna-id"}')
        draftOf().keep({ text: 'Bis Samstag' })

        forgetChatDrafts('me-id', { fromDevice: true })

        expect(window.localStorage.getItem('gradido-frontend')).toBe('{"token":"t"}')
        expect(window.localStorage.getItem('chat-return:me-id')).toBe('{"gradidoID":"anna-id"}')
      })
    })

    it('are kept for thirty conversations, the ones written in last', () => {
      expect(CHAT_DRAFTS_KEPT_ON_DEVICE).toBe(30)
      for (let index = 0; index <= 30; index++) {
        vi.setSystemTime(NOW + index)
        draftOf(`home-uuid/member-${index}`).keep({ text: `an ${index}` })
      }

      expect(Object.keys(stored())).toHaveLength(30)
      expect(stored()['home-uuid/member-0']).toBeUndefined()
      expect(stored()['home-uuid/member-1'].text).toBe('an 1')
      expect(stored()['home-uuid/member-30'].text).toBe('an 30')
    })

    /** One member, two tabs: the device says what the words are, each tab holds its own picture. */
    describe('and another tab of the same member', () => {
      it('are gone here too once they were sent from there', () => {
        const shot = picture()
        draftOf().keep({ text: 'Bis Samstag', picture: shot, alsoByEmail: true })

        window.localStorage.removeItem('chat-drafts:me-id')

        expect(draftOf().read()).toEqual({ text: '', picture: shot, alsoByEmail: true })
      })

      it('leave no draft here where the words were all of it', () => {
        draftOf().keep({ text: 'Bis Samstag', alsoByEmail: true })

        window.localStorage.removeItem('chat-drafts:me-id')

        expect(draftOf().read()).toBeNull()
      })

      it('are the ones that were written on there', () => {
        draftOf().keep({ text: 'Bis Samstag' })

        window.localStorage.setItem(
          'chat-drafts:me-id',
          JSON.stringify({ [LENA]: { text: 'Bis Samstag um zehn', at: NOW + 5 } }),
        )

        expect(draftOf().read().text).toBe('Bis Samstag um zehn')
      })

      it('keep the words of the conversations the other tab wrote in', () => {
        window.localStorage.setItem(
          'chat-drafts:me-id',
          JSON.stringify({ [ANNA]: { text: 'aus dem anderen Tab', at: NOW - 5 } }),
        )

        draftOf(LENA).keep({ text: 'von hier' })

        expect(stored()).toEqual({
          [ANNA]: { text: 'aus dem anderen Tab', at: NOW - 5 },
          [LENA]: { text: 'von hier', at: NOW },
        })
      })
    })

    /** Storage switched off, or full: the words wait in memory, as far as memory goes. */
    describe('where the device refuses', () => {
      const refuse = () => {
        throw new Error('QuotaExceededError')
      }

      it('wait in memory where it takes nothing', () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(refuse)

        draftOf().keep({ text: 'Bis Samstag' })

        expect(draftOf().read()).toEqual({ text: 'Bis Samstag', picture: null, alsoByEmail: null })
      })

      it('wait in memory where it cannot be read either', () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(refuse)
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(refuse)
        vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(refuse)

        draftOf().keep({ text: 'Bis Samstag' })

        expect(draftOf().read().text).toBe('Bis Samstag')
      })

      it('are let go from memory all the same by a bar that was emptied', () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(refuse)
        draftOf().keep({ text: 'Bis Samstag' })

        draftOf().keep({ text: '' })

        expect(draftOf().read()).toBeNull()
      })

      /**
       * The device took the words earlier and refuses now: it still holds the older ones. In this
       * tab memory says what the words are -- the newer ones, and an emptied field as well.
       */
      it('are the ones in memory, not the older ones the device still holds', () => {
        draftOf().keep({ text: 'Bis Samstag' })
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(refuse)

        draftOf().keep({ text: 'Bis Samstag um zehn bei mir' })

        expect(stored()[LENA].text).toBe('Bis Samstag')
        expect(draftOf().read().text).toBe('Bis Samstag um zehn bei mir')
      })

      it('are gone in this tab where the field was emptied, though the device still holds them', () => {
        draftOf(LENA).keep({ text: 'Bis Samstag' })
        draftOf(ANNA).keep({ text: 'für Anna' })
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(refuse)

        draftOf(LENA).keep({ text: '' })

        expect(stored()[LENA].text).toBe('Bis Samstag')
        expect(draftOf(LENA).read()).toBeNull()
      })

      it('are the device’s to say again as soon as it takes them', () => {
        const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(refuse)
        draftOf().keep({ text: 'Bis Samstag' })
        setItem.mockRestore()

        draftOf().keep({ text: 'Bis Samstag um zehn' })
        window.localStorage.setItem(
          'chat-drafts:me-id',
          JSON.stringify({ [LENA]: { text: 'aus dem anderen Tab', at: NOW } }),
        )

        expect(draftOf().read().text).toBe('aus dem anderen Tab')
      })

      it('wait on in memory when their draft lets its picture go', () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(refuse)
        const threads = ['a', 'b', 'c', 'd'].map((id) => `home-uuid/${id}`)
        for (const thread of threads) {
          draftOf(thread).keep({ text: 'Schau mal', picture: picture() })
        }

        expect(draftOf(threads[0]).read()).toEqual({
          text: 'Schau mal',
          picture: null,
          alsoByEmail: null,
        })
      })

      // The store's sign-out goes on to its next lines whatever the storage says.
      it('does not stop a sign-out', () => {
        draftOf().keep({ text: 'Bis Samstag' })
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(refuse)
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(refuse)
        vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(refuse)
        vi.spyOn(Storage.prototype, 'key').mockImplementation(refuse)

        expect(() => forgetChatDrafts('me-id', { fromDevice: true })).not.toThrow()
        expect(() => forgetChatDrafts('me-id')).not.toThrow()
      })
    })

    /** What lies under the key is read with care: another version wrote it, or somebody's hand. */
    describe('and what lies there', () => {
      it.each([
        ['no JSON at all', 'Bis Samstag'],
        ['a list', '["Bis Samstag"]'],
        ['a word', '"Bis Samstag"'],
        ['nothing', 'null'],
      ])('is no draft where it is %s, and gives way to the next words kept', (_, junk) => {
        window.localStorage.setItem('chat-drafts:me-id', junk)

        expect(draftOf().read()).toBeNull()
        draftOf().keep({ text: 'Bis Samstag' })
        expect(stored()).toEqual({ [LENA]: { text: 'Bis Samstag', at: NOW } })
      })

      it.each([
        ['no words', { at: NOW }],
        ['words that are none', { text: '   ', at: NOW }],
        ['words that are no text', { text: 42, at: NOW }],
        ['no time', { text: 'Bis Samstag' }],
        ['a time that is none', { text: 'Bis Samstag', at: 'gestern' }],
        ['a time written as text', { text: 'Bis Samstag', at: String(NOW) }],
        ['nothing', null],
      ])('reads past an entry with %s', (_, entry) => {
        window.localStorage.setItem(
          'chat-drafts:me-id',
          JSON.stringify({ [LENA]: entry, [ANNA]: { text: 'für Anna', at: NOW } }),
        )

        expect(draftOf(LENA).read()).toBeNull()
        expect(draftOf(ANNA).read().text).toBe('für Anna')
        // And it is not carried along: the next words written leave it behind.
        draftOf(ANNA).keep({ text: 'für Anna, weiter' })
        expect(stored()).toEqual({ [ANNA]: { text: 'für Anna, weiter', at: NOW } })
      })

      it('reads no more words than a message takes', () => {
        window.localStorage.setItem(
          'chat-drafts:me-id',
          JSON.stringify({ [LENA]: { text: 'a'.repeat(MESSAGE_MAX_CHARS + 50), at: NOW } }),
        )

        expect(draftOf().read().text).toHaveLength(MESSAGE_MAX_CHARS)
      })
    })
  })

  describe('chatGroupDraftKey', () => {
    it('names a group by its uuid, in lower case, apart from every person', () => {
      expect(chatGroupDraftKey('CAFE-Uuid')).toBe('group/cafe-uuid')
    })

    it.each([[null], [undefined], ['']])('names nothing without a group: %s', (none) => {
      expect(chatGroupDraftKey(none)).toBe('')
    })
  })
})

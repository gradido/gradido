// AI-GENERATED — not an architecture reference
import { afterEach, describe, expect, it } from 'vitest'
import {
  CHAT_DRAFT_PICTURES_KEPT,
  chatDraftFor,
  chatGroupDraftKey,
  forgetChatDrafts,
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

    it('is forgotten with every other one when the member signs out', () => {
      draftOf(LENA).keep({ text: 'für Lena', picture: picture() })
      draftOf(ANNA).keep({ text: 'für Anna' })

      forgetChatDrafts()

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

  describe('chatGroupDraftKey', () => {
    it('names a group by its uuid, in lower case, apart from every person', () => {
      expect(chatGroupDraftKey('CAFE-Uuid')).toBe('group/cafe-uuid')
    })

    it.each([[null], [undefined], ['']])('names nothing without a group: %s', (none) => {
      expect(chatGroupDraftKey(none)).toBe('')
    })
  })
})

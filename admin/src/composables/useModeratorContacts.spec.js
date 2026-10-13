// AI-GENERATED — not an architecture reference

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  MODERATOR_CONTACTS_FRESH_MS,
  MODERATOR_CONTACTS_RETURN_MS,
  MODERATOR_CONTACTS_WAIT_MS,
  askModeratorContacts,
  forgetModeratorContacts,
  moderatorContact,
} from './useModeratorContacts'
import { contactRefs } from '@/graphql/contactRefs'

/**
 * Whom the signed-in moderator is in contact with, asked once for all the names on a screen.
 * What stands behind a member's name goes by it: the way into the conversation for a contact,
 * the arrow into the send form for everybody else (components/MemberWalletLink.vue).
 */
describe('useModeratorContacts', () => {
  const HOME = '9f8e7d6c-5b4a-4c3d-9e2f-1a0b9c8d7e6f'
  const BIBI = { communityUuid: HOME, gradidoID: '1b2c3d4e-5f60-4a7b-8c9d-0e1f2a3b4c5d' }
  const BOB = { communityUuid: HOME, gradidoID: '7a6b5c4d-3e2f-4a1b-8c0d-9e8f7a6b5c4d' }
  const MODERATOR = 7

  /** A client whose answers are given by hand, one question at a time. */
  const clientThatWaits = () => {
    const waiting = []
    const client = {
      query: vi.fn(
        () =>
          new Promise((resolve, reject) => {
            waiting.push({ resolve, reject })
          }),
      ),
    }
    const answers = (refs, index = waiting.length - 1) =>
      waiting[index].resolve({ data: { contactRefs: refs } })
    const fails = (index = waiting.length - 1) => waiting[index].reject(new Error('no answer'))
    return { client, answers, fails }
  }
  const clientThatKnows = (refs) => ({
    query: vi.fn().mockResolvedValue({ data: { contactRefs: refs } }),
  })

  beforeEach(() => {
    forgetModeratorContacts()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('knows nothing of anybody before it has asked', () => {
    expect(moderatorContact(MODERATOR, BIBI)).toBe('unknown')
  })

  it('asks the server for the pairs, past the cache', async () => {
    const client = clientThatKnows([])
    await askModeratorContacts(client, MODERATOR)

    expect(client.query).toHaveBeenCalledTimes(1)
    expect(client.query).toHaveBeenCalledWith({ query: contactRefs, fetchPolicy: 'no-cache' })
  })

  it('says that it is asking while the first answer is on its way', async () => {
    const { client, answers } = clientThatWaits()
    const asked = askModeratorContacts(client, MODERATOR)

    expect(moderatorContact(MODERATOR, BIBI)).toBe('asking')

    answers([BIBI])
    await asked
    expect(moderatorContact(MODERATOR, BIBI)).toBe('yes')
  })

  it('tells a contact from everybody else, once the server answered', async () => {
    await askModeratorContacts(clientThatKnows([BIBI]), MODERATOR)

    expect(moderatorContact(MODERATOR, BIBI)).toBe('yes')
    expect(moderatorContact(MODERATOR, BOB)).toBe('no')
  })

  // ⛔ The PAIR names a member. A gradido id alone is unique within one community only.
  it('knows a member by the pair, not by half of it', async () => {
    await askModeratorContacts(clientThatKnows([BIBI]), MODERATOR)

    expect(
      moderatorContact(MODERATOR, {
        communityUuid: 'another-community',
        gradidoID: BIBI.gradidoID,
      }),
    ).toBe('no')
    expect(moderatorContact(MODERATOR, { communityUuid: HOME, gradidoID: BOB.gradidoID })).toBe(
      'no',
    )
  })

  // A uuid is the same in upper and in lower case.
  it('knows a member whatever the case the pair is written in, on either side', async () => {
    await askModeratorContacts(
      clientThatKnows([{ communityUuid: HOME.toUpperCase(), gradidoID: BIBI.gradidoID }]),
      MODERATOR,
    )

    expect(moderatorContact(MODERATOR, BIBI)).toBe('yes')
    expect(
      moderatorContact(MODERATOR, {
        communityUuid: HOME,
        gradidoID: BIBI.gradidoID.toUpperCase(),
      }),
    ).toBe('yes')
    expect(moderatorContact(MODERATOR, BOB)).toBe('no')
  })

  it('takes whatever else a row carries along with the pair', async () => {
    await askModeratorContacts(clientThatKnows([BIBI]), MODERATOR)
    expect(moderatorContact(MODERATOR, { ...BIBI, userId: 3, alias: 'bibi' })).toBe('yes')
  })

  // The spans the comments speak of: a minute for the names of a page; seconds for the moderator
  // who comes back from the wallet's window, where a booking takes longer than that; and how
  // long a name waits for the first answer before it shows what needs none.
  it('takes an answer as it is for a minute, for five seconds on the way back, and waits three for the first', () => {
    expect(MODERATOR_CONTACTS_FRESH_MS).toBe(60 * 1000)
    expect(MODERATOR_CONTACTS_RETURN_MS).toBe(5 * 1000)
    expect(MODERATOR_CONTACTS_WAIT_MS).toBe(3 * 1000)
  })

  // ⛔ The arrow was there at once before there was this question: a slow answer must not keep
  // it away. So the wait for the first answer has an end, and the answer is taken all the same.
  describe('where the first answer takes its time', () => {
    const OTHER = 8

    it('stops waiting after three seconds, and takes the answer when it comes', async () => {
      vi.useFakeTimers()
      const { client, answers } = clientThatWaits()
      const asked = askModeratorContacts(client, MODERATOR)

      vi.advanceTimersByTime(MODERATOR_CONTACTS_WAIT_MS - 1)
      expect(moderatorContact(MODERATOR, BIBI)).toBe('asking')
      vi.advanceTimersByTime(1)
      expect(moderatorContact(MODERATOR, BIBI)).toBe('unknown')

      answers([BIBI])
      await asked
      expect(moderatorContact(MODERATOR, BIBI)).toBe('yes')
      expect(moderatorContact(MODERATOR, BOB)).toBe('no')
    })

    it('asks no second time for it: the question on its way is the question', () => {
      vi.useFakeTimers()
      const { client } = clientThatWaits()
      askModeratorContacts(client, MODERATOR)
      vi.advanceTimersByTime(MODERATOR_CONTACTS_WAIT_MS)

      askModeratorContacts(client, MODERATOR)
      askModeratorContacts(client, MODERATOR, 0)
      expect(client.query).toHaveBeenCalledTimes(1)
    })

    it('stays unknown where the slow question fails in the end', async () => {
      vi.useFakeTimers()
      const { client, fails } = clientThatWaits()
      const asked = askModeratorContacts(client, MODERATOR)
      vi.advanceTimersByTime(MODERATOR_CONTACTS_WAIT_MS)

      fails()
      await asked
      expect(moderatorContact(MODERATOR, BIBI)).toBe('unknown')
    })

    it('waits anew for another moderator', () => {
      vi.useFakeTimers()
      askModeratorContacts(clientThatWaits().client, MODERATOR)
      vi.advanceTimersByTime(MODERATOR_CONTACTS_WAIT_MS)
      expect(moderatorContact(MODERATOR, BIBI)).toBe('unknown')

      askModeratorContacts(clientThatWaits().client, OTHER)
      expect(moderatorContact(OTHER, BIBI)).toBe('asking')
    })

    // The clock of a question belongs to that question.
    it('does not end the wait of the next moderator with the clock of the one before', () => {
      vi.useFakeTimers()
      askModeratorContacts(clientThatWaits().client, MODERATOR)
      vi.advanceTimersByTime(MODERATOR_CONTACTS_WAIT_MS - 1000)

      askModeratorContacts(clientThatWaits().client, OTHER)
      // Three seconds after the first question, two before the end of the second wait.
      vi.advanceTimersByTime(1000)
      expect(moderatorContact(OTHER, BIBI)).toBe('asking')

      vi.advanceTimersByTime(MODERATOR_CONTACTS_WAIT_MS - 1000)
      expect(moderatorContact(OTHER, BIBI)).toBe('unknown')
    })

    it('leaves no clock running once the answer is there', async () => {
      vi.useFakeTimers()
      await askModeratorContacts(clientThatKnows([BIBI]), MODERATOR)
      expect(vi.getTimerCount()).toBe(0)

      await askModeratorContacts({ query: vi.fn().mockRejectedValue(new Error('x')) }, OTHER)
      expect(vi.getTimerCount()).toBe(0)
    })

    // Asked again later -- another page, the way back -- nothing waits: the names show what
    // they showed.
    it('starts no clock for a question after the first', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-10-13T12:00:00Z'))
      await askModeratorContacts(clientThatKnows([BIBI]), MODERATOR)
      vi.setSystemTime(new Date(Date.now() + MODERATOR_CONTACTS_FRESH_MS))

      askModeratorContacts(clientThatWaits().client, MODERATOR)
      expect(vi.getTimerCount()).toBe(0)
      expect(moderatorContact(MODERATOR, BIBI)).toBe('yes')
    })
  })

  describe('asked by every name on a page', () => {
    it('asks the server once while the question is on its way', async () => {
      const { client, answers } = clientThatWaits()
      const first = askModeratorContacts(client, MODERATOR)
      const second = askModeratorContacts(client, MODERATOR)
      const third = askModeratorContacts(client, MODERATOR)

      expect(client.query).toHaveBeenCalledTimes(1)
      answers([BIBI])
      await Promise.all([first, second, third])
      expect(moderatorContact(MODERATOR, BIBI)).toBe('yes')
    })

    it('takes an answer as it is for a minute, and asks again after that', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-10-13T12:00:00Z'))
      const client = clientThatKnows([BIBI])
      await askModeratorContacts(client, MODERATOR)

      vi.setSystemTime(new Date(Date.now() + MODERATOR_CONTACTS_FRESH_MS - 1))
      await askModeratorContacts(client, MODERATOR)
      expect(client.query).toHaveBeenCalledTimes(1)

      vi.setSystemTime(new Date(Date.now() + 1))
      await askModeratorContacts(client, MODERATOR)
      expect(client.query).toHaveBeenCalledTimes(2)
    })

    // The moderator who comes back to the window may have become a contact of somebody in the
    // wallet beside it: there an answer is taken as it is for seconds only.
    it('asks again sooner where it is told how old an answer may be', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-10-13T12:00:00Z'))
      const client = clientThatKnows([BIBI])
      await askModeratorContacts(client, MODERATOR)

      vi.setSystemTime(new Date(Date.now() + MODERATOR_CONTACTS_RETURN_MS - 1))
      await askModeratorContacts(client, MODERATOR, MODERATOR_CONTACTS_RETURN_MS)
      expect(client.query).toHaveBeenCalledTimes(1)

      vi.setSystemTime(new Date(Date.now() + 1))
      // Still young enough for a name that is set up ...
      await askModeratorContacts(client, MODERATOR)
      expect(client.query).toHaveBeenCalledTimes(1)
      // ... and too old for the way back.
      await askModeratorContacts(client, MODERATOR, MODERATOR_CONTACTS_RETURN_MS)
      expect(client.query).toHaveBeenCalledTimes(2)
    })

    it('waits for a question on its way, however young an answer has to be', async () => {
      const { client, answers } = clientThatWaits()
      const first = askModeratorContacts(client, MODERATOR, 0)
      const second = askModeratorContacts(client, MODERATOR, 0)

      expect(client.query).toHaveBeenCalledTimes(1)
      answers([BIBI])
      await Promise.all([first, second])
    })

    // Asked again, the names keep what they show until the new answer is there: nothing
    // flickers back to "asking".
    it('keeps what it knew while it asks again', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-10-13T12:00:00Z'))
      await askModeratorContacts(clientThatKnows([BIBI]), MODERATOR)
      vi.setSystemTime(new Date(Date.now() + MODERATOR_CONTACTS_FRESH_MS))

      const { client, answers } = clientThatWaits()
      const asked = askModeratorContacts(client, MODERATOR)
      expect(moderatorContact(MODERATOR, BIBI)).toBe('yes')
      expect(moderatorContact(MODERATOR, BOB)).toBe('no')

      answers([BOB])
      await asked
      expect(moderatorContact(MODERATOR, BIBI)).toBe('no')
      expect(moderatorContact(MODERATOR, BOB)).toBe('yes')
    })
  })

  describe('where the server does not answer', () => {
    it('does not reject, and knows nothing', async () => {
      const { client, fails } = clientThatWaits()
      const asked = askModeratorContacts(client, MODERATOR)
      fails()

      await expect(asked).resolves.toBeUndefined()
      expect(moderatorContact(MODERATOR, BIBI)).toBe('unknown')
    })

    it('asks again the next time', async () => {
      const failing = { query: vi.fn().mockRejectedValue(new Error('no answer')) }
      await askModeratorContacts(failing, MODERATOR)

      const client = clientThatKnows([BIBI])
      await askModeratorContacts(client, MODERATOR)
      expect(client.query).toHaveBeenCalledTimes(1)
      expect(moderatorContact(MODERATOR, BIBI)).toBe('yes')
    })

    // Whoever draws by it shows what needs no answer after a failure. Asked again, that stays
    // until the answer is there: nothing goes back to "asking".
    it('stays unknown while it asks again after a question that failed', async () => {
      await askModeratorContacts({ query: vi.fn().mockRejectedValue(new Error('x')) }, MODERATOR)
      expect(moderatorContact(MODERATOR, BIBI)).toBe('unknown')

      const { client, answers } = clientThatWaits()
      const asked = askModeratorContacts(client, MODERATOR)
      expect(moderatorContact(MODERATOR, BIBI)).toBe('unknown')

      answers([BIBI])
      await asked
      expect(moderatorContact(MODERATOR, BIBI)).toBe('yes')
    })

    it('says that it is asking again for another moderator, after a question that failed', async () => {
      await askModeratorContacts({ query: vi.fn().mockRejectedValue(new Error('x')) }, MODERATOR)

      const { client, answers } = clientThatWaits()
      const asked = askModeratorContacts(client, MODERATOR + 1)
      expect(moderatorContact(MODERATOR + 1, BIBI)).toBe('asking')
      answers([])
      await asked
    })

    it('keeps what it knew before', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-10-13T12:00:00Z'))
      await askModeratorContacts(clientThatKnows([BIBI]), MODERATOR)
      vi.setSystemTime(new Date(Date.now() + MODERATOR_CONTACTS_FRESH_MS))

      await askModeratorContacts({ query: vi.fn().mockRejectedValue(new Error('x')) }, MODERATOR)
      expect(moderatorContact(MODERATOR, BIBI)).toBe('yes')
    })

    it('does not trip over an answer without a list', async () => {
      await askModeratorContacts({ query: vi.fn().mockResolvedValue({ data: {} }) }, MODERATOR)
      expect(moderatorContact(MODERATOR, BIBI)).toBe('no')
    })

    it('does not trip over a client that throws at once', async () => {
      const client = {
        query: vi.fn(() => {
          throw new Error('no client')
        }),
      }
      await expect(askModeratorContacts(client, MODERATOR)).resolves.toBeUndefined()
      expect(moderatorContact(MODERATOR, BIBI)).toBe('unknown')
    })
  })

  // ⛔ The same browser is used by more than one moderator, and the admin interface can be
  // entered as another one without the one before signing out.
  describe('held for one moderator', () => {
    const OTHER = 8

    it('says nothing of the contacts of the moderator before', async () => {
      await askModeratorContacts(clientThatKnows([BIBI]), MODERATOR)
      expect(moderatorContact(OTHER, BIBI)).toBe('unknown')
    })

    it('asks anew for another moderator, at once', async () => {
      await askModeratorContacts(clientThatKnows([BIBI]), MODERATOR)

      const client = clientThatKnows([BOB])
      await askModeratorContacts(client, OTHER)
      expect(client.query).toHaveBeenCalledTimes(1)
      expect(moderatorContact(OTHER, BIBI)).toBe('no')
      expect(moderatorContact(OTHER, BOB)).toBe('yes')
      // And of the one before nothing is said any more.
      expect(moderatorContact(MODERATOR, BIBI)).toBe('unknown')
    })

    it('drops an answer that arrives for the moderator before', async () => {
      const before = clientThatWaits()
      const askedBefore = askModeratorContacts(before.client, MODERATOR)
      const now = clientThatWaits()
      const askedNow = askModeratorContacts(now.client, OTHER)

      before.answers([BIBI])
      await askedBefore
      expect(moderatorContact(OTHER, BIBI)).toBe('asking')

      now.answers([BOB])
      await askedNow
      expect(moderatorContact(OTHER, BIBI)).toBe('no')
      expect(moderatorContact(OTHER, BOB)).toBe('yes')
    })

    it('asks nothing for nobody', async () => {
      const client = clientThatKnows([BIBI])
      await askModeratorContacts(client, null)
      await askModeratorContacts(client, undefined)

      expect(client.query).not.toHaveBeenCalled()
      expect(moderatorContact(null, BIBI)).toBe('unknown')
      expect(moderatorContact(undefined, BIBI)).toBe('unknown')
    })

    // 0 is a number a moderator can have.
    it('takes a moderator with the number 0 for somebody', async () => {
      await askModeratorContacts(clientThatKnows([BIBI]), 0)
      expect(moderatorContact(0, BIBI)).toBe('yes')
    })

    it('asks nothing without a client', async () => {
      await expect(askModeratorContacts(null, MODERATOR)).resolves.toBeUndefined()
      expect(moderatorContact(MODERATOR, BIBI)).toBe('unknown')
    })
  })

  describe('at logout', () => {
    it('forgets whom the moderator is in contact with', async () => {
      await askModeratorContacts(clientThatKnows([BIBI]), MODERATOR)
      forgetModeratorContacts()

      expect(moderatorContact(MODERATOR, BIBI)).toBe('unknown')
    })

    it('drops an answer that was still on its way', async () => {
      const { client, answers } = clientThatWaits()
      const asked = askModeratorContacts(client, MODERATOR)
      forgetModeratorContacts()
      answers([BIBI])
      await asked

      expect(moderatorContact(MODERATOR, BIBI)).toBe('unknown')
    })

    // The same moderator signs in again while the old answer is still on its way: it belongs
    // to the session before, and the question of this one is not ended by it.
    it('drops it for the same moderator who is back before it arrives', async () => {
      const before = clientThatWaits()
      const askedBefore = askModeratorContacts(before.client, MODERATOR)
      forgetModeratorContacts()
      const now = clientThatWaits()
      const askedNow = askModeratorContacts(now.client, MODERATOR)

      before.answers([BIBI])
      await askedBefore
      expect(moderatorContact(MODERATOR, BIBI)).toBe('asking')

      now.answers([])
      await askedNow
      expect(moderatorContact(MODERATOR, BIBI)).toBe('no')
    })

    it('asks anew for the same moderator who signs in again', async () => {
      await askModeratorContacts(clientThatKnows([BIBI]), MODERATOR)
      forgetModeratorContacts()

      const client = clientThatKnows([])
      await askModeratorContacts(client, MODERATOR)
      expect(client.query).toHaveBeenCalledTimes(1)
      expect(moderatorContact(MODERATOR, BIBI)).toBe('no')
    })
  })
})

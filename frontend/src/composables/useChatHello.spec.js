// AI-GENERATED — not an architecture reference
import { describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { watch } from 'vue'
import { contactByMemberQuery } from '@/graphql/contacts.graphql'
import { sendChatMessage } from '@/graphql/chat.graphql'
import {
  CHAT_HELLO_ASKING,
  CHAT_HELLO_CONTACT,
  CHAT_HELLO_STRANGER,
  CHAT_HELLO_UNKNOWN,
  useChatHello,
} from './useChatHello'

const JENS = { gradidoID: 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', communityUuid: 'cccccccc-1' }
const ANNA = { gradidoID: 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb', communityUuid: 'cccccccc-2' }

/** A promise that settles when the test says so: an answer that is still on its way. */
const held = () => {
  let settle
  let refuse
  const promise = new Promise((resolve, reject) => {
    settle = resolve
    refuse = reject
  })
  return { promise, resolve: settle, reject: refuse }
}

const noContact = { data: { contactList: { contacts: [] } } }
const aContact = { data: { contactList: { contacts: [{ user: { gradidoID: JENS.gradidoID } }] } } }
const copy = (over = {}) => ({
  data: { sendChatMessage: { id: 7, mailState: 'MAILED', deliveryState: 'DELIVERED', ...over } },
})

const client = ({ query = async () => noContact, mutate = async () => copy() } = {}) => ({
  query: vi.fn(query),
  mutate: vi.fn(mutate),
})

describe('useChatHello', () => {
  describe('ask', () => {
    it('begins about nobody', () => {
      const hello = useChatHello(client())
      expect(hello.standing.value).toBe(CHAT_HELLO_UNKNOWN)
      expect(hello.sending.value).toBe(false)
      expect(hello.failed.value).toBe(false)
      expect(hello.sent.value).toBeNull()
    })

    it('asks the server about exactly this pair, past the cache', async () => {
      const apollo = client()
      const hello = useChatHello(apollo)
      await hello.ask(JENS)

      expect(apollo.query).toHaveBeenCalledTimes(1)
      expect(apollo.query).toHaveBeenCalledWith({
        query: contactByMemberQuery,
        variables: { ref: { gradidoID: JENS.gradidoID, communityUuid: JENS.communityUuid } },
        fetchPolicy: 'no-cache',
      })
    })

    it('is "asking" until the server answers, then a stranger where it knows no contact', async () => {
      const answer = held()
      const hello = useChatHello(client({ query: () => answer.promise }))
      const asked = hello.ask(JENS)
      expect(hello.standing.value).toBe(CHAT_HELLO_ASKING)

      answer.resolve(noContact)
      await asked
      expect(hello.standing.value).toBe(CHAT_HELLO_STRANGER)
    })

    it('is a contact where the server has a row for the pair', async () => {
      const hello = useChatHello(client({ query: async () => aContact }))
      await hello.ask(JENS)
      expect(hello.standing.value).toBe(CHAT_HELLO_CONTACT)
    })

    it('stays unknown where the question did not get through: no first word on a guess', async () => {
      const hello = useChatHello(
        client({
          query: async () => {
            throw new Error('Network error')
          },
        }),
      )
      await hello.ask(JENS)
      expect(hello.standing.value).toBe(CHAT_HELLO_UNKNOWN)
    })

    it('asks nobody about nobody', async () => {
      const apollo = client()
      const hello = useChatHello(apollo)
      await hello.ask(null)
      expect(apollo.query).not.toHaveBeenCalled()
      expect(hello.standing.value).toBe(CHAT_HELLO_UNKNOWN)
    })

    it('lets go of an answer that comes after the window moved on to somebody else', async () => {
      const first = held()
      const second = held()
      const answers = [first.promise, second.promise]
      const hello = useChatHello(client({ query: () => answers.shift() }))

      const aboutJens = hello.ask(JENS)
      const aboutAnna = hello.ask(ANNA)
      // Anna is a stranger -- and then Jens's late answer says "a contact".
      second.resolve(noContact)
      await aboutAnna
      expect(hello.standing.value).toBe(CHAT_HELLO_STRANGER)

      first.resolve(aContact)
      await aboutJens
      expect(hello.standing.value).toBe(CHAT_HELLO_STRANGER)
    })

    it('lets go of a late failure the same way', async () => {
      const first = held()
      const hello = useChatHello(
        client({ query: vi.fn().mockReturnValueOnce(first.promise).mockResolvedValue(aContact) }),
      )
      const aboutJens = hello.ask(JENS)
      await hello.ask(ANNA)
      expect(hello.standing.value).toBe(CHAT_HELLO_CONTACT)

      first.reject(new Error('Network error'))
      await aboutJens
      expect(hello.standing.value).toBe(CHAT_HELLO_CONTACT)
    })

    it('lets go of everything said about the one before', async () => {
      const hello = useChatHello(client())
      await hello.ask(JENS)
      await hello.send('Hallo Jens')
      expect(hello.sent.value).not.toBeNull()

      const next = hello.ask(ANNA)
      expect(hello.sent.value).toBeNull()
      expect(hello.failed.value).toBe(false)
      expect(hello.sending.value).toBe(false)
      expect(hello.standing.value).toBe(CHAT_HELLO_ASKING)
      await next

      // And the window shut: about nobody again.
      await hello.ask(null)
      expect(hello.standing.value).toBe(CHAT_HELLO_UNKNOWN)
    })
  })

  describe('send', () => {
    it('sends the words to exactly this pair, asking for the mail the first message gets anyway', async () => {
      const apollo = client()
      const hello = useChatHello(apollo)
      await hello.ask(JENS)
      await hello.send('Hallo Jens, ich habe Dich auf der Gradido-Karte gefunden.')

      expect(apollo.mutate).toHaveBeenCalledTimes(1)
      expect(apollo.mutate).toHaveBeenCalledWith({
        mutation: sendChatMessage,
        variables: {
          ref: { gradidoID: JENS.gradidoID, communityUuid: JENS.communityUuid },
          body: 'Hallo Jens, ich habe Dich auf der Gradido-Karte gefunden.',
          notify: 'EMAIL',
        },
      })
      // Neither a picture nor an answered message goes with a hello: no such field at all.
      const [{ variables }] = apollo.mutate.mock.calls[0]
      expect(variables).not.toHaveProperty('image')
      expect(variables).not.toHaveProperty('replyTo')
    })

    it('says what the server says became of it: mailed and delivered', async () => {
      const hello = useChatHello(client())
      await hello.ask(JENS)
      await hello.send('Hallo')
      expect(hello.sent.value).toEqual({ mailed: true, delivery: 'DELIVERED' })
      expect(hello.failed.value).toBe(false)
      expect(hello.sending.value).toBe(false)
    })

    it.each([
      ['no mail went out', { mailState: null }, { mailed: false, delivery: 'DELIVERED' }],
      ['the mail was held back', { mailState: 'MUTED' }, { mailed: false, delivery: 'DELIVERED' }],
      [
        'the other community did not take it',
        { mailState: null, deliveryState: 'FAILED' },
        { mailed: false, delivery: 'FAILED' },
      ],
      [
        'it is not known yet whether it arrived',
        { mailState: null, deliveryState: 'PENDING' },
        { mailed: false, delivery: 'PENDING' },
      ],
    ])('says so where %s', async (_, over, outcome) => {
      const hello = useChatHello(client({ mutate: async () => copy(over) }))
      await hello.ask(JENS)
      await hello.send('Hallo')
      expect(hello.sent.value).toEqual(outcome)
    })

    it('is "sending" while the hello is on its way, and a second press sends nothing', async () => {
      const answer = held()
      const apollo = client({ mutate: () => answer.promise })
      const hello = useChatHello(apollo)
      await hello.ask(JENS)

      const first = hello.send('Hallo')
      expect(hello.sending.value).toBe(true)
      await hello.send('Hallo')
      await hello.send('Hallo noch einmal')
      expect(apollo.mutate).toHaveBeenCalledTimes(1)

      answer.resolve(copy())
      await first
      expect(hello.sending.value).toBe(false)
      expect(hello.sent.value).not.toBeNull()
    })

    it('sends no second hello once one has gone out', async () => {
      const apollo = client()
      const hello = useChatHello(apollo)
      await hello.ask(JENS)
      await hello.send('Hallo')
      await hello.send('Hallo')
      expect(apollo.mutate).toHaveBeenCalledTimes(1)
    })

    it.each([
      ['a contact', async () => aContact],
      [
        'somebody the server could not be asked about',
        async () => {
          throw new Error('Network error')
        },
      ],
    ])('sends nothing to %s', async (_, query) => {
      const apollo = client({ query })
      const hello = useChatHello(apollo)
      await hello.ask(JENS)
      await hello.send('Hallo')
      expect(apollo.mutate).not.toHaveBeenCalled()
      expect(hello.sent.value).toBeNull()
      expect(hello.failed.value).toBe(false)
    })

    it('sends nothing before the server has answered, and nothing about nobody', async () => {
      const answer = held()
      const apollo = client({ query: () => answer.promise })
      const hello = useChatHello(apollo)

      await hello.send('Hallo')
      const asked = hello.ask(JENS)
      await hello.send('Hallo')
      expect(apollo.mutate).not.toHaveBeenCalled()

      answer.resolve(noContact)
      await asked
      await hello.send('Hallo')
      expect(apollo.mutate).toHaveBeenCalledTimes(1)
    })

    it.each([
      [
        'the server refuses',
        async () => {
          throw new Error('CHAT_MESSAGE_NOT_SENT: UNKNOWN_RECIPIENT')
        },
      ],
      ['the server gives no copy back', async () => ({ data: { sendChatMessage: null } })],
      ['the answer is empty', async () => undefined],
    ])('fails where %s: not sent, and another press may try again', async (_, mutate) => {
      const apollo = client({ mutate })
      const hello = useChatHello(apollo)
      await hello.ask(JENS)
      await hello.send('Hallo')

      expect(hello.failed.value).toBe(true)
      expect(hello.sending.value).toBe(false)
      expect(hello.sent.value).toBeNull()

      apollo.mutate.mockImplementation(async () => copy())
      await hello.send('Hallo')
      expect(hello.failed.value).toBe(false)
      expect(hello.sent.value).toEqual({ mailed: true, delivery: 'DELIVERED' })
    })

    // The compose bar reads "no longer sending, not failed" as "it went through" and empties its
    // field: the two must never be seen apart (ChatThread, `send`).
    it('never shows "no longer sending" before "failed"', async () => {
      const answer = held()
      const hello = useChatHello(client({ mutate: () => answer.promise }))
      await hello.ask(JENS)
      const seen = []
      const sending = hello.send('Hallo')
      watch(
        () => hello.sending.value,
        (now) => seen.push({ sending: now, failed: hello.failed.value }),
        { flush: 'sync' },
      )

      answer.reject(new Error('Network error'))
      await sending
      expect(seen).toEqual([{ sending: false, failed: true }])
    })

    it('lets go of a copy that comes back after the window moved on', async () => {
      const answer = held()
      const apollo = client({ mutate: () => answer.promise })
      const hello = useChatHello(apollo)
      await hello.ask(JENS)
      const toJens = hello.send('Hallo Jens')

      // The window shows Anna now, a stranger too -- and then Jens's copy comes back.
      await hello.ask(ANNA)
      answer.resolve(copy())
      await toJens
      await flushPromises()

      expect(hello.sent.value).toBeNull()
      expect(hello.sending.value).toBe(false)
      expect(hello.failed.value).toBe(false)
      expect(hello.standing.value).toBe(CHAT_HELLO_STRANGER)
    })

    it('lets go of a late refusal the same way, and Anna can still be written to', async () => {
      const answer = held()
      const apollo = client({
        mutate: vi.fn().mockReturnValueOnce(answer.promise).mockResolvedValue(copy()),
      })
      const hello = useChatHello(apollo)
      await hello.ask(JENS)
      const toJens = hello.send('Hallo Jens')

      await hello.ask(ANNA)
      answer.reject(new Error('Network error'))
      await toJens
      expect(hello.failed.value).toBe(false)

      await hello.send('Hallo Anna')
      expect(apollo.mutate).toHaveBeenLastCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            ref: { gradidoID: ANNA.gradidoID, communityUuid: ANNA.communityUuid },
            body: 'Hallo Anna',
          }),
        }),
      )
      expect(hello.sent.value).toEqual({ mailed: true, delivery: 'DELIVERED' })
    })
  })
})

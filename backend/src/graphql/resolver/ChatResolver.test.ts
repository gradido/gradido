// AI-GENERATED — not an architecture reference
import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { getLogger } from 'config-schema/test/testSetup'
import { CONFIG as CORE_CONFIG } from 'core'
import { AppDatabase, User } from 'database'
import { GraphQLError } from 'graphql'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { userFactory } from '@/seeds/factory/user'
import { login, markChatConversationRead, sendEmail } from '@/seeds/graphql/mutations'
import { chatMessagesWithMember, contactList } from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { peterLustig } from '@/seeds/users/peter-lustig'

jest.mock('@/password/EncryptorUtils')

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)
// The messages are written through sendEmail, as a member writes them; no mail has to go out.
CORE_CONFIG.EMAIL = false

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  db: AppDatabase
}

let bibi: User
let bob: User
let peter: User

const SUBJECT = 'About Saturday'

const ref = (member: User) => ({ communityUuid: member.communityUuid, gradidoID: member.gradidoID })

const loginAs = async (email: string): Promise<void> => {
  await mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })
}

/** Writes to `to` as whoever is logged in -- the way the form "send an e-mail" does. */
const write = async (to: User, subject: string, memo: string): Promise<void> => {
  const res = await mutate({
    mutation: sendEmail,
    variables: {
      recipientCommunityIdentifier: to.communityUuid,
      recipientIdentifier: to.gradidoID,
      subject,
      memo,
    },
  })
  expect(res.errors).toBeUndefined()
}

/** The thread of whoever is logged in with `member`. */
const threadWith = async (member: User, page: { before?: number; limit?: number } = {}) => {
  const res: any = await query({
    query: chatMessagesWithMember,
    variables: { ref: ref(member), ...page },
  })
  expect(res.errors).toBeUndefined()
  return res.data.chatMessagesWithMember
}

const markRead = async (member: User, upToMessageId: number) => {
  const res: any = await mutate({
    mutation: markChatConversationRead,
    variables: { ref: ref(member), upToMessageId },
  })
  expect(res.errors).toBeUndefined()
  return res.data.markChatConversationRead
}

/** What the contact list of whoever is logged in says is unread from `member`. */
const unreadFrom = async (member: User) => {
  const res: any = await query({ query: contactList, variables: { pageSize: 25 } })
  expect(res.errors).toBeUndefined()
  const row = res.data.contactList.contacts.find((c: any) => c.user.gradidoID === member.gradidoID)
  return row?.unreadChatMessages
}

beforeAll(async () => {
  testEnv = await testEnvironment(logger)
  mutate = testEnv.mutate
  query = testEnv.query
  await cleanDB()
  bibi = await userFactory(testEnv, bibiBloxberg)
  bob = await userFactory(testEnv, bobBaumeister)
  peter = await userFactory(testEnv, peterLustig)
})

afterAll(async () => {
  await cleanDB()
  await testEnv.db.destroy()
})

describe('ChatResolver', () => {
  describe('without a login', () => {
    beforeAll(() => resetToken())

    it('answers 401 to both calls', async () => {
      const unauthorized = expect.objectContaining({
        errors: [new GraphQLError('401 Unauthorized')],
      })
      expect(await query({ query: chatMessagesWithMember, variables: { ref: ref(bob) } })).toEqual(
        unauthorized,
      )
      expect(
        await mutate({
          mutation: markChatConversationRead,
          variables: { ref: ref(bob), upToMessageId: 1 },
        }),
      ).toEqual(unauthorized)
    })
  })

  /**
   * bibi and bob write each other three times -- bibi first, from the form with a subject,
   * then bob, then bibi again, both without one.
   */
  describe('a thread between two members', () => {
    beforeAll(async () => {
      await loginAs('bibi@bloxberg.de')
      await write(bob, SUBJECT, 'Shall we meet at ten?')
      await loginAs('bob@baumeister.de')
      await write(bibi, '', 'Ten is fine.')
      await loginAs('bibi@bloxberg.de')
      await write(bob, '', 'See you.')
    })

    afterAll(() => resetToken())

    describe('read by one of the two', () => {
      beforeAll(() => loginAs('bibi@bloxberg.de'))

      it('hands out the whole thread from both sides, in the order it arrived', async () => {
        const page = await threadWith(bob)
        expect(page.hasMore).toBe(false)
        expect(page.messages.map((m: any) => m.body)).toEqual([
          'Shall we meet at ten?',
          'Ten is fine.',
          'See you.',
        ])
        const ids = page.messages.map((m: any) => m.id)
        expect([...ids].sort((a, b) => a - b)).toEqual(ids)
        expect(new Set(page.messages.map((m: any) => m.conversationId)).size).toBe(1)
      })

      it('says which of them the reader wrote, and who wrote each', async () => {
        const page = await threadWith(bob)
        expect(page.messages.map((m: any) => m.mine)).toEqual([true, false, true])
        expect(page.messages[1].sender).toEqual(ref(bob))
        expect(page.messages[0].sender).toEqual(ref(bibi))
      })

      // E-013: filled from the form, empty in the chat -- empty meaning none.
      it('carries the subject where the message had one', async () => {
        const page = await threadWith(bob)
        expect(page.messages.map((m: any) => m.subject)).toEqual([SUBJECT, null, null])
      })

      // ⛔ What the sender knows about their own message and nobody else (E-019, E-024): on
      // bob's message bibi learns neither whether it reached her server nor what he asked for.
      it('shows delivery and mail wish on the own messages only', async () => {
        const [own, theirs] = (await threadWith(bob)).messages
        expect(own).toMatchObject({ deliveryState: 'DELIVERED', notify: 'EMAIL' })
        expect(theirs).toMatchObject({ deliveryState: null, notify: null })
      })

      it('pages backwards from the newest, and says when the start is reached', async () => {
        const newest = await threadWith(bob, { limit: 2 })
        expect(newest.messages.map((m: any) => m.body)).toEqual(['Ten is fine.', 'See you.'])
        expect(newest.hasMore).toBe(true)

        const older = await threadWith(bob, { before: newest.messages[0].id, limit: 2 })
        expect(older.messages.map((m: any) => m.body)).toEqual(['Shall we meet at ten?'])
        expect(older.hasMore).toBe(false)
      })

      it('refuses a page larger than the cap, and one of nothing', async () => {
        for (const limit of [101, 0]) {
          const res: any = await query({
            query: chatMessagesWithMember,
            variables: { ref: ref(bob), limit },
          })
          expect(res.errors?.[0]?.message).toContain('Argument Validation Error')
        }
      })

      // ⛔ `limit` caps one page, not how often one document repeats the field under aliases
      // -- that is what the request's budget counts (CHAT_MESSAGE_PAGES_MAX_PER_REQUEST).
      it('answers ten pages in one request, and refuses the eleventh', async () => {
        const pages = (count: number) =>
          `query ($ref: MemberAvatarRefInput!) { ${Array.from(
            { length: count },
            (_, n) => `page${n}: chatMessagesWithMember(ref: $ref, limit: 1) { hasMore }`,
          ).join(' ')} }`
        const ten: any = await query({ query: pages(10), variables: { ref: ref(bob) } })
        expect(ten.errors).toBeUndefined()
        expect(Object.keys(ten.data)).toHaveLength(10)
        const eleven: any = await query({ query: pages(11), variables: { ref: ref(bob) } })
        expect(eleven.errors?.map((error: any) => error.message)).toEqual([
          'Too many chat pages requested at once',
        ])
      })

      it('fills in the home community for a member named without one', async () => {
        const page = await threadWith(bob)
        const res: any = await query({
          query: chatMessagesWithMember,
          variables: { ref: { gradidoID: bob.gradidoID, communityUuid: null } },
        })
        expect(res.data.chatMessagesWithMember).toEqual(page)
      })

      it('answers an empty page about the reader themselves, and about nobody written with', async () => {
        expect(await threadWith(bibi)).toEqual({ messages: [], hasMore: false })
        expect(await threadWith(peter)).toEqual({ messages: [], hasMore: false })
      })
    })

    describe('read by the other of the two', () => {
      beforeAll(() => loginAs('bob@baumeister.de'))

      it('hands out the same thread, from his side', async () => {
        const page = await threadWith(bibi)
        expect(page.messages.map((m: any) => m.body)).toEqual([
          'Shall we meet at ten?',
          'Ten is fine.',
          'See you.',
        ])
        expect(page.messages.map((m: any) => m.mine)).toEqual([false, true, false])
        expect(page.messages.map((m: any) => m.deliveryState)).toEqual([null, 'DELIVERED', null])
        expect(page.messages.map((m: any) => m.notify)).toEqual([null, 'EMAIL', null])
      })
    })

    /**
     * ⛔ The guard against a leak: peter is in no conversation with either of them, and asking
     * about one of them by name must not hand out the conversation of the two.
     */
    describe('asked about by somebody who is not in it', () => {
      beforeAll(() => loginAs('peter@lustig.de'))

      it('hands out nothing of it', async () => {
        expect(await threadWith(bibi)).toEqual({ messages: [], hasMore: false })
        expect(await threadWith(bob)).toEqual({ messages: [], hasMore: false })
      })

      it('marks nothing read in it', async () => {
        expect(await markRead(bibi, 999999)).toBe(false)
        expect(await markRead(bob, 999999)).toBe(false)
        await loginAs('bob@baumeister.de')
        expect(await unreadFrom(bibi)).toBe(2)
      })
    })

    describe('marked read', () => {
      let ids: number[]

      beforeAll(async () => {
        await loginAs('bob@baumeister.de')
        ids = (await threadWith(bibi)).messages.map((m: any) => m.id)
      })

      it('counts both of her messages as unread before anything is marked', async () => {
        expect(await unreadFrom(bibi)).toBe(2)
      })

      it('lowers the unread count as far as he has read, and to nothing at the end', async () => {
        expect(await markRead(bibi, ids[0])).toBe(true)
        expect(await unreadFrom(bibi)).toBe(1)
        expect(await markRead(bibi, ids[2])).toBe(true)
        expect(await unreadFrom(bibi)).toBe(0)
      })

      // An older id arriving late -- a second tab, a slow request -- must not make read
      // messages unread again.
      it('never goes back', async () => {
        expect(await markRead(bibi, ids[0])).toBe(true)
        expect(await unreadFrom(bibi)).toBe(0)
      })

      it('moves only his own pointer: what bibi has not read stays unread to her', async () => {
        await loginAs('bibi@bloxberg.de')
        expect(await unreadFrom(bob)).toBe(1)
      })

      it('answers false where there is no conversation, or about the caller', async () => {
        await loginAs('bob@baumeister.de')
        expect(await markRead(peter, ids[2])).toBe(false)
        expect(await markRead(bob, ids[2])).toBe(false)
      })

      it('refuses an id no message can have', async () => {
        const res: any = await mutate({
          mutation: markChatConversationRead,
          variables: { ref: ref(bibi), upToMessageId: 0 },
        })
        expect(res.errors?.[0]?.message).toContain('Argument Validation Error')
      })

      // ⛔ Taken, an id that is no message of this conversation would put the pointer past
      // every message to come -- and bibi's next message would never count as unread.
      it('answers false for an id that is no message of the conversation, and moves nothing', async () => {
        expect(await markRead(bibi, ids[2] + 1000)).toBe(false)
        await loginAs('bibi@bloxberg.de')
        await write(bob, '', 'One more thing.')
        await loginAs('bob@baumeister.de')
        expect(await unreadFrom(bibi)).toBe(1)
      })
    })
  })
})

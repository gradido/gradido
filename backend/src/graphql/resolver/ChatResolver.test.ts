// AI-GENERATED — not an architecture reference
import { randomBytes } from 'node:crypto'
import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { getLogger } from 'config-schema/test/testSetup'
import { CONFIG as CORE_CONFIG, sendCustomEmail } from 'core'
import {
  AppDatabase,
  chatMessagesTable,
  Community as DbCommunity,
  FederatedCommunity as DbFederatedCommunity,
  User as DbUser,
  UserContact as DbUserContact,
  User,
} from 'database'
import { eq } from 'drizzle-orm'
import { GraphQLError } from 'graphql'
import { GraphQLClient } from 'graphql-request'
import { CommandJwtPayloadType, createKeyPair, verifyAndDecrypt } from 'shared'
import { v4 as uuidv4 } from 'uuid'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { userFactory } from '@/seeds/factory/user'
import {
  login,
  markChatConversationRead,
  sendChatMessage,
  sendEmail,
  setChatConversationMuted,
} from '@/seeds/graphql/mutations'
import { chatMessagesWithMember, contactList, newChatMessagesSince } from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { garrickOllivander } from '@/seeds/users/garrick-ollivander'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { raeuberHotzenplotz } from '@/seeds/users/raeuber-hotzenplotz'

jest.mock('@/password/EncryptorUtils')
// The mail stays the real function -- with mail switched off it sends nothing -- and is
// watched, to see which messages go out as one.
jest.mock('core', () => {
  const originalModule = jest.requireActual('core')
  return {
    __esModule: true,
    ...originalModule,
    sendCustomEmail: jest.fn(originalModule.sendCustomEmail),
  }
})

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
let raeuber: User

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
  raeuber = await userFactory(testEnv, raeuberHotzenplotz)
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
        expect(await threadWith(bibi)).toEqual({ messages: [], hasMore: false, mutedByMe: false })
        expect(await threadWith(peter)).toEqual({ messages: [], hasMore: false, mutedByMe: false })
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
        expect(await threadWith(bibi)).toEqual({ messages: [], hasMore: false, mutedByMe: false })
        expect(await threadWith(bob)).toEqual({ messages: [], hasMore: false, mutedByMe: false })
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

type ChatRef = { communityUuid: string | null; gradidoID: string }

/** The mails handed to sendCustomEmail since the last clear, one entry per mail. */
const mailed = () => (sendCustomEmail as jest.Mock).mock.calls.map(([data]) => data)
const clearMails = () => (sendCustomEmail as jest.Mock).mockClear()

/** Writes in the chat to `to`, as whoever is logged in. */
const say = (to: ChatRef, body: string, notify: 'EMAIL' | 'NONE'): Promise<any> =>
  mutate({ mutation: sendChatMessage, variables: { ref: to, body, notify } })

/** The same, where it must go through: the sender's own copy. */
const said = async (to: ChatRef, body: string, notify: 'EMAIL' | 'NONE') => {
  const res = await say(to, body, notify)
  expect(res.errors).toBeUndefined()
  return res.data.sendChatMessage
}

const mute = async (to: ChatRef, muted: boolean) => {
  const res: any = await mutate({
    mutation: setChatConversationMuted,
    variables: { ref: to, muted },
  })
  expect(res.errors).toBeUndefined()
  return res.data.setChatConversationMuted
}

/** The page of whoever is logged in with `to`, named by a ref of any community. */
const pageWith = async (to: ChatRef) => {
  const res: any = await query({ query: chatMessagesWithMember, variables: { ref: to } })
  expect(res.errors).toBeUndefined()
  return res.data.chatMessagesWithMember
}

/** Every message this server has filed. */
const allMessages = () =>
  AppDatabase.getInstance().getDrizzleDataSource().select().from(chatMessagesTable)

describe('sendChatMessage and setChatConversationMuted without a login', () => {
  beforeAll(() => resetToken())

  it('answer 401', async () => {
    const unauthorized = expect.objectContaining({ errors: [new GraphQLError('401 Unauthorized')] })
    expect(await say(ref(bob), 'Hello', 'EMAIL')).toEqual(unauthorized)
    expect(
      await mutate({
        mutation: setChatConversationMuted,
        variables: { ref: ref(bob), muted: true },
      }),
    ).toEqual(unauthorized)
  })
})

describe('sendChatMessage within the community', () => {
  beforeAll(() => loginAs('peter@lustig.de'))
  beforeEach(() => clearMails())
  afterAll(() => resetToken())

  it('files the message and hands back the own copy, as the sender reads it', async () => {
    const copy = await said(ref(raeuber), 'Hello, Räuber.', 'EMAIL')

    expect(copy).toMatchObject({
      mine: true,
      sender: ref(peter),
      subject: null,
      body: 'Hello, Räuber.',
      deliveryState: 'DELIVERED',
      notify: 'EMAIL',
    })
    const [filed] = (await pageWith(ref(raeuber))).messages
    expect(filed).toEqual(copy)
  })

  it('shows it to the other member, without the wish or the delivery', async () => {
    await loginAs('raeuber@hotzenplotz.de')
    const [message] = (await pageWith(ref(peter))).messages
    expect(message).toMatchObject({
      body: 'Hello, Räuber.',
      mine: false,
      deliveryState: null,
      notify: null,
    })
    await loginAs('peter@lustig.de')
  })

  it('mails no later message sent without a mail, and the copy says so', async () => {
    const copy = await said(ref(raeuber), 'No need to answer.', 'NONE')

    expect(copy).toMatchObject({ notify: 'NONE', deliveryState: 'DELIVERED' })
    expect(mailed()).toEqual([])
  })

  it('mails a later message sent with a mail', async () => {
    const copy = await said(ref(raeuber), 'Please answer.', 'EMAIL')

    expect(copy.notify).toBe('EMAIL')
    expect(mailed()).toEqual([
      expect.objectContaining({
        email: 'raeuber@hotzenplotz.de',
        subject: '',
        memo: 'Please answer.',
        senderUuid: peter.gradidoID,
        senderCommunityUuid: peter.communityUuid,
      }),
    ])
  })

  it('takes an answer from the other side as no first message either', async () => {
    await loginAs('raeuber@hotzenplotz.de')
    const copy = await said(ref(peter), 'Fine.', 'NONE')

    expect(copy.notify).toBe('NONE')
    expect(mailed()).toEqual([])
    await loginAs('peter@lustig.de')
  })
})

/**
 * E-024, the wake-up call: the first message between two members goes out as a mail, whatever
 * the sender asked for -- and a pair who wrote through the form "send an e-mail" has written
 * already.
 */
describe('the first message of a pair', () => {
  beforeEach(() => clearMails())
  afterAll(() => resetToken())

  it('is mailed although no mail was asked for, and the copy says it was', async () => {
    await loginAs('bibi@bloxberg.de')
    const copy = await said(ref(raeuber), 'We have not met yet.', 'NONE')

    expect(copy.notify).toBe('EMAIL')
    expect(mailed()).toEqual([
      expect.objectContaining({ email: 'raeuber@hotzenplotz.de', memo: 'We have not met yet.' }),
    ])
  })

  it('is not the first chat message of a pair who wrote through the form', async () => {
    await loginAs('peter@lustig.de')
    await write(bibi, 'About Sunday', 'Coffee?')
    clearMails()

    const copy = await said(ref(bibi), 'Or tea?', 'NONE')

    expect(copy.notify).toBe('NONE')
    expect(mailed()).toEqual([])
  })
})

/** E-024: mute beats the tick -- and it is the recipient's own, nobody else learns of it. */
describe('a recipient who muted the conversation', () => {
  beforeAll(async () => {
    await loginAs('bob@baumeister.de')
    await said(ref(raeuber), 'First.', 'EMAIL')
    await loginAs('raeuber@hotzenplotz.de')
    expect(await mute(ref(bob), true)).toBe(true)
  })
  beforeEach(() => clearMails())
  afterAll(() => resetToken())

  it('gets the message filed and no mail, and the sender learns nothing of it', async () => {
    await loginAs('bob@baumeister.de')
    const toMuted = await said(ref(raeuber), 'Are you there?', 'EMAIL')
    const toOther = await said(ref(bibi), 'Are you there?', 'EMAIL')

    // One mail, to the one who did not mute.
    expect(mailed().map((mail) => mail.email)).toEqual(['bibi@bloxberg.de'])
    // Both copies say the same: delivered, a mail asked for. Nothing says what became of it.
    const told = ({ id, messageUuid, conversationId, createdAt, ...rest }: any) => rest
    expect(told(toMuted)).toEqual(told(toOther))
    expect(toMuted).toMatchObject({ deliveryState: 'DELIVERED', notify: 'EMAIL' })

    await loginAs('raeuber@hotzenplotz.de')
    expect((await pageWith(ref(bob))).messages.map((m: any) => m.body)).toContain('Are you there?')
  })

  it('mutes one side only: the one who muted still mails the other', async () => {
    await loginAs('raeuber@hotzenplotz.de')
    await said(ref(bob), 'I am.', 'EMAIL')

    expect(mailed().map((mail) => mail.email)).toEqual(['bob@baumeister.de'])
  })

  it('shows the mark to the one who set it, and not to the other', async () => {
    await loginAs('raeuber@hotzenplotz.de')
    expect((await pageWith(ref(bob))).mutedByMe).toBe(true)
    await loginAs('bob@baumeister.de')
    expect((await pageWith(ref(raeuber))).mutedByMe).toBe(false)
  })

  it('mails again once the mark is lifted', async () => {
    await loginAs('raeuber@hotzenplotz.de')
    expect(await mute(ref(bob), false)).toBe(true)
    expect((await pageWith(ref(bob))).mutedByMe).toBe(false)

    await loginAs('bob@baumeister.de')
    clearMails()
    await said(ref(raeuber), 'Now?', 'EMAIL')

    expect(mailed().map((mail) => mail.email)).toEqual(['raeuber@hotzenplotz.de'])
  })
})

describe('setChatConversationMuted', () => {
  beforeAll(() => loginAs('peter@lustig.de'))
  afterAll(() => resetToken())

  // Before the first message there is nothing to mute -- and the first message mails anyway.
  it('answers false where there is no conversation yet, and about the caller', async () => {
    expect(await mute({ communityUuid: peter.communityUuid, gradidoID: uuidv4() }, true)).toBe(
      false,
    )
    expect(await mute(ref(peter), true)).toBe(false)
  })

  it('takes muting twice, and lifting twice, as done', async () => {
    expect(await mute(ref(raeuber), true)).toBe(true)
    expect(await mute(ref(raeuber), true)).toBe(true)
    expect((await pageWith(ref(raeuber))).mutedByMe).toBe(true)
    expect(await mute(ref(raeuber), false)).toBe(true)
    expect(await mute(ref(raeuber), false)).toBe(true)
    expect((await pageWith(ref(raeuber))).mutedByMe).toBe(false)
  })
})

describe('sendChatMessage refused', () => {
  beforeAll(() => loginAs('peter@lustig.de'))
  afterAll(() => resetToken())

  it('to oneself, filing nothing', async () => {
    const before = await allMessages()
    expect((await say(ref(peter), 'Note to self', 'EMAIL')).errors).toEqual([
      new GraphQLError('CHAT_MESSAGE_NOT_SENT: TO_ONESELF'),
    ])
    expect(await allMessages()).toEqual(before)
  })

  it('to a member nobody here knows, filing nothing', async () => {
    const before = await allMessages()
    const nobody = { communityUuid: peter.communityUuid, gradidoID: uuidv4() }
    expect((await say(nobody, 'Hello?', 'EMAIL')).errors).toEqual([
      new GraphQLError('CHAT_MESSAGE_NOT_SENT: UNKNOWN_RECIPIENT'),
    ])
    expect(await allMessages()).toEqual(before)
  })

  it('with no text, and with more than 2000 characters', async () => {
    for (const body of ['', 'x'.repeat(2001)]) {
      const res = await say(ref(raeuber), body, 'EMAIL')
      expect(res.errors?.[0]?.message).toContain('Argument Validation Error')
    }
  })

  // No default: a client that forgets the wish gets an error, not a silent mail.
  it('without a wish', async () => {
    const res: any = await mutate({
      mutation: sendChatMessage,
      variables: { ref: ref(raeuber), body: 'What do I want?' },
    })
    expect(res.errors?.[0]?.message).toContain('"$notify" of required type "ChatMessageNotify!"')
  })
})

/**
 * EM-013: an address never confirmed, past its grace period, acts outward no more -- the right
 * is on RESTRICTED_WHILE_UNCONFIRMED, as SEND_COINS is for the form. Asking for quiet stays.
 */
describe('an unconfirmed account past its grace period', () => {
  let garrick: DbUser

  beforeAll(async () => {
    // Confirmed so that a password exists, then unconfirmed and two days old.
    garrick = await userFactory(testEnv, { ...garrickOllivander, emailChecked: true })
    await loginAs('peter@lustig.de')
    await said(ref(garrick), 'Welcome, Garrick.', 'EMAIL')
    await DbUser.update(
      { id: garrick.id },
      { createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    )
    await DbUserContact.update({ id: garrick.emailId ?? 0 }, { emailChecked: false })
    await loginAs('garrick@ollivander.com')
  })
  afterAll(() => resetToken())

  it('may not write, and nothing is filed', async () => {
    const before = await allMessages()
    expect((await say(ref(peter), 'Thank you.', 'EMAIL')).errors).toEqual([
      new GraphQLError('401 Unauthorized'),
    ])
    expect(await allMessages()).toEqual(before)
  })

  it('may still mute a conversation', async () => {
    expect(await mute(ref(peter), true)).toBe(true)
  })
})

/**
 * The stand-in for the other community opens each command with ITS key, as the real one would,
 * and answers as it is told -- as in the sendEmail cases of TransactionResolver.test.ts.
 */
describe('sendChatMessage to a member of another community', () => {
  const peerUuid = uuidv4()
  const peerMember = uuidv4()
  const peerRef = { communityUuid: peerUuid, gradidoID: peerMember }
  // A community that offers no V1_0 entry: there is no way to deliver to it.
  const laterUuid = uuidv4()

  let homeKeys: { publicKey: string; privateKey: string }
  let peerKeys: { publicKey: string; privateKey: string }
  let peer: DbCommunity
  let peerEntry: DbFederatedCommunity
  let later: DbCommunity
  let laterEntry: DbFederatedCommunity
  let rawRequest: jest.SpyInstance | undefined
  let commands: Record<string, unknown>[] = []
  // What this server had filed for each command while it was on its way.
  let inFlight: (string | undefined)[] = []

  const peerAnswers = (answer: { success: boolean; error?: string }) => {
    rawRequest = jest
      .spyOn(GraphQLClient.prototype, 'rawRequest')
      // CommandClient.sendCommand calls rawRequest(document, variables).
      .mockImplementation((async (
        _document: unknown,
        variables: { args: { handshakeID: string; jwt: string } },
      ) => {
        const { args } = variables
        const command = (await verifyAndDecrypt(
          args.handshakeID,
          args.jwt,
          peerKeys.privateKey,
          homeKeys.publicKey,
        )) as CommandJwtPayloadType | null
        if (!command) {
          throw new Error('the command does not verify with the key of this community')
        }
        const sent = JSON.parse(command.commandArgs[0])
        commands.push(sent)
        inFlight.push(
          (await allMessages()).find((m) => m.messageUuid === sent.messageUuid)?.deliveryState,
        )
        return { data: { sendCommand: answer }, status: 200 }
      }) as any)
  }

  beforeAll(async () => {
    homeKeys = await createKeyPair()
    peerKeys = await createKeyPair()
    await DbCommunity.update(
      { foreign: false },
      { publicJwtKey: homeKeys.publicKey, privateJwtKey: homeKeys.privateKey },
    )
    peer = await DbCommunity.create({
      foreign: true,
      url: 'http://chat-peer.invalid/api/',
      publicKey: randomBytes(32),
      communityUuid: peerUuid,
      authenticatedAt: new Date(),
      name: 'Chat peer',
      description: 'the other side of the border',
      creationDate: new Date(),
      publicJwtKey: peerKeys.publicKey,
    }).save()
    peerEntry = await DbFederatedCommunity.create({
      foreign: true,
      publicKey: peer.publicKey,
      apiVersion: '1_0',
      endPoint: 'http://chat-peer.invalid/api/',
    }).save()
    later = await DbCommunity.create({
      foreign: true,
      url: 'http://chat-later.invalid/api/',
      publicKey: randomBytes(32),
      communityUuid: laterUuid,
      authenticatedAt: new Date(),
      name: 'Chat later',
      description: 'speaks a newer api only',
      creationDate: new Date(),
      publicJwtKey: peerKeys.publicKey,
    }).save()
    laterEntry = await DbFederatedCommunity.create({
      foreign: true,
      publicKey: later.publicKey,
      apiVersion: '2_0',
      endPoint: 'http://chat-later.invalid/api/',
    }).save()
    await loginAs('bob@baumeister.de')
  })

  beforeEach(() => {
    commands = []
    inFlight = []
  })

  afterEach(() => {
    rawRequest?.mockRestore()
    rawRequest = undefined
  })

  afterAll(async () => {
    await DbFederatedCommunity.delete({ id: peerEntry.id })
    await DbFederatedCommunity.delete({ id: laterEntry.id })
    await DbCommunity.delete({ id: peer.id })
    await DbCommunity.delete({ id: later.id })
    resetToken()
  })

  it('sends the first message as a command that asks for nothing less than a mail, and hands back the copy DELIVERED', async () => {
    peerAnswers({ success: true })

    const copy = await said(peerRef, 'Across the border', 'NONE')

    expect(copy).toMatchObject({ mine: true, deliveryState: 'DELIVERED', notify: 'EMAIL' })
    // The first message is mailed over there: the command carries no wish at all.
    expect(commands).toEqual([
      {
        mailType: 'sendCustomEmail',
        senderComUuid: bob.communityUuid,
        senderGradidoId: bob.gradidoID,
        receiverComUuid: peerUuid,
        receiverGradidoId: peerMember,
        subject: '',
        memo: 'Across the border',
        messageUuid: copy.messageUuid,
      },
    ])
    // Written first, then delivered (E-019).
    expect(inFlight).toEqual(['pending'])
  })

  it('carries a wish for no mail in the command', async () => {
    peerAnswers({ success: true })

    const copy = await said(peerRef, 'No mail needed', 'NONE')

    expect(copy.notify).toBe('NONE')
    expect(commands).toHaveLength(1)
    expect(commands[0].notify).toBe('none')
    expect(commands[0].messageUuid).toBe(copy.messageUuid)
  })

  // E-019: a failed delivery is no error for the sender -- the copy says it, under the bubble.
  it('hands back the copy FAILED when the other community refuses it, without an error', async () => {
    peerAnswers({ success: false, error: 'Recipient user not found' })

    const res = await say(peerRef, 'Refused over there', 'EMAIL')

    expect(res.errors).toBeUndefined()
    const copy = res.data.sendChatMessage
    expect(copy).toMatchObject({ mine: true, deliveryState: 'FAILED', body: 'Refused over there' })
    expect(inFlight).toEqual(['pending'])
    // The row says the same.
    const filed = (await pageWith(peerRef)).messages.find((m: any) => m.id === copy.id)
    expect(filed.deliveryState).toBe('FAILED')
  })

  // No silent true (D V03, section 1): no way to deliver is an error, and nothing is filed.
  it('refuses a community that offers no V1_0 entry, and files and sends nothing', async () => {
    peerAnswers({ success: true })
    const before = await allMessages()

    const res = await say({ communityUuid: laterUuid, gradidoID: uuidv4() }, 'Hello?', 'EMAIL')

    expect(res.errors).toEqual([new GraphQLError('CHAT_MESSAGE_NOT_SENT: NO_WAY_TO_DELIVER')])
    expect(rawRequest).not.toHaveBeenCalled()
    expect(await allMessages()).toEqual(before)
  })

  // A community this server knows, before the two have exchanged keys: the command could not be
  // sealed, and that is the same refusal as any other missing way.
  it('refuses a community whose keys are not exchanged yet, and files and sends nothing', async () => {
    await DbCommunity.update({ id: peer.id }, { publicJwtKey: null })
    try {
      peerAnswers({ success: true })
      const before = await allMessages()

      const res = await say(peerRef, 'Before the keys', 'EMAIL')

      expect(res.errors).toEqual([new GraphQLError('CHAT_MESSAGE_NOT_SENT: NO_WAY_TO_DELIVER')])
      expect(rawRequest).not.toHaveBeenCalled()
      expect(await allMessages()).toEqual(before)
    } finally {
      await DbCommunity.update({ id: peer.id }, { publicJwtKey: peerKeys.publicKey })
    }
  })

  it('refuses a community it does not know, and files and sends nothing', async () => {
    peerAnswers({ success: true })
    const before = await allMessages()

    const res = await say({ communityUuid: uuidv4(), gradidoID: uuidv4() }, 'Hello?', 'EMAIL')

    expect(res.errors).toEqual([new GraphQLError('CHAT_MESSAGE_NOT_SENT: NO_WAY_TO_DELIVER')])
    expect(rawRequest).not.toHaveBeenCalled()
    expect(await allMessages()).toEqual(before)
  })
})

/**
 * P4a (E-017): what is new for a member since an id, the one query the wallet asks on its beat.
 * The messages of the blocks above stay filed, so each block below starts from the highest id
 * filed before it -- or from an account made for it, where the whole answer counts.
 */
describe('newChatMessagesSince', () => {
  type Update = {
    latestId: number
    unreadConversations: number
    hasMore: boolean
    messages: { id: number; body: string; mine: boolean }[]
  }

  /** What is new for whoever is logged in. */
  const update = async (
    variables: { afterId?: number | null; limit?: number } = {},
  ): Promise<Update> => {
    const res: any = await query({ query: newChatMessagesSince, variables })
    expect(res.errors).toBeUndefined()
    return res.data.newChatMessagesSince
  }

  const bodiesOf = (news: Update) => news.messages.map((message) => message.body)

  /** The highest id this server has filed so far. */
  const highestFiled = async () => Math.max(0, ...(await allMessages()).map((m) => m.id))

  describe('without a login', () => {
    beforeAll(() => resetToken())

    it('answers 401', async () => {
      expect(await query({ query: newChatMessagesSince, variables: { afterId: 0 } })).toEqual(
        expect.objectContaining({ errors: [new GraphQLError('401 Unauthorized')] }),
      )
    })
  })

  /**
   * bibi writes to bob and to peter, bob to raeuber, peter answers bibi. Each of them gets what
   * is new in their own conversations -- their own messages among it --, and a message between
   * two others reaches no third.
   */
  describe('across the conversations of each member', () => {
    let start: number

    const newsOf = async (email: string) => {
      await loginAs(email)
      return update({ afterId: start })
    }

    beforeAll(async () => {
      start = await highestFiled()
      await loginAs('bibi@bloxberg.de')
      await said(ref(bob), 'News for Bob.', 'NONE')
      await said(ref(peter), 'News for Peter.', 'NONE')
      await loginAs('bob@baumeister.de')
      await said(ref(raeuber), 'Between Bob and Räuber.', 'NONE')
      await loginAs('peter@lustig.de')
      await said(ref(bibi), 'Peter answers Bibi.', 'NONE')
    })
    afterAll(() => resetToken())

    it('hands bibi what is new in all her conversations, oldest first, her own messages among it', async () => {
      const news = await newsOf('bibi@bloxberg.de')

      expect(bodiesOf(news)).toEqual(['News for Bob.', 'News for Peter.', 'Peter answers Bibi.'])
      expect(news.messages.map((m) => m.mine)).toEqual([true, true, false])
      const ids = news.messages.map((m) => m.id)
      expect([...ids].sort((a, b) => a - b)).toEqual(ids)
      expect(news.hasMore).toBe(false)
      expect(news.latestId).toBe(ids[2])
    })

    it('hands bob and peter what is new in their own conversations only', async () => {
      expect(bodiesOf(await newsOf('bob@baumeister.de'))).toEqual([
        'News for Bob.',
        'Between Bob and Räuber.',
      ])
      expect(bodiesOf(await newsOf('peter@lustig.de'))).toEqual([
        'News for Peter.',
        'Peter answers Bibi.',
      ])
    })

    // ⛔ The guard against a leak: the query reaches every conversation of the caller, and only
    // those.
    it('hands a message between two others to no third', async () => {
      expect(bodiesOf(await newsOf('bibi@bloxberg.de'))).not.toContain('Between Bob and Räuber.')
      expect(bodiesOf(await newsOf('peter@lustig.de'))).not.toContain('Between Bob and Räuber.')
      expect(bodiesOf(await newsOf('raeuber@hotzenplotz.de'))).toEqual(['Between Bob and Räuber.'])
    })

    it('shows delivery and mail wish on the own messages only', async () => {
      const [own, , theirs] = (await newsOf('bibi@bloxberg.de')).messages
      expect(own).toMatchObject({ mine: true, deliveryState: 'DELIVERED', notify: 'NONE' })
      expect(theirs).toMatchObject({ mine: false, deliveryState: null, notify: null })
    })
  })

  /** Sixty messages from bibi to peter, and a cap of fifty. */
  describe('over the cap', () => {
    let start: number
    let sent: number[]

    beforeAll(async () => {
      start = await highestFiled()
      await loginAs('bibi@bloxberg.de')
      sent = []
      for (let n = 1; n <= 60; n++) {
        sent.push((await said(ref(peter), `Message ${n}`, 'NONE')).id)
      }
      await loginAs('peter@lustig.de')
    })
    afterAll(() => resetToken())

    // ⛔ latestId is the fiftieth, not the sixtieth: the wallet goes on from there, and with the
    // highest id it would never get the other ten.
    it('hands out fifty and names the fiftieth to go on from, and the other ten from there', async () => {
      const first = await update({ afterId: start, limit: 50 })
      expect(first.messages.map((m) => m.id)).toEqual(sent.slice(0, 50))
      expect(first.hasMore).toBe(true)
      expect(first.latestId).toBe(sent[49])

      const second = await update({ afterId: first.latestId, limit: 50 })
      expect(second.messages.map((m) => m.id)).toEqual(sent.slice(50))
      expect(second.hasMore).toBe(false)
      expect(second.latestId).toBe(sent[59])
    })

    it('hands out fifty when the caller names no number', async () => {
      const unnamed = await update({ afterId: start })
      expect(unnamed.messages).toHaveLength(50)
      expect(unnamed.hasMore).toBe(true)
    })

    it('refuses more than a hundred, none at all, and an id below zero', async () => {
      for (const variables of [
        { afterId: start, limit: 101 },
        { afterId: start, limit: 0 },
        { afterId: -1 },
      ]) {
        const res: any = await query({ query: newChatMessagesSince, variables })
        expect(res.errors?.[0]?.message).toContain('Argument Validation Error')
      }
    })
  })

  /**
   * The mark in the menu, for somebody who starts with no conversation at all: lena, made for
   * this block. bob writes to her twice, she writes to peter, peter answers her.
   */
  describe('the unread mark', () => {
    let lena: User

    const asLena = () => loginAs('lena@newchatmessages.de')

    beforeAll(async () => {
      lena = await userFactory(testEnv, {
        email: 'lena@newchatmessages.de',
        firstName: 'Lena',
        lastName: 'Liest',
        alias: 'lenaReads',
        emailChecked: true,
      })
    })
    afterAll(() => resetToken())

    it('says 0 and 0 to somebody without a conversation, and hands out nothing', async () => {
      await asLena()
      expect(await update()).toEqual({
        latestId: 0,
        unreadConversations: 0,
        hasMore: false,
        messages: [],
      })
    })

    it('counts two unread messages from bob as one, and names the highest id of her conversations', async () => {
      await loginAs('bob@baumeister.de')
      await said(ref(lena), 'Hello Lena.', 'NONE')
      const second = await said(ref(lena), 'Are you there?', 'NONE')
      await asLena()

      expect(await update()).toEqual({
        latestId: second.id,
        unreadConversations: 1,
        hasMore: false,
        messages: [],
      })
    })

    it('does not count her own messages', async () => {
      await asLena()
      const own = await said(ref(peter), 'Hello Peter.', 'NONE')

      expect(await update()).toMatchObject({ latestId: own.id, unreadConversations: 1 })
    })

    it('counts every conversation with something unread', async () => {
      await loginAs('peter@lustig.de')
      await said(ref(lena), 'Hello Lena, here is Peter.', 'NONE')
      await asLena()

      expect((await update()).unreadConversations).toBe(2)
    })

    // E-024: mute is about mail, not about seeing.
    it('counts a muted conversation like any other', async () => {
      await asLena()
      expect(await mute(ref(bob), true)).toBe(true)

      expect((await update()).unreadConversations).toBe(2)
    })

    it('counts a conversation no more once she has read it', async () => {
      await asLena()
      const withBob = (await pageWith(ref(bob))).messages
      expect(await markRead(bob, withBob[withBob.length - 1].id)).toBe(true)
      expect((await update()).unreadConversations).toBe(1)

      const withPeter = (await pageWith(ref(peter))).messages
      expect(await markRead(peter, withPeter[withPeter.length - 1].id)).toBe(true)
      expect((await update()).unreadConversations).toBe(0)
    })

    /** bob writes once more, and the message is marked deleted right in the database. */
    describe('with a message marked deleted', () => {
      let deletedId: number

      beforeAll(async () => {
        await loginAs('bob@baumeister.de')
        deletedId = (await said(ref(lena), 'Never mind.', 'NONE')).id
        await AppDatabase.getInstance()
          .getDrizzleDataSource()
          .update(chatMessagesTable)
          .set({ deletedAt: new Date() })
          .where(eq(chatMessagesTable.id, deletedId))
        await asLena()
      })

      it('does not hand it out', async () => {
        expect((await update({ afterId: deletedId - 1 })).messages).toEqual([])
      })

      it('does not count it as unread', async () => {
        expect((await update()).unreadConversations).toBe(0)
      })
    })
  })

  describe('asked under many names in one document', () => {
    beforeAll(() => loginAs('bibi@bloxberg.de'))
    afterAll(() => resetToken())

    // ⛔ `limit` caps one answer, not how often a document repeats the field under aliases --
    // that is what the request's budget counts (CHAT_UPDATES_MAX_PER_REQUEST).
    it('answers five in one request, and refuses the sixth', async () => {
      const updates = (count: number) =>
        `query { ${Array.from(
          { length: count },
          (_, n) => `update${n}: newChatMessagesSince { latestId }`,
        ).join(' ')} }`
      const five: any = await query({ query: updates(5) })
      expect(five.errors).toBeUndefined()
      expect(Object.keys(five.data)).toHaveLength(5)
      const six: any = await query({ query: updates(6) })
      expect(six.errors?.map((error: any) => error.message)).toEqual([
        'Too many chat updates requested at once',
      ])
    })
  })
})

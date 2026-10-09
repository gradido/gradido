// AI-GENERATED — not an architecture reference
import {
  ApolloServerTestClient,
  cleanDB,
  resetToken,
  TEST_PICTURE_BASE64,
  testEnvironment,
} from '@test/helpers'
import { getLogger } from 'config-schema/test/testSetup'
import { CONFIG as CORE_CONFIG } from 'core'
import { AppDatabase, chatMessagesTable, User } from 'database'
import { eq } from 'drizzle-orm'
import { GraphQLError } from 'graphql'
import { gql } from 'graphql-tag'
import { v4 as uuidv4 } from 'uuid'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { userFactory } from '@/seeds/factory/user'
import { editChatMessage, login } from '@/seeds/graphql/mutations'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { raeuberHotzenplotz } from '@/seeds/users/raeuber-hotzenplotz'

/*
 * An answer to one particular message (Bernd, 09.10.2026), against a database: sendChatMessage
 * with `replyTo`, and the quotation the thread hands out over the answer. What the check decides
 * and what a page is put together from are held without a database in util/chatReply.test.ts and
 * util/chatMessagesOf.test.ts; a group's answers in
 * ChatGroupResolver.sendChatGroupMessage.test.ts.
 */

// No mail has to go out: with mail switched off the mail functions answer null.
jest.mock('core', () => {
  const originalModule = jest.requireActual('core')
  return {
    __esModule: true,
    ...originalModule,
    sendCustomEmail: jest.fn(async () => ({ accepted: ['watched'] })),
  }
})

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)
CORE_CONFIG.EMAIL = false

const QUOTE_FIELDS = `
  id
  messageUuid
  mine
  body
  editedAt
  images {
    imageUuid
  }
  replyTo {
    id
    messageUuid
    mine
    excerpt
    hasImage
    sender {
      communityUuid
      gradidoID
    }
    senderUser {
      gradidoID
    }
  }
`
const sendChatMessage = gql`
  mutation (
    $ref: MemberAvatarRefInput!
    $body: String!
    $notify: ChatMessageNotify!
    $image: ChatImageInput
    $replyTo: String
  ) {
    sendChatMessage(ref: $ref, body: $body, notify: $notify, image: $image, replyTo: $replyTo) {
      ${QUOTE_FIELDS}
    }
  }
`
const chatMessagesWithMember = gql`
  query ($ref: MemberAvatarRefInput!) {
    chatMessagesWithMember(ref: $ref) {
      messages {
        ${QUOTE_FIELDS}
      }
    }
  }
`

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

type ChatRef = { communityUuid: string | null; gradidoID: string }
const ref = (member: User): ChatRef => ({
  communityUuid: member.communityUuid,
  gradidoID: member.gradidoID,
})

const loginAs = async (email: string): Promise<void> => {
  await mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })
}

/** Writes in the chat to `to`, as whoever is logged in -- answering `replyTo` where given. */
const say = (to: ChatRef, body: string, more: Record<string, unknown> = {}): Promise<any> =>
  mutate({ mutation: sendChatMessage, variables: { ref: to, body, notify: 'NONE', ...more } })

/** The same, where it must go through: the sender's own copy. */
const said = async (to: ChatRef, body: string, more: Record<string, unknown> = {}) => {
  const res = await say(to, body, more)
  expect(res.errors).toBeUndefined()
  return res.data.sendChatMessage
}

/** The thread of whoever is logged in with `to`, oldest first. */
const threadWith = async (to: ChatRef) => {
  const res: any = await query({ query: chatMessagesWithMember, variables: { ref: to } })
  expect(res.errors).toBeUndefined()
  return res.data.chatMessagesWithMember.messages
}

/** Every message this server has filed. */
const allMessages = () =>
  AppDatabase.getInstance().getDrizzleDataSource().select().from(chatMessagesTable)

const filed = async (messageUuid: string) => {
  const [row] = await AppDatabase.getInstance()
    .getDrizzleDataSource()
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.messageUuid, messageUuid))
  return row
}

const REFUSED = [new GraphQLError('CHAT_MESSAGE_NOT_SENT: UNKNOWN_REPLY')]

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

describe('sendChatMessage answering a message', () => {
  let question: any
  let answer: any

  beforeAll(async () => {
    await loginAs('peter@lustig.de')
    question = await said(ref(raeuber), 'Kommst Du am **Samstag**?')
  })
  afterAll(() => resetToken())

  it('quotes nothing over a message that answers none, and files it with none', async () => {
    expect(question.replyTo).toBeNull()
    expect((await filed(question.messageUuid)).replyToMessageUuid).toBeNull()
  })

  it('files the answer with the message it answers, and hands back the copy with the quotation', async () => {
    await loginAs('raeuber@hotzenplotz.de')

    answer = await said(ref(peter), 'Ja, gern!', { replyTo: question.messageUuid })

    expect(answer).toMatchObject({
      mine: true,
      body: 'Ja, gern!',
      replyTo: {
        id: question.id,
        messageUuid: question.messageUuid,
        // Peter wrote it, the Räuber reads it.
        mine: false,
        sender: ref(peter),
        // Raw, as the text of a message is.
        excerpt: 'Kommst Du am **Samstag**?',
        hasImage: false,
        // Between two members the thread knows both.
        senderUser: null,
      },
    })
    expect((await filed(answer.messageUuid)).replyToMessageUuid).toBe(question.messageUuid)
  })

  it('shows the quotation to the other member, as their own words', async () => {
    await loginAs('peter@lustig.de')

    const thread = await threadWith(ref(raeuber))

    expect(thread.map((message: any) => message.body)).toEqual([
      'Kommst Du am **Samstag**?',
      'Ja, gern!',
    ])
    expect(thread[0].replyTo).toBeNull()
    expect(thread[1].replyTo).toMatchObject({
      id: question.id,
      messageUuid: question.messageUuid,
      mine: true,
      excerpt: 'Kommst Du am **Samstag**?',
    })
  })

  // The answer is filed with the uuid as the answered message is filed, however it was named.
  it('takes the uuid in either case, and files it as the message is filed', async () => {
    await loginAs('peter@lustig.de')

    const copy = await said(ref(raeuber), 'Schön!', { replyTo: answer.messageUuid.toUpperCase() })

    expect(copy.replyTo.messageUuid).toBe(answer.messageUuid)
    expect((await filed(copy.messageUuid)).replyToMessageUuid).toBe(answer.messageUuid)
  })

  // Nothing of the quoted message is filed with the answer: it is read when the thread is.
  it('quotes a message changed since with its new text', async () => {
    await loginAs('peter@lustig.de')
    const changed: any = await mutate({
      mutation: editChatMessage,
      variables: { messageUuid: question.messageUuid, body: 'Kommst Du am Sonntag?' },
    })
    expect(changed.errors).toBeUndefined()

    const thread = await threadWith(ref(raeuber))

    expect(thread[1].replyTo.excerpt).toBe('Kommst Du am Sonntag?')
  })

  // Only the text of an answer changes when it is changed: what it answers stays.
  it('keeps the quotation over an answer that was changed', async () => {
    await loginAs('raeuber@hotzenplotz.de')
    const changed: any = await mutate({
      mutation: editChatMessage,
      variables: { messageUuid: answer.messageUuid, body: 'Ja, sehr gern!' },
    })
    expect(changed.errors).toBeUndefined()

    const thread = await threadWith(ref(peter))

    expect(thread[1]).toMatchObject({
      body: 'Ja, sehr gern!',
      replyTo: { messageUuid: question.messageUuid },
    })
    expect((await filed(answer.messageUuid)).replyToMessageUuid).toBe(question.messageUuid)
  })

  it('says that a quoted message carries a picture, and quotes its caption', async () => {
    await loginAs('peter@lustig.de')
    const picture = await said(ref(raeuber), 'Unser Garten', {
      image: { data: TEST_PICTURE_BASE64, width: 800, height: 600 },
    })
    expect(picture.images).toHaveLength(1)

    const copy = await said(ref(raeuber), 'Im Mai aufgenommen.', { replyTo: picture.messageUuid })

    expect(copy.replyTo).toMatchObject({ excerpt: 'Unser Garten', hasImage: true, mine: true })
    // The answer itself carries none.
    expect(copy.images).toEqual([])
  })

  it('carries the beginning of a long message, not all of it', async () => {
    await loginAs('peter@lustig.de')
    const long = await said(ref(raeuber), 'x'.repeat(1500))

    const copy = await said(ref(raeuber), 'Kurz gesagt?', { replyTo: long.messageUuid })

    expect(copy.replyTo.excerpt).toBe('x'.repeat(200))
  })
})

describe('sendChatMessage answering a message, refused', () => {
  let toRaeuber: any
  let toBibi: any

  beforeAll(async () => {
    await loginAs('peter@lustig.de')
    toRaeuber = await said(ref(raeuber), 'Für den Räuber.')
    toBibi = await said(ref(bibi), 'Für Bibi.')
  })
  afterAll(() => resetToken())

  const refusedWith = async (to: ChatRef, replyTo: string) => {
    const before = await allMessages()
    const res = await say(to, 'Eine Antwort', { replyTo })
    expect(await allMessages()).toEqual(before)
    return res.errors
  }

  it('a message nobody filed, filing nothing', async () => {
    expect(await refusedWith(ref(raeuber), uuidv4())).toEqual(REFUSED)
  })

  // ⛔ Peter can read his message to Bibi -- the Räuber cannot, and it is not quoted to him.
  it('a message of another conversation of the sender, filing nothing', async () => {
    expect(await refusedWith(ref(raeuber), toBibi.messageUuid)).toEqual(REFUSED)
    expect(await refusedWith(ref(bibi), toRaeuber.messageUuid)).toEqual(REFUSED)
  })

  // The Räuber is in no conversation with Bibi's message in it: unknown to him, as one never filed.
  it('a message of a conversation the sender is not in, filing nothing', async () => {
    await loginAs('raeuber@hotzenplotz.de')

    expect(await refusedWith(ref(peter), toBibi.messageUuid)).toEqual(REFUSED)

    await loginAs('peter@lustig.de')
  })

  // Peter and Bob have not written each other: there is nothing to answer yet.
  it('an answer to a member there is no conversation with yet, filing nothing', async () => {
    expect(await refusedWith(ref(bob), toRaeuber.messageUuid)).toEqual(REFUSED)
  })

  it('a message marked deleted, filing nothing', async () => {
    const gone = await said(ref(raeuber), 'Bald gelöscht.')
    await AppDatabase.getInstance()
      .getDrizzleDataSource()
      .update(chatMessagesTable)
      .set({ deletedAt: new Date() })
      .where(eq(chatMessagesTable.messageUuid, gone.messageUuid))

    expect(await refusedWith(ref(raeuber), gone.messageUuid)).toEqual(REFUSED)
  })

  it('what is no uuid, before anything is looked up', async () => {
    const before = await allMessages()
    const res = await say(ref(raeuber), 'Eine Antwort', { replyTo: 'the first one' })
    expect(res.errors?.[0]?.message).toContain('Argument Validation Error')
    expect(await allMessages()).toEqual(before)
  })

  // Gegenprobe: the same message in its own conversation is answered.
  it('none of this where the message lies in the conversation the answer goes into', async () => {
    const copy = await said(ref(raeuber), 'Eine Antwort', { replyTo: toRaeuber.messageUuid })
    expect(copy.replyTo.messageUuid).toBe(toRaeuber.messageUuid)
  })
})

/** A quoted message that is gone since: the answer stands, without a quotation. */
describe('an answer whose message was deleted since', () => {
  afterAll(() => resetToken())

  it('is handed out without a quotation, and with its own words', async () => {
    await loginAs('peter@lustig.de')
    const first = await said(ref(raeuber), 'Das hier verschwindet.')
    const answer = await said(ref(raeuber), 'Und das bleibt.', { replyTo: first.messageUuid })
    expect(answer.replyTo).not.toBeNull()
    await AppDatabase.getInstance()
      .getDrizzleDataSource()
      .update(chatMessagesTable)
      .set({ deletedAt: new Date() })
      .where(eq(chatMessagesTable.messageUuid, first.messageUuid))

    const thread = await threadWith(ref(raeuber))

    const shown = thread.find((message: any) => message.messageUuid === answer.messageUuid)
    expect(shown).toMatchObject({ body: 'Und das bleibt.', replyTo: null })
    expect(JSON.stringify(thread)).not.toContain('Das hier verschwindet.')
  })
})

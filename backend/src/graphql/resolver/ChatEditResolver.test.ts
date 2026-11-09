// AI-GENERATED — not an architecture reference
import { randomBytes } from 'node:crypto'
import {
  ApolloServerTestClient,
  cleanDB,
  resetToken,
  TEST_PICTURE_BASE64,
  testEnvironment,
} from '@test/helpers'
import { getLogger } from 'config-schema/test/testSetup'
import {
  ApiClient,
  CONFIG as CORE_CONFIG,
  EditChatMessageWire,
  sendCustomEmail,
  storeChatMessage,
} from 'core'
import {
  AppDatabase,
  chatMessagesTable,
  Community as DbCommunity,
  User as DbUser,
  UserContact as DbUserContact,
  User,
} from 'database'
import { eq } from 'drizzle-orm'
import { GraphQLError } from 'graphql'
import { MESSAGE_MAX_CHARS } from 'shared'
import { v4 as uuidv4 } from 'uuid'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { userFactory } from '@/seeds/factory/user'
import { editChatMessage, login, sendChatMessage } from '@/seeds/graphql/mutations'
import { chatMessagesWithMember, newChatMessagesAndEditsSince } from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { garrickOllivander } from '@/seeds/users/garrick-ollivander'
import { peterLustig } from '@/seeds/users/peter-lustig'

/**
 * Changing a message (E-060), through the whole server and against a database: a member changes
 * what they wrote, the thread shows the new text to both, and the other member's beat hands the
 * change out -- by the database's clock, with room to spare. What the resolver decides itself is
 * held in ChatEditResolver.editChatMessage.test.ts, where each answer of the database can be
 * brought about.
 */
// The mail is watched, to see that a change sends none. Nothing is sent either way.
jest.mock('core', () => {
  const originalModule = jest.requireActual('core')
  return {
    __esModule: true,
    ...originalModule,
    sendCustomEmail: jest.fn(async () => ({ accepted: ['watched'] })),
  }
})
const mail = sendCustomEmail as jest.Mock

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)
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

type ChatRef = { communityUuid: string; gradidoID: string }
type ChatPicture = { data: string; width: number; height: number }
type Edits = {
  latestId: number
  messages: { id: number; body: string; editedAt: string | null }[]
  edited: { id: number; messageUuid: string; mine: boolean; body: string; editedAt: string }[]
  editedCursor: string
}

const ref = (member: User): ChatRef => ({
  communityUuid: member.communityUuid,
  gradidoID: member.gradidoID,
})

const loginAs = async (email: string): Promise<void> => {
  await mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })
}

// A picture that decodes (test/helpers.ts): the server encodes what it is sent again.
const JPEG: ChatPicture = { data: TEST_PICTURE_BASE64, width: 800, height: 600 }

/** Writes in the chat to `to`, as whoever is logged in: the sender's own copy. */
const said = async (to: ChatRef, body: string, image?: ChatPicture) => {
  const res: any = await mutate({
    mutation: sendChatMessage,
    variables: { ref: to, body, notify: 'NONE', ...(image ? { image } : {}) },
  })
  expect(res.errors).toBeUndefined()
  return res.data.sendChatMessage
}

/** Changes a message, as whoever is logged in. */
const edit = (messageUuid: string, body: string): Promise<any> =>
  mutate({ mutation: editChatMessage, variables: { messageUuid, body } })

/** The same, where it must go through: the caller's copy as it stands then. */
const edited = async (messageUuid: string, body: string) => {
  const res = await edit(messageUuid, body)
  expect(res.errors).toBeUndefined()
  return res.data.editChatMessage
}

/** The beat of whoever is logged in. */
const beat = async (
  variables: { afterId?: number | null; editedCursor?: string | null } = {},
): Promise<Edits> => {
  const res: any = await query({ query: newChatMessagesAndEditsSince, variables })
  expect(res.errors).toBeUndefined()
  return res.data.newChatMessagesSince
}

/** The thread of whoever is logged in with `member`. */
const threadWith = async (member: User) => {
  const res: any = await query({ query: chatMessagesWithMember, variables: { ref: ref(member) } })
  expect(res.errors).toBeUndefined()
  return res.data.chatMessagesWithMember.messages as { messageUuid: string; body: string }[]
}

const drizzle = () => AppDatabase.getInstance().getDrizzleDataSource()

/** The row of a message, as this server has it filed. */
const rowOf = async (messageUuid: string) => {
  const [row] = await drizzle()
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.messageUuid, messageUuid))
  return row
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

describe('editChatMessage without a login', () => {
  beforeAll(() => resetToken())

  it('answers 401', async () => {
    expect((await edit(uuidv4(), 'Anything.')).errors).toEqual([
      new GraphQLError('401 Unauthorized'),
    ])
  })
})

/**
 * bibi writes to bob, bob answers. bob's wallet stands where its first beat put it; then bibi
 * changes her message.
 */
describe('a message changed by its writer', () => {
  let bibis: { id: number; messageUuid: string; createdAt: string }
  let bobs: { id: number; messageUuid: string }
  // Where bob's and peter's wallets stood before the change.
  let bobStood: Edits
  let peterStood: Edits
  let changed: { id: number; messageUuid: string; body: string; editedAt: string; mine: boolean }

  beforeAll(async () => {
    await loginAs('bibi@bloxberg.de')
    bibis = await said(ref(bob), 'Shall we meet at ten?')
    await loginAs('bob@baumeister.de')
    bobs = await said(ref(bibi), 'Ten is fine.')
    bobStood = await beat()
    await loginAs('peter@lustig.de')
    peterStood = await beat()

    mail.mockClear()
    await loginAs('bibi@bloxberg.de')
    changed = await edited(bibis.messageUuid, 'Shall we meet at eleven?')
  })
  afterAll(() => resetToken())

  it('hands the writer her copy with the new text and the moment of the change', () => {
    expect(changed).toMatchObject({
      id: bibis.id,
      messageUuid: bibis.messageUuid,
      mine: true,
      subject: null,
      body: 'Shall we meet at eleven?',
      createdAt: bibis.createdAt,
    })
    expect(Date.parse(changed.editedAt)).toBeGreaterThanOrEqual(Date.parse(bibis.createdAt))
  })

  it('files the new text on the one row, and keeps no earlier one', async () => {
    const row = await rowOf(bibis.messageUuid)
    expect(row).toMatchObject({ id: bibis.id, body: 'Shall we meet at eleven?' })
    expect(row.editedAt?.toISOString()).toBe(changed.editedAt)
    const all = await drizzle().select().from(chatMessagesTable)
    expect(all.map((message) => message.body).sort()).toEqual([
      'Shall we meet at eleven?',
      'Ten is fine.',
    ])
  })

  it('sends no mail about the change', () => {
    expect(mail).not.toHaveBeenCalled()
  })

  it('shows the new text in the thread, to both of them', async () => {
    expect((await threadWith(bob)).map((message) => message.body)).toEqual([
      'Shall we meet at eleven?',
      'Ten is fine.',
    ])
    await loginAs('bob@baumeister.de')
    expect((await threadWith(bibi)).map((message) => message.body)).toEqual([
      'Shall we meet at eleven?',
      'Ten is fine.',
    ])
  })

  describe("on the other member's beat", () => {
    beforeAll(() => loginAs('bob@baumeister.de'))

    it('comes as a changed message, not as a new one', async () => {
      const update = await beat({ afterId: bobStood.latestId, editedCursor: bobStood.editedCursor })

      expect(update.messages).toEqual([])
      expect(update.edited).toEqual([
        {
          id: bibis.id,
          messageUuid: bibis.messageUuid,
          mine: false,
          body: 'Shall we meet at eleven?',
          editedAt: changed.editedAt,
        },
      ])
      expect(update.latestId).toBe(bobs.id)
    })

    // The place handed on lies behind the clock: a change of the last seconds comes once more,
    // the same message with the same text -- and one committed a moment late is not passed over.
    it('comes once more with the cursor the answer hands on', async () => {
      const first = await beat({ editedCursor: bobStood.editedCursor })
      const [moment, id] = first.editedCursor.split('-').map(Number)
      expect(moment).toBeLessThan(Date.parse(changed.editedAt))
      expect(id).toBe(0)

      const second = await beat({ editedCursor: first.editedCursor })
      expect(second.edited.map((message) => message.id)).toEqual([bibis.id])
    })

    it('does not come after itself, nor without a cursor, and what is no cursor is refused', async () => {
      const afterIt = `${Date.parse(changed.editedAt)}-${bibis.id}`
      expect((await beat({ editedCursor: afterIt })).edited).toEqual([])
      // The same moment, before every message of it: there it is again.
      const itsMoment = `${Date.parse(changed.editedAt)}-0`
      expect((await beat({ editedCursor: itsMoment })).edited).toHaveLength(1)
      expect((await beat()).edited).toEqual([])

      const res: any = await query({
        query: newChatMessagesAndEditsSince,
        variables: { editedCursor: changed.editedAt },
      })
      expect(res.errors?.[0]?.message).toContain('Argument Validation Error')
    })

    it('carries the moment of the change on a message handed out as new as well', async () => {
      const update = await beat({ afterId: 0 })
      expect(update.messages).toEqual([
        { id: bibis.id, body: 'Shall we meet at eleven?', editedAt: changed.editedAt },
        { id: bobs.id, body: 'Ten is fine.', editedAt: null },
      ])
    })
  })

  // Another device or tab of the writer's learns of it the same way.
  it("comes on the writer's own beat as well, as hers", async () => {
    await loginAs('bibi@bloxberg.de')
    const update = await beat({ editedCursor: bobStood.editedCursor })
    expect(update.edited).toEqual([expect.objectContaining({ id: bibis.id, mine: true })])
  })

  it('reaches nobody who is not in the conversation', async () => {
    await loginAs('peter@lustig.de')
    expect((await beat({ editedCursor: peterStood.editedCursor })).edited).toEqual([])
  })

  describe('changed again', () => {
    it('moves the moment, and the same text once more changes nothing', async () => {
      await loginAs('bibi@bloxberg.de')
      const again = await edited(bibis.messageUuid, 'Shall we meet at twelve?')
      expect(again.body).toBe('Shall we meet at twelve?')
      expect(Date.parse(again.editedAt)).toBeGreaterThanOrEqual(Date.parse(changed.editedAt))

      const same = await edited(bibis.messageUuid, 'Shall we meet at twelve?')
      expect(same).toEqual(again)
      expect((await rowOf(bibis.messageUuid)).editedAt?.toISOString()).toBe(again.editedAt)
    })
  })
})

describe('editChatMessage refused', () => {
  let bibis: { id: number; messageUuid: string }

  const unchanged = async (messageUuid: string, attempt: () => Promise<any>, reason: string) => {
    const before = await rowOf(messageUuid)
    expect((await attempt()).errors).toEqual([new GraphQLError(reason)])
    expect(await rowOf(messageUuid)).toEqual(before)
  }

  beforeAll(async () => {
    await loginAs('bibi@bloxberg.de')
    bibis = await said(ref(bob), 'Mine to change, and nobody else’s.')
  })
  afterAll(() => resetToken())

  it("for the other member of the conversation: somebody else's message", async () => {
    await loginAs('bob@baumeister.de')
    await unchanged(
      bibis.messageUuid,
      () => edit(bibis.messageUuid, 'Bob was here.'),
      'CHAT_MESSAGE_NOT_EDITED: NOT_OWN',
    )
  })

  // Who is not in the conversation learns nothing of the message, not even that it is there.
  it('for somebody who is not in the conversation, as for a uuid without a message', async () => {
    await loginAs('peter@lustig.de')
    await unchanged(
      bibis.messageUuid,
      () => edit(bibis.messageUuid, 'Peter was here.'),
      'CHAT_MESSAGE_NOT_EDITED: UNKNOWN_MESSAGE',
    )
    expect((await edit(uuidv4(), 'Nothing there.')).errors).toEqual([
      new GraphQLError('CHAT_MESSAGE_NOT_EDITED: UNKNOWN_MESSAGE'),
    ])
  })

  describe('for its writer', () => {
    beforeAll(() => loginAs('bibi@bloxberg.de'))

    it('with no text, where the message carries no picture', async () => {
      await unchanged(
        bibis.messageUuid,
        () => edit(bibis.messageUuid, ''),
        'CHAT_MESSAGE_NOT_EDITED: EMPTY',
      )
    })

    it('with a text longer than a message may be, and with what is no uuid', async () => {
      const tooLong = await edit(bibis.messageUuid, 'x'.repeat(MESSAGE_MAX_CHARS + 1))
      expect(tooLong.errors?.[0]?.message).toContain('Argument Validation Error')
      const noUuid = await edit('5', 'Which one?')
      expect(noUuid.errors?.[0]?.message).toContain('Argument Validation Error')
    })

    // E-059: the words of a forwarded copy are somebody else's.
    it('for a forwarded copy', async () => {
      const copy = await said(ref(bob), 'Peter wrote this first.')
      await drizzle()
        .update(chatMessagesTable)
        .set({
          forwardedFromCommunityUuid: peter.communityUuid,
          forwardedFromGradidoId: peter.gradidoID,
        })
        .where(eq(chatMessagesTable.messageUuid, copy.messageUuid))

      await unchanged(
        copy.messageUuid,
        () => edit(copy.messageUuid, 'My own words now.'),
        'CHAT_MESSAGE_NOT_EDITED: FORWARDED',
      )
    })

    it('for a message marked deleted', async () => {
      const gone = await said(ref(bob), 'Deleted later.')
      await drizzle()
        .update(chatMessagesTable)
        .set({ deletedAt: new Date() })
        .where(eq(chatMessagesTable.messageUuid, gone.messageUuid))

      await unchanged(
        gone.messageUuid,
        () => edit(gone.messageUuid, 'Back again.'),
        'CHAT_MESSAGE_NOT_EDITED: UNKNOWN_MESSAGE',
      )
    })

    // A delivered message to a community this server has no entry and no keys for: there is no
    // way to carry the change there, so nothing is changed here either.
    it('for a delivered message to a community there is no way to deliver to', async () => {
      const across = await storeChatMessage(
        {
          messageUuid: uuidv4(),
          sender: { communityUuid: bibi.communityUuid, gradidoId: bibi.gradidoID },
          recipient: { communityUuid: uuidv4(), gradidoId: uuidv4() },
          subject: null,
          body: 'Across the border.',
          notify: 'none',
          deliveryState: 'delivered',
        },
        'outgoing',
      )
      if (!across) {
        throw new Error('fixture: the message across the border was not filed')
      }

      await unchanged(
        across.messageUuid,
        () => edit(across.messageUuid, 'Changed on this side only.'),
        'CHAT_MESSAGE_NOT_EDITED: NO_WAY_TO_DELIVER',
      )
    })
  })
})

/**
 * To a member of another community (E-060): their server holds a copy of its own. The change
 * goes there first, over its own route, and this server's copy is changed only once the other
 * server has answered that its own is. The stand-in for the other community is its route:
 * ApiClient answers as Eden hands on what the other server said -- as in the sendChatMessage
 * cases of ChatResolver.test.ts.
 */
describe('editChatMessage to a member of another community', () => {
  const peerUuid = uuidv4()
  const peerMember = uuidv4()
  const peerRef = { communityUuid: peerUuid, gradidoID: peerMember }

  type Answer = { data?: unknown; error?: { status: number; value: string } }
  let peer: DbCommunity
  let sendSpy: jest.SpyInstance | undefined
  let editSpy: jest.SpyInstance | undefined
  // Each change the other server got.
  let edits: EditChatMessageWire[] = []
  // What this server had filed as the text of the message while each change was on its way.
  let inFlight: (string | undefined)[] = []

  const answering = ({ data, error }: Answer) => ({ data: data ?? null, error: error ?? null })
  /** The other server answers each message with `toMessage`, each change with `toEdit`. */
  const peerAnswers = (toEdit: Answer, toMessage: Answer = { data: { mailState: null } }) => {
    sendSpy = jest
      .spyOn(ApiClient.prototype, 'chatMessage')
      .mockImplementation((async () => answering(toMessage)) as any)
    editSpy = jest.spyOn(ApiClient.prototype, 'editChatMessage').mockImplementation((async (
      edit: EditChatMessageWire,
    ) => {
      edits.push(edit)
      inFlight.push((await rowOf(edit.messageUuid))?.body)
      return answering(toEdit)
    }) as any)
  }
  const restore = () => {
    sendSpy?.mockRestore()
    editSpy?.mockRestore()
    sendSpy = editSpy = undefined
  }

  /** A message of bob's that reached the other server. */
  const delivered = async (body: string) => {
    peerAnswers({ error: { status: 500, value: 'not expected here' } })
    const copy = await said(peerRef, body)
    restore()
    edits = []
    inFlight = []
    return copy as { id: number; messageUuid: string }
  }

  beforeAll(async () => {
    peer = await DbCommunity.create({
      foreign: true,
      url: 'http://chat-peer.invalid/api/',
      publicEncryptionKey: randomBytes(32),
      publicKey: randomBytes(32),
      communityUuid: peerUuid,
      authenticatedAt: new Date(),
      name: 'Chat peer',
      description: 'the other side of the border',
      creationDate: new Date(),
    }).save()
    await loginAs('bob@baumeister.de')
  })

  beforeEach(() => {
    edits = []
    inFlight = []
  })

  afterEach(restore)

  afterAll(async () => {
    await DbCommunity.delete({ id: peer.id })
    resetToken()
  })

  it('sends the change over its own route, and changes its own copy once the other server has', async () => {
    const sent = await delivered('Across the border.')
    peerAnswers({ data: true })

    const copy = await edited(sent.messageUuid, 'Across the border, changed.')

    expect(edits).toEqual([
      {
        writer: { communityUuid: bob.communityUuid, gradidoId: bob.gradidoID },
        messageUuid: sent.messageUuid,
        body: 'Across the border, changed.',
      },
    ])
    // ⛔ First there, then here: while the change was on its way, this server's copy still
    // had the words it had.
    expect(inFlight).toEqual(['Across the border.'])
    expect(copy).toMatchObject({ id: sent.id, mine: true, body: 'Across the border, changed.' })
    expect(copy.editedAt).not.toBeNull()
    expect((await rowOf(sent.messageUuid)).body).toBe('Across the border, changed.')
  })

  describe('changes nothing, on either side,', () => {
    let sent: { id: number; messageUuid: string }

    const refusedUnchanged = async (reason: string) => {
      const before = await rowOf(sent.messageUuid)
      expect((await edit(sent.messageUuid, 'Never to be read.')).errors).toEqual([
        new GraphQLError(reason),
      ])
      expect(await rowOf(sent.messageUuid)).toEqual(before)
    }

    beforeAll(async () => {
      sent = await delivered('To stay as it is.')
    })

    // A server from before the route: it answers 404.
    it('where the other server does not know the route yet', async () => {
      peerAnswers({ error: { status: 404, value: 'NOT_FOUND' } })
      await refusedUnchanged('CHAT_MESSAGE_NOT_EDITED: NOT_CONFIRMED')
      expect(edits).toHaveLength(1)
    })

    it('where the other server refuses', async () => {
      peerAnswers({ error: { status: 404, value: 'CHAT_MESSAGE_NOT_EDITED: UNKNOWN_MESSAGE' } })
      await refusedUnchanged('CHAT_MESSAGE_NOT_EDITED: NOT_CONFIRMED')
    })

    // Eden hands a fetch that fails on as a 503.
    it('where the other server cannot be reached', async () => {
      peerAnswers({ error: { status: 503, value: 'connect ECONNREFUSED' } })
      await refusedUnchanged('CHAT_MESSAGE_NOT_EDITED: NOT_CONFIRMED')
    })

    // Changed here alone, it would arrive over there a moment later with the words it had.
    it('for a message that is still on its way, without asking the other server', async () => {
      await drizzle()
        .update(chatMessagesTable)
        .set({ deliveryState: 'pending' })
        .where(eq(chatMessagesTable.messageUuid, sent.messageUuid))
      peerAnswers({ data: true })

      await refusedUnchanged('CHAT_MESSAGE_NOT_EDITED: PENDING')
      expect(edits).toEqual([])
    })

    it('and writes none of the texts into the log', () => {
      const logged = JSON.stringify((logger.error as jest.Mock).mock.calls)
      expect(logged).toContain('CHAT_MESSAGE_NOT_EDITED: NOT_CONFIRMED')
      expect(logged).toContain(sent.messageUuid)
      expect(logged).not.toContain('Never to be read.')
      expect(logged).not.toContain('To stay as it is.')
    })
  })

  // E-019: a message that never reached the other server has no copy over there.
  it('changes a message that never reached the other server here alone, and sends nothing', async () => {
    peerAnswers({ data: true }, { error: { status: 503, value: 'the other side is down' } })
    const failed = await said(peerRef, 'Never arrived.')
    expect(failed.deliveryState).toBe('FAILED')

    const copy = await edited(failed.messageUuid, 'Never arrived, and changed.')

    expect(edits).toEqual([])
    expect(copy.body).toBe('Never arrived, and changed.')
    expect((await rowOf(failed.messageUuid)).deliveryState).toBe('failed')
  })
})

// E-044: a picture without a caption is a message -- so its caption may go.
describe('the caption of a picture', () => {
  beforeAll(() => loginAs('bibi@bloxberg.de'))
  afterAll(() => resetToken())

  it('is changed, and emptied, while the picture stays', async () => {
    const withPicture = await said(ref(bob), 'The yard on Sunday.', JPEG)
    expect(withPicture.images).toHaveLength(1)

    const renamed = await edited(withPicture.messageUuid, 'The yard on Saturday.')
    expect(renamed.body).toBe('The yard on Saturday.')
    expect(renamed.images).toEqual(withPicture.images)

    const bare = await edited(withPicture.messageUuid, '')
    expect(bare.body).toBe('')
    expect(bare.images).toEqual(withPicture.images)
    expect(bare.editedAt).not.toBeNull()
  })
})

// Behind SEND_CHAT_MESSAGE: an account that may not write may not rewrite either.
describe('an unconfirmed account past its grace period', () => {
  let garrick: DbUser
  let garricks: { messageUuid: string }

  beforeAll(async () => {
    // Confirmed so that a password exists and a message can be written, then unconfirmed and
    // two days old.
    garrick = await userFactory(testEnv, { ...garrickOllivander, emailChecked: true })
    await loginAs('garrick@ollivander.com')
    garricks = await said(ref(peter), 'Thank you.')
    await DbUser.update(
      { id: garrick.id },
      { createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    )
    await DbUserContact.update({ id: garrick.emailId ?? 0 }, { emailChecked: false })
    await loginAs('garrick@ollivander.com')
  })
  afterAll(() => resetToken())

  it('may not change what it wrote, and nothing is written', async () => {
    const before = await rowOf(garricks.messageUuid)
    expect((await edit(garricks.messageUuid, 'Thank you very much.')).errors).toEqual([
      new GraphQLError('401 Unauthorized'),
    ])
    expect(await rowOf(garricks.messageUuid)).toEqual(before)
  })
})

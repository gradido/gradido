// AI-GENERATED — not an architecture reference
import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import {
  CONFIG as CORE_CONFIG,
  sendChatGroupAddedEmail,
  sendChatGroupMessageEmail,
  sendCustomEmail,
} from 'core'
import {
  AppDatabase,
  chatConversationsTable,
  chatMessagesTable,
  User as DbUser,
  UserContact as DbUserContact,
  User,
} from 'database'
import { GraphQLError } from 'graphql'
import { gql } from 'graphql-tag'
import { v4 as uuidv4 } from 'uuid'
import { CONFIG } from '@/config'
import { userFactory } from '@/seeds/factory/user'
import {
  createChatGroup,
  login,
  markChatGroupRead,
  sendChatGroupMessage,
  sendChatMessage,
  setChatGroupMuted,
} from '@/seeds/graphql/mutations'
import {
  chatGroupMembers,
  chatGroupMessages,
  chatGroups,
  chatMessageImage,
  contactList,
} from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { garrickOllivander } from '@/seeds/users/garrick-ollivander'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { raeuberHotzenplotz } from '@/seeds/users/raeuber-hotzenplotz'

jest.mock('@/password/EncryptorUtils')
// The mails are watched, to see who is mailed about what, and answer as mails that went out.
// Nothing is sent either way.
jest.mock('core', () => {
  const originalModule = jest.requireActual('core')
  return {
    __esModule: true,
    ...originalModule,
    sendCustomEmail: jest.fn(async () => ({ accepted: ['watched'] })),
    sendChatGroupAddedEmail: jest.fn(async () => ({ accepted: ['watched'] })),
    sendChatGroupMessageEmail: jest.fn(async () => ({ accepted: ['watched'] })),
  }
})

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
let ottilie: User

type ChatRef = { communityUuid: string | null; gradidoID: string }
const ref = (member: User): ChatRef => ({
  communityUuid: member.communityUuid,
  gradidoID: member.gradidoID,
})

const loginAs = async (email: string): Promise<void> => {
  await mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })
}

/** Waits for what a request does not wait for: the mails it started. */
const mailsSent = async (): Promise<void> => {
  for (let turn = 0; turn < 5; turn++) {
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
}

const addedMails = () => (sendChatGroupAddedEmail as jest.Mock).mock.calls.map(([data]) => data)
const announcements = () =>
  (sendChatGroupMessageEmail as jest.Mock).mock.calls.map(([data]) => data)
const clearMails = () => {
  ;(sendChatGroupAddedEmail as jest.Mock).mockClear()
  ;(sendChatGroupMessageEmail as jest.Mock).mockClear()
  ;(sendCustomEmail as jest.Mock).mockClear()
}

const open = (title: string, members: ChatRef[]): Promise<any> =>
  mutate({ mutation: createChatGroup, variables: { title, members } })

const opened = async (title: string, members: ChatRef[]) => {
  const res = await open(title, members)
  expect(res.errors).toBeUndefined()
  return res.data.createChatGroup
}

type ChatPicture = { data: string; width: number; height: number }

const write = (
  groupUuid: string,
  body: string,
  announce: boolean,
  image?: ChatPicture,
): Promise<any> =>
  mutate({
    mutation: sendChatGroupMessage,
    variables: { groupUuid, body, announce, ...(image ? { image } : {}) },
  })

const wrote = async (groupUuid: string, body: string, announce: boolean, image?: ChatPicture) => {
  const res = await write(groupUuid, body, announce, image)
  expect(res.errors).toBeUndefined()
  return res.data.sendChatGroupMessage
}

const groupsOfCaller = async () => {
  const res: any = await query({ query: chatGroups })
  expect(res.errors).toBeUndefined()
  return res.data.chatGroups
}

const membersOf = (groupUuid: string): Promise<any> =>
  query({ query: chatGroupMembers, variables: { groupUuid } })

const pageOf = async (groupUuid: string, page: { before?: number; limit?: number } = {}) => {
  const res: any = await query({ query: chatGroupMessages, variables: { groupUuid, ...page } })
  expect(res.errors).toBeUndefined()
  return res.data.chatGroupMessages
}

const mute = async (groupUuid: string, muted: boolean) => {
  const res: any = await mutate({ mutation: setChatGroupMuted, variables: { groupUuid, muted } })
  expect(res.errors).toBeUndefined()
  return res.data.setChatGroupMuted
}

const markRead = async (groupUuid: string, upToMessageId: number) => {
  const res: any = await mutate({
    mutation: markChatGroupRead,
    variables: { groupUuid, upToMessageId },
  })
  expect(res.errors).toBeUndefined()
  return res.data.markChatGroupRead
}

/** Every message and every conversation this server has filed. */
const allMessages = () =>
  AppDatabase.getInstance().getDrizzleDataSource().select().from(chatMessagesTable)
const allConversations = () =>
  AppDatabase.getInstance().getDrizzleDataSource().select().from(chatConversationsTable)

// The smallest thing the server takes as a JPEG: the start marker, a few bytes, the end marker.
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0xff, 0xd9])
const picture: ChatPicture = { data: JPEG.toString('base64'), width: 800, height: 600 }

/** The group Bibi opens with Bob and Peter -- the one most tests below write in. */
let cafe: any

beforeAll(async () => {
  testEnv = await testEnvironment()
  mutate = testEnv.mutate
  query = testEnv.query
  await cleanDB()
  bibi = await userFactory(testEnv, bibiBloxberg)
  bob = await userFactory(testEnv, bobBaumeister)
  peter = await userFactory(testEnv, peterLustig)
  raeuber = await userFactory(testEnv, raeuberHotzenplotz)
  ottilie = await userFactory(testEnv, {
    email: 'ottilie@example.org',
    firstName: 'Ottilie',
    lastName: 'Gone',
    emailChecked: true,
    language: 'de',
  })
  // Bibi's contacts: the people she wrote to (KF-012). Räuber is none of hers.
  await loginAs('bibi@bloxberg.de')
  for (const member of [bob, peter, ottilie]) {
    const res: any = await mutate({
      mutation: sendChatMessage,
      variables: { ref: ref(member), body: 'Hallo!', notify: 'NONE' },
    })
    expect(res.errors).toBeUndefined()
  }
  // Ottilie deletes her account; she stays on Bibi's list, as a booking keeps naming her.
  await DbUser.update({ id: ottilie.id }, { deletedAt: new Date() })
  resetToken()
  clearMails()
})

afterAll(async () => {
  await cleanDB()
  await testEnv.db.destroy()
})

describe('ChatGroupResolver without a login', () => {
  it('answers 401', async () => {
    const unauthorized = expect.objectContaining({
      errors: [new GraphQLError('401 Unauthorized')],
    })
    expect(await query({ query: chatGroups })).toEqual(unauthorized)
    expect(await open('Chor', [])).toEqual(unauthorized)
    expect(await write(uuidv4(), 'Hallo', false)).toEqual(unauthorized)
    expect(await membersOf(uuidv4())).toEqual(unauthorized)
  })
})

describe('opening a group', () => {
  beforeAll(() => loginAs('bibi@bloxberg.de'))
  afterAll(() => resetToken())

  it('makes the caller its owner and the contacts named its members', async () => {
    cafe = await opened('Gradido-Café Berlin', [ref(bob), ref(peter)])
    expect(cafe).toMatchObject({
      title: 'Gradido-Café Berlin',
      communityName: CONFIG.COMMUNITY_NAME,
      createdBy: { gradidoID: bibi.gradidoID, alias: 'BBB' },
      role: 'OWNER',
      memberCount: 3,
      unreadMessages: 0,
      lastMessageAt: null,
      mutedByMe: false,
    })
    expect(cafe.groupUuid).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('mails "you are in the group now" to the two taken in, and not to its owner', async () => {
    await mailsSent()
    const mails = addedMails()
    expect(mails.map((mail) => mail.email).sort()).toEqual(['bob@baumeister.de', 'peter@lustig.de'])
    for (const mail of mails) {
      expect(mail).toMatchObject({
        adderAlias: 'BBB',
        groupTitle: 'Gradido-Café Berlin',
        groupUuid: cafe.groupUuid,
        memberCount: 3,
      })
    }
    clearMails()
  })

  it('keeps the name in one line, and opens a group of the owner alone', async () => {
    const choir = await opened('  Chor \n am   Montag ', [])
    expect(choir).toMatchObject({ title: 'Chor am Montag', role: 'OWNER', memberCount: 1 })
    await mailsSent()
    expect(addedMails()).toEqual([])
  })

  describe('refuses, and files nothing', () => {
    const refused = async (title: string, members: ChatRef[], message: string) => {
      const before = await allConversations()
      const res = await open(title, members)
      expect(res.errors?.[0]?.message).toContain(message)
      expect(await allConversations()).toEqual(before)
      await mailsSent()
      expect(addedMails()).toEqual([])
    }

    it('a name with nothing in it', async () => {
      await refused(' \n ', [ref(bob)], 'CHAT_GROUP_NOT_CREATED: TITLE')
    })

    it('a name of more than a hundred characters', async () => {
      await refused('a'.repeat(101), [ref(bob)], 'CHAT_GROUP_NOT_CREATED: TITLE')
    })

    // ⛔ E-049: only own contacts -- whoever is taken in gets a mail.
    it('somebody who is no contact of the caller', async () => {
      await refused('Chor', [ref(bob), ref(raeuber)], 'CHAT_GROUP_NOT_CREATED: NOT_A_CONTACT')
    })

    it('a member of another community', async () => {
      await refused(
        'Chor',
        [{ communityUuid: uuidv4(), gradidoID: bob.gradidoID }],
        'CHAT_GROUP_NOT_CREATED: OTHER_COMMUNITY',
      )
    })

    it('a contact whose account is deleted', async () => {
      await refused('Chor', [ref(ottilie)], 'CHAT_GROUP_NOT_CREATED: UNKNOWN_MEMBER')
    })

    it('more members than a group holds, before a single row is read', async () => {
      const many = Array.from({ length: 100 }, () => ({
        communityUuid: bob.communityUuid,
        gradidoID: uuidv4(),
      }))
      await refused('Chor', many, 'Argument Validation Error')
    })
  })
})

describe('the groups of a member', () => {
  afterAll(() => resetToken())

  it('lists the groups the caller is in, with their own part in each', async () => {
    await loginAs('bob@baumeister.de')
    expect(await groupsOfCaller()).toEqual([
      expect.objectContaining({
        groupUuid: cafe.groupUuid,
        title: 'Gradido-Café Berlin',
        role: 'MEMBER',
        memberCount: 3,
        createdBy: { gradidoID: bibi.gradidoID, alias: 'BBB' },
      }),
    ])
  })

  it('lists the newest first -- here the group opened last', async () => {
    await loginAs('bibi@bloxberg.de')
    expect((await groupsOfCaller()).map((group: any) => group.title)).toEqual([
      'Chor am Montag',
      'Gradido-Café Berlin',
    ])
  })

  it('lists none for a member of none', async () => {
    await loginAs('raeuber@hotzenplotz.de')
    expect(await groupsOfCaller()).toEqual([])
  })

  // ⛔ A document may repeat a field under any number of aliases.
  it('answers five lists in one request, and refuses the sixth', async () => {
    await loginAs('bob@baumeister.de')
    const lists = (count: number) =>
      `query { ${Array.from({ length: count }, (_, n) => `list${n}: chatGroups { groupUuid }`).join(' ')} }`
    const five: any = await query({ query: lists(5) })
    expect(five.errors).toBeUndefined()
    const six: any = await query({ query: lists(6) })
    expect(six.errors?.map((error: any) => error.message)).toEqual([
      'Too many chat group lists requested at once',
    ])
  })
})

describe('the members of a group', () => {
  afterAll(() => resetToken())

  // The order is the time each was taken in, and the owner and the others go in within the same
  // millisecond as often as not -- so it is not what is compared here.
  it('names every member with their part, by alias and not by name', async () => {
    await loginAs('bob@baumeister.de')
    const res: any = await membersOf(cafe.groupUuid)
    expect(res.errors).toBeUndefined()
    const members = res.data.chatGroupMembers
    const parts = members.map((member: any) => [member.user.gradidoID, member.role])
    expect(parts.sort()).toEqual(
      [
        [bibi.gradidoID, 'OWNER'],
        [bob.gradidoID, 'MEMBER'],
        [peter.gradidoID, 'MEMBER'],
      ].sort(),
    )
    const owner = members.find((member: any) => member.role === 'OWNER')
    expect(owner.user).toMatchObject({
      alias: 'BBB',
      communityName: CONFIG.COMMUNITY_NAME,
      // NU-019: the real name is the member's own and the moderation's.
      firstName: null,
      lastName: null,
      deletedAt: null,
    })
  })

  // Who is not a member learns nothing about a group, not even that it exists.
  it('answers CHAT_GROUP_NOT_FOUND alike to a non-member and for a group there is none of', async () => {
    await loginAs('raeuber@hotzenplotz.de')
    const notMine: any = await membersOf(cafe.groupUuid)
    const none: any = await membersOf(uuidv4())
    expect(notMine.errors?.map((error: any) => error.message)).toEqual(['CHAT_GROUP_NOT_FOUND'])
    expect(none.errors?.map((error: any) => error.message)).toEqual(['CHAT_GROUP_NOT_FOUND'])
  })

  it('refuses something that is no uuid before looking', async () => {
    await loginAs('bob@baumeister.de')
    const res: any = await membersOf('not-a-uuid')
    expect(res.errors?.[0]?.message).toContain('Argument Validation Error')
  })
})

describe('writing in a group', () => {
  afterAll(() => resetToken())

  it('files a message of a member, which carries the group and its writer', async () => {
    await loginAs('bob@baumeister.de')
    const copy = await wrote(cafe.groupUuid, 'Samstag um 14 Uhr?', false)
    expect(copy).toMatchObject({
      mine: true,
      body: 'Samstag um 14 Uhr?',
      subject: null,
      groupUuid: cafe.groupUuid,
      conversationId: cafe.conversationId,
      senderUser: { gradidoID: bob.gradidoID },
      deliveryState: 'DELIVERED',
      notify: 'NONE',
      mailState: null,
    })
    await mailsSent()
    expect(announcements()).toEqual([])
  })

  // E-050 F5: an announcement is the owner's and the moderators'.
  it('refuses an announcement from a plain member, and files nothing', async () => {
    const before = await allMessages()
    const res = await write(cafe.groupUuid, 'Alle herhören!', true)
    expect(res.errors?.map((error: any) => error.message)).toEqual([
      'CHAT_MESSAGE_NOT_SENT: NOT_ALLOWED',
    ])
    expect(await allMessages()).toEqual(before)
    await mailsSent()
    expect(announcements()).toEqual([])
  })

  it("mails the owner's announcement to every other member", async () => {
    await loginAs('bibi@bloxberg.de')
    const copy = await wrote(cafe.groupUuid, 'Wir treffen uns im Café.', true)
    // What was asked for, never who got a mail (E-024).
    expect(copy).toMatchObject({ notify: 'EMAIL', mailState: null })
    await mailsSent()
    const mails = announcements()
    expect(mails.map((mail) => mail.email).sort()).toEqual(['bob@baumeister.de', 'peter@lustig.de'])
    expect(mails[0]).toMatchObject({
      senderAlias: 'BBB',
      groupTitle: 'Gradido-Café Berlin',
      groupUuid: cafe.groupUuid,
      memo: 'Wir treffen uns im Café.',
      hasImage: false,
    })
    clearMails()
  })

  it('mails no announcement to a member who muted the group', async () => {
    await loginAs('peter@lustig.de')
    expect(await mute(cafe.groupUuid, true)).toBe(true)
    await loginAs('bibi@bloxberg.de')
    await wrote(cafe.groupUuid, 'Bringt Kuchen mit.', true)
    await mailsSent()
    expect(announcements().map((mail) => mail.email)).toEqual(['bob@baumeister.de'])
    clearMails()
  })

  it('files a picture with the message, for the members of the group', async () => {
    const copy = await wrote(cafe.groupUuid, 'Das Café', false, picture)
    expect(copy.images).toEqual([{ imageUuid: expect.any(String), width: 800, height: 600 }])
    const pictureAs = async (email: string) => {
      await loginAs(email)
      const res: any = await query({
        query: chatMessageImage,
        variables: { imageUuid: copy.images[0].imageUuid },
      })
      expect(res.errors).toBeUndefined()
      return res.data.chatMessageImage
    }
    expect(await pictureAs('peter@lustig.de')).toBe(JPEG.toString('base64'))
    expect(await pictureAs('raeuber@hotzenplotz.de')).toBeNull()
  })

  it('refuses a message to a group the caller is not in, and files nothing', async () => {
    await loginAs('raeuber@hotzenplotz.de')
    const before = await allMessages()
    const res = await write(cafe.groupUuid, 'Hallo?', false)
    expect(res.errors?.map((error: any) => error.message)).toEqual(['CHAT_GROUP_NOT_FOUND'])
    expect(await allMessages()).toEqual(before)
  })
})

describe('reading a group', () => {
  afterAll(() => resetToken())

  it('hands out the messages in the order they arrived, each with its writer', async () => {
    await loginAs('peter@lustig.de')
    const page = await pageOf(cafe.groupUuid)
    expect(page.hasMore).toBe(false)
    expect(page.messages.map((message: any) => message.body)).toEqual([
      'Samstag um 14 Uhr?',
      'Wir treffen uns im Café.',
      'Bringt Kuchen mit.',
      'Das Café',
    ])
    expect(page.messages.map((message: any) => message.senderUser.gradidoID)).toEqual([
      bob.gradidoID,
      bibi.gradidoID,
      bibi.gradidoID,
      bibi.gradidoID,
    ])
    expect(page.messages.every((message: any) => message.groupUuid === cafe.groupUuid)).toBe(true)
    expect(page.messages.map((message: any) => message.mine)).toEqual([false, false, false, false])
    // ⛔ E-019, E-024: what the writer asked for is theirs to know.
    expect(page.messages.map((message: any) => message.notify)).toEqual([null, null, null, null])
  })

  it("says whether the reader muted the group, and only the reader's mark", async () => {
    expect((await pageOf(cafe.groupUuid)).mutedByMe).toBe(true)
    await loginAs('bob@baumeister.de')
    expect((await pageOf(cafe.groupUuid)).mutedByMe).toBe(false)
  })

  it('pages backwards from the newest', async () => {
    const newest = await pageOf(cafe.groupUuid, { limit: 2 })
    expect(newest.messages.map((message: any) => message.body)).toEqual([
      'Bringt Kuchen mit.',
      'Das Café',
    ])
    expect(newest.hasMore).toBe(true)
    const older = await pageOf(cafe.groupUuid, { before: newest.messages[0].id, limit: 2 })
    expect(older.messages.map((message: any) => message.body)).toEqual([
      'Samstag um 14 Uhr?',
      'Wir treffen uns im Café.',
    ])
    expect(older.hasMore).toBe(false)
  })

  it('counts as unread the messages of others above the pointer, until they are marked read', async () => {
    await loginAs('peter@lustig.de')
    const [before] = await groupsOfCaller()
    expect(before).toMatchObject({ groupUuid: cafe.groupUuid, unreadMessages: 4 })
    expect(before.lastMessageAt).not.toBeNull()
    const page = await pageOf(cafe.groupUuid)
    expect(await markRead(cafe.groupUuid, page.messages[1].id)).toBe(true)
    expect((await groupsOfCaller())[0].unreadMessages).toBe(2)
    expect(await markRead(cafe.groupUuid, page.messages[3].id)).toBe(true)
    expect((await groupsOfCaller())[0].unreadMessages).toBe(0)
  })

  it("counts none of the writer's own", async () => {
    await loginAs('bob@baumeister.de')
    const group = (await groupsOfCaller()).find((row: any) => row.groupUuid === cafe.groupUuid)
    expect(group.unreadMessages).toBe(3)
  })

  it('marks nothing and mutes nothing for a member of another group', async () => {
    await loginAs('raeuber@hotzenplotz.de')
    expect(await markRead(cafe.groupUuid, 1)).toBe(false)
    expect(await mute(cafe.groupUuid, true)).toBe(false)
    const res: any = await query({
      query: chatGroupMessages,
      variables: { groupUuid: cafe.groupUuid },
    })
    expect(res.errors?.map((error: any) => error.message)).toEqual(['CHAT_GROUP_NOT_FOUND'])
  })

  it('answers ten pages in one request, together with the threads, and refuses the eleventh', async () => {
    await loginAs('bob@baumeister.de')
    const pages = (count: number) =>
      `query ($groupUuid: String!) { ${Array.from(
        { length: count },
        (_, n) => `page${n}: chatGroupMessages(groupUuid: $groupUuid, limit: 1) { hasMore }`,
      ).join(' ')} }`
    const ten: any = await query({ query: pages(10), variables: { groupUuid: cafe.groupUuid } })
    expect(ten.errors).toBeUndefined()
    const eleven: any = await query({ query: pages(11), variables: { groupUuid: cafe.groupUuid } })
    expect(eleven.errors?.map((error: any) => error.message)).toEqual([
      'Too many chat pages requested at once',
    ])
  })
})

describe('the chat beat and the contact list', () => {
  const beat = gql`
    query ($afterId: Int) {
      newChatMessagesSince(afterId: $afterId, limit: 100) {
        unreadConversations
        messages {
          body
          conversationId
          groupUuid
          senderUser {
            gradidoID
          }
        }
      }
    }
  `

  beforeAll(() => loginAs('bob@baumeister.de'))
  afterAll(() => resetToken())

  // ⛔ Falle 1 of the build plan: an empty thread with Bibi would take her group message for one
  // of theirs, were it not for the group it carries.
  it('hands out the messages of a group with the group, and a direct one without', async () => {
    const res: any = await query({ query: beat, variables: { afterId: 0 } })
    expect(res.errors).toBeUndefined()
    const { messages } = res.data.newChatMessagesSince
    const direct = messages.filter((message: any) => message.groupUuid === null)
    const inGroup = messages.filter((message: any) => message.groupUuid === cafe.groupUuid)
    expect(direct.map((message: any) => message.body)).toEqual(['Hallo!'])
    expect(direct[0].senderUser).toBeNull()
    expect(inGroup).toHaveLength(4)
    expect(inGroup.every((message: any) => message.conversationId === cafe.conversationId)).toBe(
      true,
    )
    expect(inGroup[1].senderUser).toEqual({ gradidoID: bibi.gradidoID })
  })

  it('counts the group among the conversations with something unread', async () => {
    const res: any = await query({ query: beat, variables: { afterId: null } })
    // The thread with Bibi and the group.
    expect(res.data.newChatMessagesSince.unreadConversations).toBe(2)
  })

  // A group makes nobody a contact: a contact is an event two people share (KF-012).
  it('makes nobody a contact', async () => {
    const res: any = await query({ query: contactList, variables: { pageSize: 25 } })
    expect(res.errors).toBeUndefined()
    const contacts = res.data.contactList.contacts.map((row: any) => row.user.gradidoID)
    expect(contacts).toContain(bibi.gradidoID)
    expect(contacts).not.toContain(peter.gradidoID)
  })
})

/**
 * EM-013: an address never confirmed, past its grace period, acts outward no more -- opening a
 * group and writing in one mail others. Reading and asking for quiet stay.
 */
describe('an unconfirmed account past its grace period', () => {
  let garrick: DbUser
  let group: any

  beforeAll(async () => {
    garrick = await userFactory(testEnv, { ...garrickOllivander, emailChecked: true })
    await loginAs('bibi@bloxberg.de')
    const res: any = await mutate({
      mutation: sendChatMessage,
      variables: { ref: ref(garrick), body: 'Willkommen!', notify: 'NONE' },
    })
    expect(res.errors).toBeUndefined()
    group = await opened('Neu hier', [ref(garrick)])
    await DbUser.update(
      { id: garrick.id },
      { createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    )
    await DbUserContact.update({ id: garrick.emailId ?? 0 }, { emailChecked: false })
    await loginAs('garrick@ollivander.com')
  })
  afterAll(() => resetToken())

  it('may neither open a group nor write in one, and nothing is filed', async () => {
    const unauthorized = [new GraphQLError('401 Unauthorized')]
    const conversations = await allConversations()
    const messages = await allMessages()
    expect((await open('Meine', [])).errors).toEqual(unauthorized)
    expect((await write(group.groupUuid, 'Danke!', false)).errors).toEqual(unauthorized)
    expect(await allConversations()).toEqual(conversations)
    expect(await allMessages()).toEqual(messages)
  })

  it('may still read the group and mute it', async () => {
    expect((await pageOf(group.groupUuid)).messages).toEqual([])
    expect(await mute(group.groupUuid, true)).toBe(true)
  })
})

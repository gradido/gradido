// AI-GENERATED — not an architecture reference
import { sendChatGroupAddedEmail } from 'core'
import {
  ChatConversationMemberRole,
  ChatConversationMemberSelect,
  ChatConversationSelect,
  ContactRow,
  User as DbUser,
  dbDeleteChatConversationMember,
  dbFindChatGroupByUuid,
  dbInsertChatConversationMembers,
  dbSelectChatConversationMember,
  dbSelectChatConversationMembers,
  dbSelectChatGroupsByMember,
  dbSelectChatMessagesPage,
  dbSelectContactsByUserId,
  dbSelectUsersByUuids,
  dbUpdateChatConversationMemberLastRead,
  dbUpdateChatConversationMemberRole,
  dbUpdateChatGroupTitle,
} from 'database'
import { Context, newRequestBudget } from '@/server/context'
import { ChatGroupResolver } from './ChatGroupResolver'

// What the database answers is mocked here: the subject is what the resolver decides itself when
// the members of a group change (E-050 F4) -- who may take whom in or out, who takes over when
// the owner leaves, how many moderators there may be -- and that a refusal writes nothing.
// ChatGroupResolver.test.ts runs the same ways against a database.
jest.mock('core', () => {
  const originalModule = jest.requireActual('core')
  return {
    __esModule: true,
    ...originalModule,
    sendChatGroupAddedEmail: jest.fn(async () => ({ accepted: ['watched'] })),
  }
})
jest.mock('database', () => {
  const originalModule = jest.requireActual('database')
  return {
    __esModule: true,
    ...originalModule,
    getHomeCommunity: jest.fn(async () => ({ communityUuid: HOME, name: 'Gradido Akademie' })),
    dbFindChatGroupByUuid: jest.fn(),
    dbSelectChatConversationMember: jest.fn(),
    dbSelectChatConversationMembers: jest.fn(),
    dbSelectContactsByUserId: jest.fn(),
    dbSelectUsersByUuids: jest.fn(),
    dbFindUsersWithEmailContactByIds: jest.fn(async (ids: number[]) =>
      ids.map((id) => ({
        id,
        communityUuid: HOME,
        gradidoID: `id-${id}`,
        firstName: `F${id}`,
        lastName: 'Near',
        language: 'de',
        foreign: false,
        emailContact: { email: `member${id}@example.org` },
      })),
    ),
    dbInsertChatConversationMembers: jest.fn(),
    dbSelectChatMessagesPage: jest.fn(),
    dbUpdateChatConversationMemberLastRead: jest.fn(async () => ({ success: true })),
    dbDeleteChatConversationMember: jest.fn(async () => ({ success: true })),
    dbUpdateChatConversationMemberRole: jest.fn(async () => ({ success: true })),
    dbUpdateChatGroupTitle: jest.fn(async () => ({ success: true })),
    dbSelectChatGroupsByMember: jest.fn(),
    dbFindUsersByIds: jest.fn(async () => []),
    dbFindMemberAvatarTimestamps: jest.fn(async () => new Map()),
  }
})

const HOME = '11111111-1111-4111-8111-111111111111'
const LENA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const MAX = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const NORA = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const OLE = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
const PIA = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
const GROUP = '30000000-0000-4000-8000-000000000009'

const lena = {
  id: 1,
  communityUuid: HOME,
  gradidoID: LENA,
  alias: 'lena',
  firstName: 'Lena',
  lastName: 'Near',
  foreign: false,
} as unknown as DbUser

/** A request of Lena's, with a budget of its own. */
const lenasRequest = (): Context => ({
  token: null,
  setHeaders: [],
  requestBudget: newRequestBudget(),
  user: lena,
})

const group = {
  id: 9,
  conversationUuid: GROUP,
  kind: 'group',
  homeCommunityUuid: HOME,
  directPairKey: null,
  title: 'Chor',
  createdByCommunityUuid: HOME,
  createdByGradidoId: LENA,
  createdAt: new Date('2026-09-29T08:00:00.000Z'),
} as ChatConversationSelect

const at = (minute: number) => new Date(`2026-09-29T08:${String(minute).padStart(2, '0')}:00.000Z`)
const row = (
  gradidoId: string,
  role: ChatConversationMemberRole,
  joinedAt = at(0),
): ChatConversationMemberSelect => ({
  conversationId: group.id,
  communityUuid: HOME,
  gradidoId,
  role,
  joinedAt,
  lastReadMessageId: null,
  mutedAt: null,
})
const ref = (gradidoID: string) => ({ communityUuid: HOME, gradidoID })
const pair = (gradidoId: string) => ({ communityUuid: HOME, gradidoId })

const contact = (gradidoId: string): ContactRow => ({
  linkedUserId: null,
  communityUuid: HOME,
  gradidoId,
  alias: null,
  deletedAt: null,
  firstAt: at(0),
  lastAt: at(0),
  bookings: 1,
  origin: null,
  unreadChatMessages: 0,
  lastChatMessageAt: null,
})

const findGroup = dbFindChatGroupByUuid as jest.Mock
const myRow = dbSelectChatConversationMember as jest.Mock
const allRows = dbSelectChatConversationMembers as jest.Mock
const contacts = dbSelectContactsByUserId as jest.Mock
const byUuids = dbSelectUsersByUuids as jest.Mock
const insertMembers = dbInsertChatConversationMembers as jest.Mock
const latestPage = dbSelectChatMessagesPage as jest.Mock
const readUpTo = dbUpdateChatConversationMemberLastRead as jest.Mock
const remove = dbDeleteChatConversationMember as jest.Mock
const setRole = dbUpdateChatConversationMemberRole as jest.Mock
const rename = dbUpdateChatGroupTitle as jest.Mock
const groupsOf = dbSelectChatGroupsByMember as jest.Mock
const addedMail = sendChatGroupAddedEmail as jest.Mock

/** Lena in the group in this role, with these others. */
const lenaIs = (role: ChatConversationMemberRole, others: ChatConversationMemberSelect[]) => {
  const mine = row(LENA, role, at(1))
  myRow.mockResolvedValue(mine)
  allRows.mockResolvedValue([...others, mine].sort((a, b) => +a.joinedAt - +b.joinedAt))
}

/** Waits for what the request does not wait for: the mails. */
const mailsSent = () => new Promise((resolve) => setTimeout(resolve, 0))

const resolver = () => new ChatGroupResolver()

beforeEach(() => {
  jest.clearAllMocks()
  // Answers queued for one call and not taken would reach the next test.
  allRows.mockReset()
  setRole.mockReset().mockResolvedValue({ success: true })
  findGroup.mockResolvedValue(group)
  lenaIs('owner', [row(MAX, 'member', at(2)), row(NORA, 'member', at(3))])
  contacts.mockResolvedValue({
    contacts: [contact(MAX), contact(NORA), contact(OLE), contact(PIA)],
    count: 4,
  })
  byUuids.mockImplementation(async (pairs: { communityUuid: string; gradidoId: string }[]) =>
    pairs.map((one, index) => ({
      id: 10 + index,
      communityUuid: one.communityUuid,
      gradidoId: one.gradidoId,
      alias: null,
      deletedAt: null,
    })),
  )
  insertMembers.mockResolvedValue(undefined)
  latestPage.mockResolvedValue({ messages: [{ id: 77 }], hasMore: true })
  groupsOf.mockResolvedValue([
    {
      id: group.id,
      groupUuid: GROUP,
      title: 'Chor',
      homeCommunityUuid: HOME,
      createdAt: group.createdAt,
      createdByCommunityUuid: HOME,
      createdByGradidoId: LENA,
      role: 'owner',
      joinedAt: at(1),
      mutedAt: null,
      memberCount: 4,
      unreadMessages: 0,
      lastMessageAt: null,
    },
  ])
})

describe('addChatGroupMembers', () => {
  const add = (...gradidoIds: string[]) =>
    resolver().addChatGroupMembers(
      { groupUuid: GROUP, members: gradidoIds.map(ref) },
      lenasRequest(),
    )

  it('takes contacts in as members and mails each of them', async () => {
    await add(OLE, PIA)
    expect(insertMembers).toHaveBeenCalledWith(group.id, [pair(OLE), pair(PIA)])
    await mailsSent()
    expect(addedMail).toHaveBeenCalledTimes(2)
    expect(addedMail.mock.calls[0][0]).toMatchObject({ memberCount: 5, groupUuid: GROUP })
  })

  // They read what was written before they came; none of it waits for them as unread.
  it("puts a new member's read pointer on the latest message", async () => {
    await add(OLE)
    expect(latestPage).toHaveBeenCalledWith(group.id, { limit: 1 })
    expect(readUpTo).toHaveBeenCalledWith(group.id, pair(OLE), 77)
  })

  it('moves no pointer in a group without a message', async () => {
    latestPage.mockResolvedValue({ messages: [], hasMore: false })
    await add(OLE)
    expect(readUpTo).not.toHaveBeenCalled()
  })

  it('leaves whoever is in the group already as they are, without a mail', async () => {
    await add(MAX, OLE)
    expect(insertMembers).toHaveBeenCalledWith(group.id, [pair(OLE)])
    await mailsSent()
    expect(addedMail).toHaveBeenCalledTimes(1)
  })

  // A member already in it need not be the adder's contact: the owner may have taken them in.
  it('does not ask whether a member already in the group is a contact', async () => {
    contacts.mockResolvedValue({ contacts: [contact(OLE)], count: 1 })
    await add(MAX, OLE)
    expect(insertMembers).toHaveBeenCalledWith(group.id, [pair(OLE)])
  })

  it('writes nothing where everybody named is in the group already', async () => {
    await add(MAX, NORA, LENA)
    expect(insertMembers).not.toHaveBeenCalled()
    expect(contacts).not.toHaveBeenCalled()
  })

  it('lets a moderator take members in', async () => {
    lenaIs('moderator', [row(MAX, 'owner', at(0))])
    await add(OLE)
    expect(insertMembers).toHaveBeenCalledWith(group.id, [pair(OLE)])
  })

  describe('refuses, and writes nothing', () => {
    const refused = async (reason: string, ...gradidoIds: string[]) => {
      await expect(add(...gradidoIds)).rejects.toThrow(`CHAT_GROUP_NOT_CHANGED: ${reason}`)
      expect(insertMembers).not.toHaveBeenCalled()
      expect(readUpTo).not.toHaveBeenCalled()
      await mailsSent()
      expect(addedMail).not.toHaveBeenCalled()
    }

    it('a plain member', async () => {
      lenaIs('member', [row(MAX, 'owner', at(0))])
      await refused('NOT_ALLOWED', OLE)
    })

    it('somebody who is no contact of the caller', async () => {
      contacts.mockResolvedValue({ contacts: [contact(OLE)], count: 1 })
      await refused('NOT_A_CONTACT', OLE, PIA)
    })

    // E-008: a hundred with the owner, a constant of the software.
    it('more members than a group holds', async () => {
      const full = Array.from({ length: 99 }, (_, n) =>
        row(`ffffffff-ffff-4fff-8fff-${String(n).padStart(12, '0')}`, 'member', at(2)),
      )
      lenaIs('owner', full)
      await refused('FULL', OLE)
    })
  })

  it('answers CHAT_GROUP_NOT_FOUND to somebody not in the group', async () => {
    myRow.mockResolvedValue(null)
    await expect(add(OLE)).rejects.toThrow('CHAT_GROUP_NOT_FOUND')
    expect(insertMembers).not.toHaveBeenCalled()
  })
})

describe('removeChatGroupMember', () => {
  const take = (gradidoId: string) =>
    resolver().removeChatGroupMember({ groupUuid: GROUP, member: ref(gradidoId) }, lenasRequest())

  it('lets the owner take out a member and a moderator', async () => {
    lenaIs('owner', [row(MAX, 'moderator', at(2)), row(NORA, 'member', at(3))])
    myRow.mockImplementation(async (_id: number, member: { gradidoId: string }) =>
      member.gradidoId === LENA
        ? row(LENA, 'owner', at(1))
        : member.gradidoId === MAX
          ? row(MAX, 'moderator', at(2))
          : row(NORA, 'member', at(3)),
    )
    expect(await take(NORA)).toBe(true)
    expect(await take(MAX)).toBe(true)
    expect(remove.mock.calls).toEqual([
      [group.id, pair(NORA)],
      [group.id, pair(MAX)],
    ])
  })

  it('lets a moderator take out a plain member, and neither a moderator nor the owner', async () => {
    myRow.mockImplementation(async (_id: number, member: { gradidoId: string }) =>
      member.gradidoId === LENA
        ? row(LENA, 'moderator', at(1))
        : member.gradidoId === MAX
          ? row(MAX, 'owner', at(0))
          : member.gradidoId === NORA
            ? row(NORA, 'moderator', at(3))
            : row(OLE, 'member', at(4)),
    )
    expect(await take(OLE)).toBe(true)
    await expect(take(NORA)).rejects.toThrow('CHAT_GROUP_NOT_CHANGED: NOT_ALLOWED')
    await expect(take(MAX)).rejects.toThrow('CHAT_GROUP_NOT_CHANGED: NOT_ALLOWED')
    expect(remove.mock.calls).toEqual([[group.id, pair(OLE)]])
  })

  it('lets no plain member take anybody out', async () => {
    myRow.mockImplementation(async (_id: number, member: { gradidoId: string }) =>
      member.gradidoId === LENA ? row(LENA, 'member', at(1)) : row(NORA, 'member', at(3)),
    )
    await expect(take(NORA)).rejects.toThrow('CHAT_GROUP_NOT_CHANGED: NOT_ALLOWED')
    expect(remove).not.toHaveBeenCalled()
  })

  // Taking oneself out is leaving, which has its own way -- and the owner's successor.
  it('does not take the caller out', async () => {
    await expect(take(LENA)).rejects.toThrow('CHAT_GROUP_NOT_CHANGED: NOT_ALLOWED')
    expect(remove).not.toHaveBeenCalled()
  })

  it('says so where the member named is not in the group', async () => {
    myRow.mockImplementation(async (_id: number, member: { gradidoId: string }) =>
      member.gradidoId === LENA ? row(LENA, 'owner', at(1)) : null,
    )
    await expect(take(OLE)).rejects.toThrow('CHAT_GROUP_NOT_CHANGED: NOT_A_MEMBER')
    expect(remove).not.toHaveBeenCalled()
  })
})

describe('leaveChatGroup', () => {
  const leave = () => resolver().leaveChatGroup({ groupUuid: GROUP }, lenasRequest())

  it('takes a member out of the group, and nobody else', async () => {
    lenaIs('member', [row(MAX, 'owner', at(0))])
    expect(await leave()).toBe(true)
    expect(remove.mock.calls).toEqual([[group.id, pair(LENA)]])
    expect(setRole).not.toHaveBeenCalled()
  })

  // E-050 F4: the longest-standing moderator, otherwise the longest-standing member.
  it("hands the owner's group to the longest-standing moderator first", async () => {
    lenaIs('owner', [
      row(MAX, 'member', at(2)),
      row(NORA, 'moderator', at(3)),
      row(OLE, 'moderator', at(4)),
    ])
    expect(await leave()).toBe(true)
    expect(setRole).toHaveBeenCalledWith(group.id, expect.objectContaining(pair(NORA)), 'owner')
    // The successor before the owner goes: never a group without one.
    expect(setRole.mock.invocationCallOrder[0]).toBeLessThan(remove.mock.invocationCallOrder[0])
  })

  it('hands it to the longest-standing member where there is no moderator', async () => {
    lenaIs('owner', [row(NORA, 'member', at(3)), row(MAX, 'member', at(2))])
    await leave()
    expect(setRole).toHaveBeenCalledWith(group.id, expect.objectContaining(pair(MAX)), 'owner')
  })

  it('leaves the group without anybody where the owner was the last one', async () => {
    lenaIs('owner', [])
    allRows.mockResolvedValueOnce([row(LENA, 'owner', at(1))]).mockResolvedValueOnce([])
    expect(await leave()).toBe(true)
    expect(setRole).not.toHaveBeenCalled()
    expect(remove).toHaveBeenCalledWith(group.id, pair(LENA))
  })

  it('answers false to somebody not in the group, and writes nothing', async () => {
    myRow.mockResolvedValue(null)
    expect(await leave()).toBe(false)
    expect(remove).not.toHaveBeenCalled()
  })

  // coderabbit on #4012: two leaves at the same moment can take out the owner and the one it
  // hands the group to. Every leave looks once more when it is done.
  it('hands a group left without an owner to its successor, after any member leaves', async () => {
    // Nora has been in it longer, and Max is a moderator: the moderator takes over.
    lenaIs('member', [row(NORA, 'member', at(2)), row(MAX, 'moderator', at(3))])
    allRows.mockResolvedValueOnce([row(NORA, 'member', at(2)), row(MAX, 'moderator', at(3))])
    expect(await leave()).toBe(true)
    expect(setRole).toHaveBeenCalledWith(group.id, expect.objectContaining(pair(MAX)), 'owner')
    expect(remove.mock.invocationCallOrder[0]).toBeLessThan(setRole.mock.invocationCallOrder[0])
  })

  it("hands it on once more where the owner's successor went at the same moment", async () => {
    lenaIs('owner', [row(MAX, 'moderator', at(2)), row(NORA, 'member', at(3))])
    setRole.mockResolvedValueOnce({ success: false, error: new Error('DB_NOT_FOUND') })
    allRows
      .mockResolvedValueOnce([
        row(LENA, 'owner', at(1)),
        row(MAX, 'moderator', at(2)),
        row(NORA, 'member', at(3)),
      ])
      .mockResolvedValueOnce([row(NORA, 'member', at(3))])
    expect(await leave()).toBe(true)
    expect(setRole.mock.calls).toEqual([
      [group.id, expect.objectContaining(pair(MAX)), 'owner'],
      [group.id, expect.objectContaining(pair(NORA)), 'owner'],
    ])
  })
})

describe('setChatGroupModerator', () => {
  const appoint = (gradidoId: string, moderator = true) =>
    resolver().setChatGroupModerator(
      { groupUuid: GROUP, member: ref(gradidoId), moderator },
      lenasRequest(),
    )

  it('lets the owner make a member a moderator, and a moderator a member again', async () => {
    lenaIs('owner', [row(MAX, 'member', at(2)), row(NORA, 'moderator', at(3))])
    expect(await appoint(MAX)).toBe(true)
    expect(await appoint(NORA, false)).toBe(true)
    expect(setRole.mock.calls).toEqual([
      [group.id, expect.objectContaining(pair(MAX)), 'moderator'],
      [group.id, expect.objectContaining(pair(NORA)), 'member'],
    ])
  })

  it('writes nothing where the member has that part already', async () => {
    lenaIs('owner', [row(MAX, 'moderator', at(2))])
    expect(await appoint(MAX)).toBe(true)
    expect(setRole).not.toHaveBeenCalled()
  })

  // E-008, E-050 F4: two moderators beside the owner.
  it('refuses a third moderator', async () => {
    lenaIs('owner', [
      row(MAX, 'moderator', at(2)),
      row(NORA, 'moderator', at(3)),
      row(OLE, 'member', at(4)),
    ])
    await expect(appoint(OLE)).rejects.toThrow('CHAT_GROUP_NOT_CHANGED: TOO_MANY_MODERATORS')
    expect(setRole).not.toHaveBeenCalled()
  })

  it('lets nobody but the owner name moderators', async () => {
    lenaIs('moderator', [row(MAX, 'owner', at(0)), row(NORA, 'member', at(3))])
    await expect(appoint(NORA)).rejects.toThrow('CHAT_GROUP_NOT_CHANGED: NOT_ALLOWED')
    expect(setRole).not.toHaveBeenCalled()
  })

  it('does not touch the part of the owner', async () => {
    await expect(appoint(LENA)).rejects.toThrow('CHAT_GROUP_NOT_CHANGED: NOT_ALLOWED')
    expect(setRole).not.toHaveBeenCalled()
  })

  it('says so where the member named is not in the group', async () => {
    await expect(appoint(OLE)).rejects.toThrow('CHAT_GROUP_NOT_CHANGED: NOT_A_MEMBER')
  })
})

describe('renameChatGroup', () => {
  const call = (title: string) =>
    resolver().renameChatGroup({ groupUuid: GROUP, title }, lenasRequest())

  it('gives the group the name as it is kept', async () => {
    const renamed = await call('  Chor \n am Montag ')
    expect(rename).toHaveBeenCalledWith(group.id, 'Chor am Montag')
    expect(renamed.groupUuid).toBe(GROUP)
  })

  it('lets a moderator rename it, and no plain member', async () => {
    lenaIs('moderator', [row(MAX, 'owner', at(0))])
    await call('Chor')
    expect(rename).toHaveBeenCalledTimes(1)
    lenaIs('member', [row(MAX, 'owner', at(0))])
    await expect(call('Chor')).rejects.toThrow('CHAT_GROUP_NOT_CHANGED: NOT_ALLOWED')
    expect(rename).toHaveBeenCalledTimes(1)
  })

  it('refuses a name with nothing in it', async () => {
    await expect(call(' \n ')).rejects.toThrow('CHAT_GROUP_NOT_CHANGED: TITLE')
    expect(rename).not.toHaveBeenCalled()
  })
})

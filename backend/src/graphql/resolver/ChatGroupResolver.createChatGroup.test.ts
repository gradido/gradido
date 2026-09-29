// AI-GENERATED — not an architecture reference
import { sendChatGroupAddedEmail } from 'core'
import {
  ChatConversationSelect,
  ContactRow,
  User as DbUser,
  dbFindUsersByIds,
  dbFindUsersWithEmailContactByIds,
  dbInsertChatConversationMembers,
  dbInsertChatGroup,
  dbSelectChatGroupsByMember,
  dbSelectContactsByUserId,
  dbSelectUsersByUuids,
  getHomeCommunity,
} from 'database'
import { Context, newRequestBudget } from '@/server/context'
import { ChatGroupResolver } from './ChatGroupResolver'

// What the database answers is mocked here: the subject is what the resolver decides itself about
// the members a group is opened with (E-049) -- whom it takes, whom it refuses and why, and that
// a refusal files nothing. ChatGroupResolver.test.ts runs the same ways against a database.
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
    getHomeCommunity: jest.fn(),
    dbSelectContactsByUserId: jest.fn(),
    dbSelectUsersByUuids: jest.fn(),
    dbFindUsersWithEmailContactByIds: jest.fn(),
    dbInsertChatGroup: jest.fn(),
    dbInsertChatConversationMembers: jest.fn(),
    dbSelectChatGroupsByMember: jest.fn(),
    dbFindUsersByIds: jest.fn(),
    dbFindMemberAvatarTimestamps: jest.fn(async () => new Map()),
  }
})

const HOME = '11111111-1111-4111-8111-111111111111'
const OTHER = '22222222-2222-4222-8222-222222222222'
const LENA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const MAX = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const NORA = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const STRANGER = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
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

const contact = (gradidoId: string, communityUuid: string | null = HOME): ContactRow => ({
  linkedUserId: null,
  communityUuid,
  gradidoId,
  alias: null,
  deletedAt: null,
  firstAt: new Date('2026-09-01T00:00:00.000Z'),
  lastAt: new Date('2026-09-01T00:00:00.000Z'),
  bookings: 1,
  origin: null,
  unreadChatMessages: 0,
  lastChatMessageAt: null,
})

const home = getHomeCommunity as jest.Mock
const contacts = dbSelectContactsByUserId as jest.Mock
const byUuids = dbSelectUsersByUuids as jest.Mock
const withEmail = dbFindUsersWithEmailContactByIds as jest.Mock
const insertGroup = dbInsertChatGroup as jest.Mock
const insertMembers = dbInsertChatConversationMembers as jest.Mock
const groupsOf = dbSelectChatGroupsByMember as jest.Mock
const usersByIds = dbFindUsersByIds as jest.Mock
const addedMail = sendChatGroupAddedEmail as jest.Mock

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

const open = (members: { communityUuid?: string | null; gradidoID: string }[], title = 'Chor') =>
  new ChatGroupResolver().createChatGroup({ title, members }, lenasRequest())

/** Waits for what the request does not wait for: the mails. */
const mailsSent = () => new Promise((resolve) => setTimeout(resolve, 0))

beforeEach(() => {
  jest.clearAllMocks()
  home.mockResolvedValue({ communityUuid: HOME, name: 'Gradido Akademie' })
  contacts.mockResolvedValue({
    contacts: [contact(MAX), contact(NORA), contact(STRANGER, OTHER)],
    count: 3,
  })
  // Every pair asked for has a row, spelled in small letters as the users table spells it.
  byUuids.mockImplementation(async (pairs: { communityUuid: string; gradidoId: string }[]) =>
    pairs.map((pair, index) => ({
      id: 10 + index,
      communityUuid: pair.communityUuid.toLowerCase(),
      gradidoId: pair.gradidoId.toLowerCase(),
      alias: null,
      deletedAt: null,
    })),
  )
  withEmail.mockImplementation(async (ids: number[]) =>
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
  )
  insertGroup.mockResolvedValue(group)
  insertMembers.mockResolvedValue(undefined)
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
      joinedAt: group.createdAt,
      mutedAt: null,
      memberCount: 3,
      unreadMessages: 0,
      lastMessageAt: null,
    },
  ])
  usersByIds.mockResolvedValue([lena])
})

describe('createChatGroup, the members it takes (E-049)', () => {
  it('takes contacts of this community, the founder as the owner and the others as members', async () => {
    const created = await open([
      { communityUuid: HOME, gradidoID: MAX },
      { communityUuid: HOME, gradidoID: NORA },
    ])
    expect(insertGroup).toHaveBeenCalledWith({
      groupUuid: expect.any(String),
      title: 'Chor',
      homeCommunityUuid: HOME,
      createdBy: { communityUuid: HOME, gradidoId: LENA },
    })
    expect(insertMembers.mock.calls).toEqual([
      [group.id, [{ communityUuid: HOME, gradidoId: LENA }], 'owner'],
      [
        group.id,
        [
          { communityUuid: HOME, gradidoId: MAX },
          { communityUuid: HOME, gradidoId: NORA },
        ],
      ],
    ])
    expect(created).toMatchObject({ groupUuid: GROUP, role: 'owner', memberCount: 3 })
    expect(created.communityName).toBe('Gradido Akademie')
    expect(created.createdBy?.gradidoID).toBe(LENA)
  })

  it('files every member as the users table spells the pair', async () => {
    await open([{ communityUuid: HOME.toUpperCase(), gradidoID: MAX.toUpperCase() }])
    expect(insertMembers.mock.calls[1][1]).toEqual([{ communityUuid: HOME, gradidoId: MAX }])
  })

  it('takes a member without a community as one of this community', async () => {
    await open([{ communityUuid: null, gradidoID: MAX }])
    expect(insertMembers.mock.calls[1][1]).toEqual([{ communityUuid: HOME, gradidoId: MAX }])
  })

  it('takes a member named twice once, and leaves the founder out of the members', async () => {
    await open([
      { communityUuid: HOME, gradidoID: MAX },
      { communityUuid: HOME, gradidoID: MAX.toUpperCase() },
      { communityUuid: HOME, gradidoID: LENA },
    ])
    expect(insertMembers.mock.calls[1][1]).toEqual([{ communityUuid: HOME, gradidoId: MAX }])
  })

  it('opens a group of the owner alone, and asks for no contacts then', async () => {
    await open([])
    expect(contacts).not.toHaveBeenCalled()
    expect(insertMembers.mock.calls[1]).toEqual([group.id, []])
  })

  it('reads the whole contact list once, for the caller', async () => {
    await open([
      { communityUuid: HOME, gradidoID: MAX },
      { communityUuid: HOME, gradidoID: NORA },
    ])
    expect(contacts).toHaveBeenCalledTimes(1)
    expect(contacts).toHaveBeenCalledWith(lena.id, {
      member: { communityUuid: HOME, gradidoId: LENA },
      limit: Number.MAX_SAFE_INTEGER,
      offset: 0,
    })
  })

  it('sends "you are in the group now" to the members taken in, not to the founder', async () => {
    await open([
      { communityUuid: HOME, gradidoID: MAX },
      { communityUuid: HOME, gradidoID: NORA },
    ])
    await mailsSent()
    expect(addedMail.mock.calls.map(([data]) => data.email)).toEqual([
      'member10@example.org',
      'member11@example.org',
    ])
    expect(addedMail.mock.calls[0][0]).toMatchObject({
      adderAlias: 'lena',
      groupUuid: GROUP,
      groupTitle: 'Chor',
      memberCount: 3,
    })
  })

  describe('refuses, and files nothing', () => {
    const refused = async (
      members: { communityUuid?: string | null; gradidoID: string }[],
      reason: string,
      title = 'Chor',
    ) => {
      await expect(open(members, title)).rejects.toThrow(`CHAT_GROUP_NOT_CREATED: ${reason}`)
      expect(insertGroup).not.toHaveBeenCalled()
      expect(insertMembers).not.toHaveBeenCalled()
      await mailsSent()
      expect(addedMail).not.toHaveBeenCalled()
    }

    it('a name with nothing in it', async () => {
      await refused([{ communityUuid: HOME, gradidoID: MAX }], 'TITLE', ' \n ')
    })

    it('a name longer than a hundred characters', async () => {
      await refused([{ communityUuid: HOME, gradidoID: MAX }], 'TITLE', 'a'.repeat(101))
    })

    // ⛔ Falle 5 of the build plan: taken in means mailed.
    it('somebody who is no contact of the caller', async () => {
      contacts.mockResolvedValue({ contacts: [contact(MAX)], count: 1 })
      await refused(
        [
          { communityUuid: HOME, gradidoID: MAX },
          { communityUuid: HOME, gradidoID: NORA },
        ],
        'NOT_A_CONTACT',
      )
    })

    // A contact with the same gradido id in another community is somebody else.
    it('a contact who is a member of another community, even a contact', async () => {
      await refused([{ communityUuid: OTHER, gradidoID: STRANGER }], 'OTHER_COMMUNITY')
    })

    it('a member of this community who is only known from another community', async () => {
      contacts.mockResolvedValue({ contacts: [contact(MAX, OTHER)], count: 1 })
      await refused([{ communityUuid: HOME, gradidoID: MAX }], 'NOT_A_CONTACT')
    })

    it('a contact whose account is deleted', async () => {
      byUuids.mockResolvedValue([
        {
          id: 10,
          communityUuid: HOME,
          gradidoId: MAX,
          alias: null,
          deletedAt: new Date('2026-09-01T00:00:00.000Z'),
        },
      ])
      await refused([{ communityUuid: HOME, gradidoID: MAX }], 'UNKNOWN_MEMBER')
    })

    it('a contact without a users row', async () => {
      byUuids.mockResolvedValue([])
      await refused([{ communityUuid: HOME, gradidoID: MAX }], 'UNKNOWN_MEMBER')
    })
  })
})

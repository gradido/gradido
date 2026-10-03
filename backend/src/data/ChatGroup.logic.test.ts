// AI-GENERATED — not an architecture reference
import { ChatConversationMemberRole, ChatConversationMemberSelect } from 'database'
import {
  CHAT_GROUP_MAX_MEMBERS,
  CHAT_GROUP_MAX_MODERATORS,
  CHAT_GROUP_TITLE_INPUT_MAX,
  CHAT_GROUP_TITLE_MAX,
  chatGroupSuccessor,
  chatGroupTitle,
  mayAnnounceInChatGroup,
  mayAppointChatGroupModerators,
  mayManageChatGroup,
  mayRemoveFromChatGroup,
} from './ChatGroup.logic'

const HOME = '11111111-1111-4111-8111-111111111111'
const member = (
  gradidoId: string,
  role: ChatConversationMemberRole,
  joinedAt = '2026-09-29T08:00:00.000Z',
): ChatConversationMemberSelect => ({
  conversationId: 7,
  communityUuid: HOME,
  gradidoId,
  role,
  joinedAt: new Date(joinedAt),
  lastReadMessageId: null,
  mutedAt: null,
})

describe('the size of a group', () => {
  // The wallet's refusal names the number of moderators from its own copy of it
  // (frontend/src/components/ChatGroups/chatGroupDisplay.js) -- the two change together.
  it('has room for a hundred members and five moderators (E-008)', () => {
    expect(CHAT_GROUP_MAX_MEMBERS).toBe(100)
    expect(CHAT_GROUP_MAX_MODERATORS).toBe(5)
    expect(CHAT_GROUP_TITLE_MAX).toBe(100)
  })

  // A hundred emoji are two hundred units; typed with white space around them, still taken.
  it('takes a name as typed of up to four times that, the rule being chatGroupTitle', () => {
    expect(CHAT_GROUP_TITLE_INPUT_MAX).toBe(400)
    const typed = `  ${'🌻'.repeat(100)}`.padEnd(CHAT_GROUP_TITLE_INPUT_MAX)
    expect(typed.length).toBe(CHAT_GROUP_TITLE_INPUT_MAX)
    expect(chatGroupTitle(typed)).toBe('🌻'.repeat(100))
  })
})

describe('chatGroupTitle', () => {
  it('keeps a name as it is written', () => {
    expect(chatGroupTitle('Gradido-Café Berlin')).toBe('Gradido-Café Berlin')
  })

  it('makes every run of white space one space, and trims', () => {
    expect(chatGroupTitle('  Gradido-Café \n\t Berlin  ')).toBe('Gradido-Café Berlin')
  })

  it('refuses a name with nothing in it', () => {
    expect(chatGroupTitle('')).toBeNull()
    expect(chatGroupTitle(' \n\t ')).toBeNull()
  })

  it('takes a hundred characters and refuses one more', () => {
    expect(chatGroupTitle('a'.repeat(100))).toBe('a'.repeat(100))
    expect(chatGroupTitle('a'.repeat(101))).toBeNull()
  })

  // The column counts characters; an emoji is two UTF-16 units and one character.
  it('counts characters as the column does, not UTF-16 units', () => {
    const hundredEmoji = '🌻'.repeat(100)
    expect(hundredEmoji.length).toBe(200)
    expect(chatGroupTitle(hundredEmoji)).toBe(hundredEmoji)
    expect(chatGroupTitle(`${hundredEmoji}!`)).toBeNull()
  })
})

describe('who may do what in a group (E-050 F4, F5)', () => {
  it('lets the owner and the moderators take members in, rename and announce', () => {
    expect(mayManageChatGroup('owner')).toBe(true)
    expect(mayManageChatGroup('moderator')).toBe(true)
    expect(mayManageChatGroup('member')).toBe(false)
    expect(mayAnnounceInChatGroup('owner')).toBe(true)
    expect(mayAnnounceInChatGroup('moderator')).toBe(true)
    expect(mayAnnounceInChatGroup('member')).toBe(false)
  })

  it('lets the owner take out anybody else, and a moderator plain members only', () => {
    expect(mayRemoveFromChatGroup('owner', 'moderator')).toBe(true)
    expect(mayRemoveFromChatGroup('owner', 'member')).toBe(true)
    expect(mayRemoveFromChatGroup('owner', 'owner')).toBe(false)
    expect(mayRemoveFromChatGroup('moderator', 'member')).toBe(true)
    expect(mayRemoveFromChatGroup('moderator', 'moderator')).toBe(false)
    expect(mayRemoveFromChatGroup('moderator', 'owner')).toBe(false)
    expect(mayRemoveFromChatGroup('member', 'member')).toBe(false)
  })

  it('lets only the owner name moderators', () => {
    expect(mayAppointChatGroupModerators('owner')).toBe(true)
    expect(mayAppointChatGroupModerators('moderator')).toBe(false)
    expect(mayAppointChatGroupModerators('member')).toBe(false)
  })
})

describe('chatGroupSuccessor', () => {
  const owner = member('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'owner')
  const first = member('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'member', '2026-09-29T08:01:00.000Z')
  const moderator = member(
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'moderator',
    '2026-09-29T08:02:00.000Z',
  )
  const later = member(
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'moderator',
    '2026-09-29T08:03:00.000Z',
  )
  const leaving = { communityUuid: HOME, gradidoId: owner.gradidoId }

  it('hands the group to the longest-standing moderator', () => {
    expect(chatGroupSuccessor([owner, first, moderator, later], leaving)).toBe(moderator)
  })

  it('hands it to the longest-standing member where there is no moderator', () => {
    expect(chatGroupSuccessor([owner, first], leaving)).toBe(first)
  })

  it('names nobody where the owner is the last one', () => {
    expect(chatGroupSuccessor([owner], leaving)).toBeNull()
  })

  it('knows the owner by the pair, written in capitals too', () => {
    const shouting = { communityUuid: HOME.toUpperCase(), gradidoId: owner.gradidoId.toUpperCase() }
    expect(chatGroupSuccessor([owner, first], shouting)).toBe(first)
  })
})

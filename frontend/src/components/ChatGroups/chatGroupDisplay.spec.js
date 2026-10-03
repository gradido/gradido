// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import {
  CHAT_GROUP_MAX_MODERATORS,
  CHAT_GROUP_TITLE_MAX,
  chatGroupAvatar,
  chatGroupLetters,
  chatGroupMeta,
  chatGroupOwnPart,
  chatGroupPartMark,
  chatGroupRefusal,
  chatGroupTitle,
  isChatGroupTitle,
} from './chatGroupDisplay'
import {
  CHAT_GROUP_MEMBER,
  CHAT_GROUP_MODERATOR,
  CHAT_GROUP_OWNER,
  managesChatGroup,
} from '@/utils/chatGroupRoles'

/** `t` and `d` as a test reads them back: the key, its values, the plural number. */
const t = (key, values) =>
  typeof values === 'number'
    ? `${key}:${values}`
    : values
      ? `${key} ${JSON.stringify(values)}`
      : key
const d = (date, format) => `${format}(${date.toISOString()})`

describe('chatGroupDisplay', () => {
  describe('the letters of a group', () => {
    it('are the first letters of the first two words', () => {
      expect(chatGroupLetters('Gradido-Café Berlin')).toBe('GB')
      expect(chatGroupLetters('gemeinschaftsgarten pankow nord')).toBe('GP')
    })

    // As a person's circle always shows two (aliasLetters).
    it('are the first two letters of a name of one word', () => {
      expect(chatGroupLetters('Gartenfreunde')).toBe('GA')
    })

    it('pass over a word without a letter', () => {
      expect(chatGroupLetters('🌻 Garten')).toBe('GA')
      expect(chatGroupLetters('– Garten – Pankow')).toBe('GP')
    })

    // ⛔ Whole characters: an emoji is two code units, and half of one is no character at all.
    it('never take half a character', () => {
      expect(chatGroupLetters('𝔊arten 𝔅erlin')).toBe('𝔊𝔅')
      expect(Array.from(chatGroupLetters('𝔊arten 𝔅erlin'))).toHaveLength(2)
    })

    it('are letters of any script, in upper case', () => {
      expect(chatGroupLetters('café ölberg')).toBe('CÖ')
      expect(chatGroupLetters('Москва Берлин')).toBe('МБ')
      expect(chatGroupLetters('2026 Treffen')).toBe('2T')
    })

    // One character for one letter: "ß" in upper case is "SS", and a square has room for two.
    it('stay two characters where a letter grows in upper case', () => {
      expect(chatGroupLetters('ßpaß Runde')).toBe('SR')
    })

    it('are none for a name without letters, or no name', () => {
      expect(chatGroupLetters('🌻 🌻')).toBe('')
      expect(chatGroupLetters('')).toBe('')
      expect(chatGroupLetters(null)).toBe('')
      expect(chatGroupLetters(undefined)).toBe('')
    })
  })

  describe("the group's square", () => {
    it('shows the letters, rounded, coloured from what it shows', () => {
      expect(chatGroupAvatar({ title: 'Gradido-Café Berlin' })).toEqual({
        initials: 'GB',
        colorSeed: 'GB',
        shape: 'rounded',
      })
    })

    // ⛔ Given, even where it is empty: an ABSENT seed would make AppAvatar colour from `name`.
    it('hands a seed also where there are no letters', () => {
      expect(chatGroupAvatar({ title: '🌻' }).colorSeed).toBe('')
      expect(chatGroupAvatar(null).colorSeed).toBe('')
    })

    // No picture of its own (E-050 F3), so nothing that would make it zoomable.
    it('carries no picture', () => {
      expect(chatGroupAvatar({ title: 'Garten' })).not.toHaveProperty('src')
      expect(chatGroupAvatar({ title: 'Garten' })).not.toHaveProperty('zoomable')
    })
  })

  describe("the line under a group's name", () => {
    it('says how many and when the latest message came', () => {
      expect(
        chatGroupMeta({ memberCount: 5, lastMessageAt: '2026-09-29T07:02:00.000Z' }, { t, d }),
      ).toBe('chatGroup.memberCount:5 · contacts.last {"date":"short(2026-09-29T07:02:00.000Z)"}')
    })

    it('says only how many while there is no message yet', () => {
      expect(chatGroupMeta({ memberCount: 1, lastMessageAt: null }, { t, d })).toBe(
        'chatGroup.memberCount:1',
      )
    })
  })

  describe('the parts', () => {
    it("names the member's own part", () => {
      expect(chatGroupOwnPart(CHAT_GROUP_OWNER, { t })).toBe('chatGroup.youAreOwner')
      expect(chatGroupOwnPart(CHAT_GROUP_MODERATOR, { t })).toBe('chatGroup.youAreModerator')
      expect(chatGroupOwnPart(CHAT_GROUP_MEMBER, { t })).toBe('chatGroup.youAreMember')
    })

    // A server one version ahead may know a part this wallet has no word for.
    it('says nothing for a part it does not know', () => {
      expect(chatGroupOwnPart('ADMIRAL', { t })).toBe('')
      expect(chatGroupPartMark('ADMIRAL', { t })).toBe('')
    })

    it('marks the owner and the moderators, and no plain member', () => {
      expect(chatGroupPartMark(CHAT_GROUP_OWNER, { t })).toBe('chatGroup.owner')
      expect(chatGroupPartMark(CHAT_GROUP_MODERATOR, { t })).toBe('chatGroup.moderator')
      expect(chatGroupPartMark(CHAT_GROUP_MEMBER, { t })).toBe('')
    })

    // E-050 F4: the owner and up to five moderators take people in and out and rename.
    it('lets the owner and the moderators manage, and nobody else', () => {
      expect(managesChatGroup(CHAT_GROUP_OWNER)).toBe(true)
      expect(managesChatGroup(CHAT_GROUP_MODERATOR)).toBe(true)
      expect(managesChatGroup(CHAT_GROUP_MEMBER)).toBe(false)
      expect(managesChatGroup(undefined)).toBe(false)
    })

    // The enum NAMES as they come over the wire (the GraphQL enum ChatGroupRole).
    it('knows the parts by the names the server sends', () => {
      expect([CHAT_GROUP_OWNER, CHAT_GROUP_MODERATOR, CHAT_GROUP_MEMBER]).toEqual([
        'OWNER',
        'MODERATOR',
        'MEMBER',
      ])
    })
  })

  describe('a refusal of the server', () => {
    const said = (message) => chatGroupRefusal(new Error(message), { t })

    it('is said in the words for its reason', () => {
      expect(said('CHAT_GROUP_NOT_CREATED: TITLE')).toBe('chatGroup.refusedTitle')
      expect(said('CHAT_GROUP_NOT_CREATED: OTHER_COMMUNITY')).toBe(
        'chatGroup.refusedOtherCommunity',
      )
      expect(said('CHAT_GROUP_NOT_CHANGED: NOT_A_CONTACT')).toBe('chatGroup.refusedNotAContact')
      expect(said('CHAT_GROUP_NOT_CHANGED: UNKNOWN_MEMBER')).toBe('chatGroup.refusedUnknownMember')
      expect(said('CHAT_GROUP_NOT_CREATED: FULL')).toBe('chatGroup.refusedFull')
      expect(said('CHAT_GROUP_NOT_CHANGED: NOT_ALLOWED')).toBe('chatGroup.refusedNotAllowed')
      expect(said('CHAT_GROUP_NOT_CHANGED: NOT_A_MEMBER')).toBe('chatGroup.refusedNotAMember')
    })

    // The server's number (backend ChatGroup.logic, CHAT_GROUP_MAX_MODERATORS) -- the two change
    // together; the sentence takes it as a digit.
    it('names how many moderators a group has', () => {
      expect(CHAT_GROUP_MAX_MODERATORS).toBe(5)
      expect(said('CHAT_GROUP_NOT_CHANGED: TOO_MANY_MODERATORS')).toBe(
        'chatGroup.refusedTooManyModerators {"n":5}',
      )
    })

    // Gone, or no longer in it: the server does not tell the two apart, and neither do the words.
    it('says a group is gone where the server does not find it for the member', () => {
      expect(said('GraphQL error: CHAT_GROUP_NOT_FOUND')).toBe('chatGroup.refusedNotFound')
    })

    // A reason this wallet does not know, no connection, a right not given yet (401).
    it('is the general sentence for anything else', () => {
      expect(said('CHAT_GROUP_NOT_CHANGED: SOMETHING_NEW')).toBe('chatGroup.refused')
      expect(said('401 Unauthorized')).toBe('chatGroup.refused')
      expect(chatGroupRefusal(null, { t })).toBe('chatGroup.refused')
    })
  })

  // The server's rule (ChatGroup.logic): white space made one, trimmed, 1 to 100 characters.
  describe("a group's name", () => {
    it('is what the server keeps of what was typed', () => {
      expect(chatGroupTitle('  Gradido   Café\n Berlin ')).toBe('Gradido Café Berlin')
    })

    it('has one to a hundred characters, an emoji counted as one', () => {
      expect(isChatGroupTitle('   ')).toBe(false)
      expect(isChatGroupTitle('G')).toBe(true)
      expect(isChatGroupTitle('x'.repeat(CHAT_GROUP_TITLE_MAX))).toBe(true)
      expect(isChatGroupTitle('x'.repeat(CHAT_GROUP_TITLE_MAX + 1))).toBe(false)
      expect(isChatGroupTitle('🌻'.repeat(CHAT_GROUP_TITLE_MAX))).toBe(true)
      expect(CHAT_GROUP_TITLE_MAX).toBe(100)
    })
  })
})

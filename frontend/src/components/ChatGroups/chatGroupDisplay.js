// AI-GENERATED — not an architecture reference

import { CONTACT_META_SEPARATOR } from '@/components/Contacts/contactDisplay'
import { CHAT_GROUP_MEMBER, CHAT_GROUP_MODERATOR, CHAT_GROUP_OWNER } from '@/utils/chatGroupRoles'

/**
 * How a chat group (P5) is drawn wherever it stands: its square, the line under its name, the
 * words for the parts its members play. One place, so the list, the window and the member list
 * cannot come to draw one group three ways.
 */

/** Between the parts of a group's lines -- the contact row's, so the two lists read alike. */
export const CHAT_GROUP_META_SEPARATOR = CONTACT_META_SEPARATOR

/** A letter or a digit of any script -- what may stand in a group's square. */
const LETTER = /[\p{L}\p{N}]/u

/** The letters of a word, whole characters -- an emoji is two code units, never half of one. */
const lettersOf = (word) => Array.from(word).filter((char) => LETTER.test(char))

/** One letter as the square shows it: upper case, and one character ("ß" is "S", not "SS"). */
const upper = (char) => Array.from(char.toUpperCase())[0]

/**
 * The two letters a group's square shows (D §8, the mockup): the first letter of each of the
 * first two words of its name -- "Gradido-Café Berlin" is "GB" -- or, for a name of one word, its
 * first two letters -- "Gartenfreunde" is "GA", as a person's circle always shows two.
 *
 * A word without a letter in it (an emoji, a dash) is passed over: "🌻 Garten" is "GA". A name
 * with no letter at all shows none, and the colour then comes from the empty seed.
 *
 * @param {string | null | undefined} title the group's name as the server keeps it
 * @returns {string} two letters in upper case, one where the name has only one, or ''
 */
export const chatGroupLetters = (title) => {
  const words = String(title ?? '')
    .split(/\s+/)
    .map(lettersOf)
    .filter((letters) => letters.length > 0)
  if (words.length === 0) return ''
  const picked = words.length >= 2 ? [words[0][0], words[1][0]] : words[0].slice(0, 2)
  return picked.map(upper).join('')
}

/**
 * Everything AppAvatar needs to draw a group's square: its letters, the colour drawn from them,
 * the rounded shape. No picture: a group has none of its own yet (E-050 F3), so nothing here is
 * zoomable either.
 *
 * ⛔ The colour seed is given, not left to AppAvatar: an ABSENT seed makes it colour from
 * `name`, and a group passes none -- given, the square is coloured by exactly the letters it
 * shows, so two groups that read alike look alike, and a renamed group takes the colour of its
 * new letters.
 *
 * @param {{ title?: string } | null} group
 */
export const chatGroupAvatar = (group) => {
  const letters = chatGroupLetters(group?.title)
  return { initials: letters, colorSeed: letters, shape: 'rounded' }
}

/**
 * "5 Mitglieder · zuletzt 29.09.26": how many, and when the latest message arrived -- only the
 * count while the group has no message yet. The row's line; the separator is the contact row's,
 * so the two lists read alike.
 *
 * `t` and `d` come from the caller's `useI18n()`: this file is not a setup scope.
 */
export const chatGroupMeta = (group, { t, d }) =>
  [
    t('chatGroup.memberCount', group.memberCount),
    group.lastMessageAt
      ? t('contacts.last', { date: d(new Date(group.lastMessageAt), 'short') })
      : '',
  ]
    .filter(Boolean)
    .join(CHAT_GROUP_META_SEPARATOR)

/**
 * "Du bist Inhaber": the member's own part, for the window's head.
 *
 * ⛔ The three keys written out, not built from the role (`chatGroup.youAre.${role}`): the i18n
 * lint counts only literal keys (Falle 6 of the build plan), and a server one version ahead could
 * name a part this wallet has no word for -- here it says nothing then.
 */
export const chatGroupOwnPart = (role, { t }) => {
  switch (role) {
    case CHAT_GROUP_OWNER:
      return t('chatGroup.youAreOwner')
    case CHAT_GROUP_MODERATOR:
      return t('chatGroup.youAreModerator')
    case CHAT_GROUP_MEMBER:
      return t('chatGroup.youAreMember')
    default:
      return ''
  }
}

/**
 * The mark beside a member in the member list: "Inhaber", "Moderator" -- nothing for a plain
 * member, whom the list does not need to mark. Written out for the same two reasons.
 */
export const chatGroupPartMark = (role, { t }) => {
  switch (role) {
    case CHAT_GROUP_OWNER:
      return t('chatGroup.owner')
    case CHAT_GROUP_MODERATOR:
      return t('chatGroup.moderator')
    default:
      return ''
  }
}

/**
 * Why the server refused a change to a group (P5), in the member's words: the reason after
 * CHAT_GROUP_NOT_CREATED or CHAT_GROUP_NOT_CHANGED, or CHAT_GROUP_NOT_FOUND -- a group that is gone,
 * or that the member is no longer in, which the server does not tell apart. Anything else -- no
 * connection, a right the account does not have yet (401 before the address is confirmed) --
 * is the general sentence.
 *
 * ⛔ Each key written out, not built from the reason: the i18n lint counts only literal keys
 * (Falle 6), and a reason this wallet does not know says the general sentence rather than a raw
 * key.
 *
 * @param {{ message?: string } | null | undefined} error what the mutation threw
 * @param {{ t: Function }} i18n the caller's `t`
 */
export const chatGroupRefusal = (error, { t }) => {
  const message = String(error?.message ?? '')
  if (message.includes('CHAT_GROUP_NOT_FOUND')) return t('chatGroup.refusedNotFound')
  const reason = /CHAT_GROUP_NOT_(?:CREATED|CHANGED): ([A-Z_]+)/.exec(message)?.[1]
  switch (reason) {
    case 'TITLE':
      return t('chatGroup.refusedTitle')
    case 'OTHER_COMMUNITY':
      return t('chatGroup.refusedOtherCommunity')
    case 'NOT_A_CONTACT':
      return t('chatGroup.refusedNotAContact')
    case 'UNKNOWN_MEMBER':
      return t('chatGroup.refusedUnknownMember')
    case 'FULL':
      return t('chatGroup.refusedFull')
    case 'NOT_ALLOWED':
      return t('chatGroup.refusedNotAllowed')
    case 'NOT_A_MEMBER':
      return t('chatGroup.refusedNotAMember')
    case 'TOO_MANY_MODERATORS':
      return t('chatGroup.refusedTooManyModerators')
    default:
      return t('chatGroup.refused')
  }
}

/**
 * What a group's name may be (the server's rule, ChatGroup.logic): its runs of white space made
 * one, trimmed, 1 to 100 characters -- whole characters, as an emoji is one. The wallet checks it
 * before asking, so the button waits instead of the server refusing.
 */
export const CHAT_GROUP_TITLE_MAX = 100

export const chatGroupTitle = (typed) =>
  String(typed ?? '')
    .replace(/\s+/g, ' ')
    .trim()

export const isChatGroupTitle = (typed) => {
  const length = Array.from(chatGroupTitle(typed)).length
  return length >= 1 && length <= CHAT_GROUP_TITLE_MAX
}

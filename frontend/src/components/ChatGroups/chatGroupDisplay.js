// AI-GENERATED — not an architecture reference

import { CONTACT_META_SEPARATOR } from '@/components/Contacts/contactDisplay'

/**
 * How a chat group (P5) is drawn wherever it stands: its square, the line under its name, the
 * words for the parts its members play. One place, so the list, the window and the member list
 * cannot come to draw one group three ways.
 */

/**
 * The parts a member plays in a group, as the server names them (the GraphQL enum
 * `ChatGroupRole`, which goes over the wire by its NAME). The wallet does not import `shared`,
 * so they are strings here, pinned by the specs.
 */
export const CHAT_GROUP_OWNER = 'OWNER'
export const CHAT_GROUP_MODERATOR = 'MODERATOR'
export const CHAT_GROUP_MEMBER = 'MEMBER'

/** Whether a member in this part may take people in, take them out and rename (E-050 F4). */
export const managesChatGroup = (role) => role === CHAT_GROUP_OWNER || role === CHAT_GROUP_MODERATOR

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
    .join(CONTACT_META_SEPARATOR)

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

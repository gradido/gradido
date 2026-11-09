// AI-GENERATED — not an architecture reference
import { type MemberRef, memberKey } from '@/data/Member.logic'
import type { ThreadMessage } from './Contribution.schema'

export type MessagePart = { type: 'text' | 'link' | 'date' | 'amount'; text: string }

const LINK =
  /(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*))/i

/**
 * A message as the parts it shows: text and links; a change's record (HISTORY) besides as the old
 * date, text and amount it holds. A record of another shape shows as it came.
 */
export const messageParts = (message: string, type: string): MessagePart[] => {
  let rest = message
  const parts: MessagePart[] = []
  let amount: string | undefined
  if (type === 'HISTORY') {
    const split = rest.split(/\n\s*---\n\s*/)
    if (split.length >= 3) {
      // a text that holds the dashes itself keeps them; the amount is the last part
      rest = split.slice(1, -1).join('\n---\n')
      parts.push({ type: 'date', text: split[0].trim() })
      amount = split[split.length - 1].trim()
    }
  }
  for (let match = rest.match(LINK); match; match = rest.match(LINK)) {
    const index = match.index ?? 0
    if (index > 0) {
      parts.push({ type: 'text', text: rest.substring(0, index) })
    }
    parts.push({ type: 'link', text: match[0] })
    rest = rest.substring(index + match[0].length)
  }
  if (rest.length > 0) {
    parts.push({ type: 'text', text: rest })
  }
  if (amount) {
    parts.push({ type: 'amount', text: amount })
  }
  return parts
}

/**
 * A text as HTML with its **bold** runs bold, and nothing else: escaped first, as messages come
 * from members too. Across line breaks as well: the shortcut wraps whatever is selected.
 */
export const withBold = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>')

// the forms a change is recorded in: Date.prototype.toString, and a decimal with a point
const RECORD_DATE = /^[A-Z][a-z]{2} [A-Z][a-z]{2} \d{2} \d{4} \d{2}:\d{2}:\d{2} GMT[+-]\d{4}\b/
const RECORD_AMOUNT = /^-?\d+(\.\d+)?$/

/** The date of a change's record, where it is in the form one is written in. */
export const recordDate = (text: string) => {
  const date = new Date(text)
  return RECORD_DATE.test(text) && !Number.isNaN(date.getTime()) ? date : null
}

/** The amount of a change's record, where it is in the form one is written in. */
export const recordAmount = (text: string) => (RECORD_AMOUNT.test(text) ? Number(text) : null)

/**
 * Who asked the open question, where it was a colleague: the newest message of the conversation
 * -- the notes left out, as on the server -- is a question of a moderator other than `moderator`.
 * A note written then takes the resubmission back. Null where no question is open, where the
 * moderator asked it, and where the thread is not all here: a page of it may miss the newest.
 */
export const colleagueQuestion = (
  status: string,
  messages: ThreadMessage[],
  count: number,
  moderator: MemberRef | null,
) => {
  if (status !== 'IN_PROGRESS' || !moderator?.gradidoID || count > messages.length) {
    return null
  }
  const newest = messages
    .filter((message) => message.type !== 'MODERATOR')
    .reduce<ThreadMessage | undefined>((latest, message) => {
      if (!latest) {
        return message
      }
      const later = new Date(message.createdAt).getTime() - new Date(latest.createdAt).getTime()
      return later > 0 || (later === 0 && message.id > latest.id) ? message : latest
    }, undefined)
  if (newest?.type !== 'DIALOG' || !newest.isModerator || !newest.userGradidoID) {
    return null
  }
  const asker = memberKey({
    gradidoID: newest.userGradidoID,
    communityUuid: newest.userCommunityUuid,
  })
  return asker === memberKey(moderator) ? null : { name: newest.userAlias ?? '' }
}

// AI-GENERATED — not an architecture reference
import { ContributionMessageType } from '@/graphql/enum/ContributionMessageType'

/** What the conversation of a contribution reads of one of its messages. */
type ConversationMessage = {
  id: number
  type: string
  isModerator: boolean
  createdAt: Date
}

/** The newest of the messages by the time it was written, the later id where two share it. */
const newestMessage = <T extends ConversationMessage>(messages: readonly T[]): T | undefined =>
  messages.reduce<T | undefined>((latest, message) => {
    if (!latest) {
      return message
    }
    const later = message.createdAt.getTime() - latest.createdAt.getTime()
    return later > 0 || (later === 0 && message.id > latest.id) ? message : latest
  }, undefined)

/**
 * The newest message of the conversation with the member: a dialog message, or the history entry
 * a change of the contribution leaves. The moderators' internal notes are no part of it. Newest by
 * the time it was written, the later id where two share it. Undefined where nothing was said.
 *
 * It tells whose word is the last and of which kind: the member's answer, the member's change, or
 * a moderator's question or change (the admin's details button, 24.10.2026).
 */
export const lastConversationMessage = <T extends ConversationMessage>(
  messages: readonly T[],
): T | undefined =>
  newestMessage(messages.filter((message) => message.type !== ContributionMessageType.MODERATOR))

/**
 * Whether a colleague's internal note is the newest word on an open question (Bernd, 06.11.2026):
 * the newest message of the whole thread is a moderator's note, and the newest message of the
 * conversation with the member is a moderator's question that somebody else asked. The moderator
 * who asked sees by it that a colleague reacted -- often by passing on what the member said
 * elsewhere. A note of the one who asked answers nothing, and the next message of the conversation
 * (the member's answer, a new question) ends it.
 */
export const colleagueNoteOnQuestion = (
  messages: readonly (ConversationMessage & { userId: number })[],
): boolean => {
  const newest = newestMessage(messages)
  const question = lastConversationMessage(messages)
  // No test of the newest message's type: where it is no note, it is the question itself, with the
  // asker's own id, and the last line says no.
  return (
    question?.type === ContributionMessageType.DIALOG &&
    question.isModerator &&
    newest !== undefined &&
    newest.userId !== question.userId
  )
}

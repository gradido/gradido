// AI-GENERATED — not an architecture reference
import { ContributionMessageType } from '@/graphql/enum/ContributionMessageType'

/** What the conversation of a contribution reads of one of its messages. */
type ConversationMessage = {
  id: number
  type: string
  isModerator: boolean
  createdAt: Date
}

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
  messages
    .filter((message) => message.type !== ContributionMessageType.MODERATOR)
    .reduce<T | undefined>((latest, message) => {
      if (!latest) {
        return message
      }
      const later = message.createdAt.getTime() - latest.createdAt.getTime()
      return later > 0 || (later === 0 && message.id > latest.id) ? message : latest
    }, undefined)

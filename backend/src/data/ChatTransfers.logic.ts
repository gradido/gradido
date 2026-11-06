// AI-GENERATED — not an architecture reference
import type { ChatMemberRef, UnreadReceivedTransfers } from 'database'

/*
 * Received transfers the member has not seen (Chat E-086, Bernd, 26.10.2026): they count as unread
 * as a message does -- the gold dot at the person, the bold line under the name, the mark in the
 * menu. The rules here are plain; the reading is dbSelectUnreadReceivedTransfers in
 * database/src/queries/transactions.ts.
 */

/** A person's pair as a key, without regard to case: the uuid columns compare it that way. */
export const transferPersonKey = (pair: ChatMemberRef): string =>
  `${pair.communityUuid}/${pair.gradidoId}`.toLowerCase()

/**
 * How many persons with an unread transfer the conversations do not count already: the mark in
 * the menu counts a person once, whether a message or a transfer of theirs waits, or both.
 */
export const personsWithOnlyTransfersUnread = (
  transfers: Map<string, UnreadReceivedTransfers>,
  partnersWithUnreadMessages: ChatMemberRef[],
): number => {
  const counted = new Set(partnersWithUnreadMessages.map(transferPersonKey))
  return [...transfers.keys()].filter((key) => !counted.has(key)).length
}

/**
 * What the chat's beat hands on about the transfers, so that the wallet asks its lists again
 * when one arrives or is seen: how many wait in all, and the newest of them -- null where none
 * does. A transfer that arrives raises both; one that is seen lowers the first.
 */
export const unreadTransfersSummary = (
  transfers: Map<string, UnreadReceivedTransfers>,
): { count: number; latestId: number | null } => {
  let count = 0
  let latestId: number | null = null
  for (const entry of transfers.values()) {
    count += entry.count
    latestId = latestId === null ? entry.latestId : Math.max(latestId, entry.latestId)
  }
  return { count, latestId }
}

// AI-GENERATED — not an architecture reference
import {
  dbSelectTransactionReadsStart,
  dbSelectUnreadReceivedTransfers,
  UnreadReceivedTransfers,
} from 'database'
import { unreadTransfersByPerson } from '@/data/ChatTransfers.logic'

/**
 * Where the counting of unread transfers begins on this server (migration 0165): read once in a
 * process -- it never changes once the migration ran --, and read again after a failure.
 */
let start: Promise<number> | null = null

export const transactionReadsStart = (): Promise<number> => {
  if (!start) {
    start = dbSelectTransactionReadsStart().catch((error) => {
      start = null
      throw error
    })
  }
  return start
}

/**
 * The transfers `user` received and has not seen, per person (Chat E-086) -- none where the
 * member switched transfers out of their conversations ("Überweisungen im Chat und per E-Mail"):
 * there they stand nowhere the member reads them, and nothing could ever mark them seen.
 */
export const unreadTransfersOfUser = async (user: {
  id: number
  transfersInChat: boolean | null
}): Promise<Map<string, UnreadReceivedTransfers>> => {
  if (user.transfersInChat === false) {
    return new Map()
  }
  const afterId = await transactionReadsStart()
  return unreadTransfersByPerson(await dbSelectUnreadReceivedTransfers(user.id, afterId))
}

// AI-GENERATED — not an architecture reference
import { dbSelectUnreadReceivedTransfers, UnreadReceivedTransfers } from 'database'
import { transferPersonKey } from '@/data/ChatTransfers.logic'

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
  const rows = await dbSelectUnreadReceivedTransfers(user.id)
  return new Map(rows.map((row) => [transferPersonKey(row.sender), row]))
}

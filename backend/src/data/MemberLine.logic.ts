// AI-GENERATED — not an architecture reference
const lines = new Map<number, Promise<unknown>>()

/**
 * Runs `work` after everything already queued for this member; a failed predecessor does not block.
 *
 * Per process: the backend runs as one, and a second process would not see this line (E-021).
 * Not reentrant: `work` must not queue for the same member again, it would wait for itself.
 */
export const inMemberLine = async <T>(userId: number, work: () => Promise<T>): Promise<T> => {
  const before = lines.get(userId) ?? Promise.resolve()
  const mine = before.catch(() => undefined).then(work)
  lines.set(userId, mine)
  try {
    return await mine
  } finally {
    if (lines.get(userId) === mine) {
      lines.delete(userId)
    }
  }
}

/** How many members have somebody in their line right now: none once nobody waits. For tests. */
export const membersInLine = (): number => lines.size

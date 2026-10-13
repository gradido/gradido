// AI-GENERATED — not an architecture reference
import {
  User as DbUser,
  dbInsertMatchingEntry,
  dbSelectMatchingEntryByUuid,
  MatchingEntryContent,
  MatchingEntryInsert,
  MatchingEntrySelect,
} from 'database'
import { v4 as uuidv4 } from 'uuid'
import { matchingKeyingRun } from '@/apis/anthropic/matching/keyingRun'
import { LogError } from '@/server/LogError'
import { syncMatchingEntryToGms } from './syncMatchingEntryToGms'

/**
 * Making a new entry of a member's, in the steps the wallet's "save" has always taken
 * (`createMatchingEntry`): stored live, read back, handed to the GMS, and the keying run told.
 * They stand here because a second way makes entries now -- the one an event link noted at a
 * registration is made when the address is confirmed (makeEventMatchingEntry) -- and an entry
 * made there is to be an entry like any other.
 */

/**
 * The stored row after a write, for the answer and for the GMS.
 *
 * Read back rather than assembled from the input: `created_at` and `updated_at` belong
 * to the database, and both the member's list order and the GMS copy are built from
 * them. A row missing here is not an expected failure — it was written a moment ago.
 */
export const readBackMatchingEntry = async (uuid: string): Promise<MatchingEntrySelect> => {
  const result = await dbSelectMatchingEntryByUuid(uuid)
  if (!result.success) {
    throw new LogError('MatchingEntry vanished right after it was written', uuid)
  }
  return result.value
}

/** The row of a new entry of this member's: under a uuid of its own, and live. */
export const newMatchingEntryRow = (
  userId: number,
  content: MatchingEntryContent,
): MatchingEntryInsert => ({ uuid: uuidv4(), userId, ...content, active: true })

/** A new, live entry of this member's: stored, handed to the GMS, and the keying run told. */
export async function createMatchingEntryFor(
  user: DbUser,
  content: MatchingEntryContent,
): Promise<MatchingEntrySelect> {
  const row = newMatchingEntryRow(user.id, content)
  const inserted = await dbInsertMatchingEntry(row)
  if (!inserted.success) {
    throw new LogError('Could not store MatchingEntry', row.uuid)
  }

  const entry = await readBackMatchingEntry(row.uuid)
  await syncMatchingEntryToGms(user, entry)
  // Returns at once: the words are worked out by a language model, which takes
  // seconds and can fail, and neither belongs in the member's save button. Until
  // the run has been round, the entry is stored and served but not yet findable by
  // word - the same trade the GMS makes with its vectors.
  matchingKeyingRun.nudge()
  return entry
}

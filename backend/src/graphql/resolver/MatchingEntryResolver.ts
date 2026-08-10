// AI-GENERATED — not an architecture reference
import {
  dbDeleteMatchingEntryByUuid,
  dbInsertMatchingEntry,
  dbSelectMatchingEntriesByUserId,
  dbSelectMatchingEntryByUuid,
  dbSetMatchingEntryActive,
  dbUpdateMatchingEntry,
  MatchingEntrySelect,
} from 'database'
import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { v4 as uuidv4 } from 'uuid'
import { RIGHTS } from '@/auth/RIGHTS'
import { MatchingEntryInput } from '@/graphql/input/MatchingEntryInput'
import { MatchingEntry } from '@/graphql/model/MatchingEntry'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'
import { removeMatchingEntryFromGms, syncMatchingEntryToGms } from './util/syncMatchingEntryToGms'

/**
 * The entry behind this uuid, and only if it is the caller's own.
 *
 * The two failures are kept apart on purpose: "no such entry" and "not yours" are
 * different answers, and a member who mistypes a uuid should not be told the same thing
 * as one who reaches for someone else's.
 */
const findOwnEntry = async (uuid: string, userId: number): Promise<MatchingEntrySelect> => {
  const result = await dbSelectMatchingEntryByUuid(uuid)
  if (!result.success) {
    throw new LogError('MatchingEntry not found', uuid)
  }
  if (result.value.userId !== userId) {
    throw new LogError('Can not access MatchingEntry of another user', uuid, userId)
  }
  return result.value
}

/**
 * The stored row after a write, for the answer and for the GMS.
 *
 * Read back rather than assembled from the input: `created_at` and `updated_at` belong
 * to the database, and both the member's list order and the GMS copy are built from
 * them. A row missing here is not an expected failure — it was written a moment ago.
 */
const readBackEntry = async (uuid: string): Promise<MatchingEntrySelect> => {
  const result = await dbSelectMatchingEntryByUuid(uuid)
  if (!result.success) {
    throw new LogError('MatchingEntry vanished right after it was written', uuid)
  }
  return result.value
}

@Resolver(() => MatchingEntry)
export class MatchingEntryResolver {
  @Authorized([RIGHTS.LIST_MATCHING_ENTRY])
  @Query(() => [MatchingEntry])
  async listMatchingEntries(@Ctx() context: Context): Promise<MatchingEntry[]> {
    const user = getUser(context)
    const entries = await dbSelectMatchingEntriesByUserId(user.id)
    return entries.map((entry) => new MatchingEntry(entry))
  }

  @Authorized([RIGHTS.CREATE_MATCHING_ENTRY])
  @Mutation(() => MatchingEntry)
  async createMatchingEntry(
    @Arg('input', () => MatchingEntryInput) input: MatchingEntryInput,
    @Ctx() context: Context,
  ): Promise<MatchingEntry> {
    const user = getUser(context)
    const uuid = uuidv4()
    const inserted = await dbInsertMatchingEntry({
      uuid,
      userId: user.id,
      matchingType: input.matchingType,
      summary: input.summary,
      details: input.details ?? null,
      remote: input.remote ?? false,
      active: true,
    })
    if (!inserted.success) {
      throw new LogError('Could not store MatchingEntry', uuid)
    }

    const entry = await readBackEntry(uuid)
    await syncMatchingEntryToGms(user, entry)
    return new MatchingEntry(entry)
  }

  @Authorized([RIGHTS.UPDATE_MATCHING_ENTRY])
  @Mutation(() => MatchingEntry)
  async updateMatchingEntry(
    @Arg('uuid', () => String) uuid: string,
    @Arg('input', () => MatchingEntryInput) input: MatchingEntryInput,
    @Ctx() context: Context,
  ): Promise<MatchingEntry> {
    const user = getUser(context)
    await findOwnEntry(uuid, user.id)
    const updated = await dbUpdateMatchingEntry(uuid, {
      matchingType: input.matchingType,
      summary: input.summary,
      details: input.details ?? null,
      remote: input.remote ?? false,
    })
    if (!updated.success) {
      throw new LogError('Could not update MatchingEntry', uuid)
    }

    const entry = await readBackEntry(uuid)
    await syncMatchingEntryToGms(user, entry)
    return new MatchingEntry(entry)
  }

  @Authorized([RIGHTS.UPDATE_MATCHING_ENTRY])
  @Mutation(() => MatchingEntry)
  async setMatchingEntryActive(
    @Arg('uuid', () => String) uuid: string,
    @Arg('active', () => Boolean) active: boolean,
    @Ctx() context: Context,
  ): Promise<MatchingEntry> {
    const user = getUser(context)
    await findOwnEntry(uuid, user.id)
    const changed = await dbSetMatchingEntryActive(uuid, active)
    if (!changed.success) {
      throw new LogError('Could not change MatchingEntry state', uuid)
    }

    const entry = await readBackEntry(uuid)
    // Pausing removes it from the GMS, resuming puts it back - the sync reads the
    // state and does the right thing either way.
    await syncMatchingEntryToGms(user, entry)
    return new MatchingEntry(entry)
  }

  @Authorized([RIGHTS.DELETE_MATCHING_ENTRY])
  @Mutation(() => Boolean)
  async deleteMatchingEntry(
    @Arg('uuid', () => String) uuid: string,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const user = getUser(context)
    await findOwnEntry(uuid, user.id)
    const deleted = await dbDeleteMatchingEntryByUuid(uuid)
    if (!deleted.success) {
      throw new LogError('Could not delete MatchingEntry', uuid)
    }

    // The row is gone here; the GMS copy has to follow, and a lost delete would
    // leave it behind for good - so this one is retried.
    await removeMatchingEntryFromGms(uuid)
    return true
  }
}

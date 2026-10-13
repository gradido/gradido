// AI-GENERATED — not an architecture reference
import {
  dbDeleteMatchingEntryByUuid,
  dbSelectMatchingEntriesByUserId,
  dbSelectMatchingEntryByUuid,
  dbSetMatchingEntryActive,
  dbUpdateMatchingEntry,
  MatchingEntrySelect,
} from 'database'
import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { matchingKeyingRun } from '@/apis/anthropic/matching/keyingRun'
import { RIGHTS } from '@/auth/RIGHTS'
import { MatchingEntryInput } from '@/graphql/input/MatchingEntryInput'
import { MatchingEntry } from '@/graphql/model/MatchingEntry'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'
import { createMatchingEntryFor, readBackMatchingEntry } from './util/createMatchingEntryFor'
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
    // Stored, read back, handed to the GMS and to the keying run: the steps of a new entry,
    // shared with the one an event link noted (util/createMatchingEntryFor).
    const entry = await createMatchingEntryFor(user, {
      matchingType: input.matchingType,
      summary: input.summary,
      details: input.details ?? null,
      remote: input.remote ?? false,
    })
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
    const stored = await findOwnEntry(uuid, user.id)
    // The stored row goes in, not just the uuid: an edit to the sentence, the channel
    // or the details makes the keying describe something the member no longer wrote,
    // and clearing it is what puts the entry back on the keying run's list.
    const updated = await dbUpdateMatchingEntry(stored, {
      matchingType: input.matchingType,
      summary: input.summary,
      details: input.details ?? null,
      remote: input.remote ?? false,
    })
    if (!updated.success) {
      throw new LogError('Could not update MatchingEntry', uuid)
    }

    const entry = await readBackMatchingEntry(uuid)
    await syncMatchingEntryToGms(user, entry)
    matchingKeyingRun.nudge()
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

    const entry = await readBackMatchingEntry(uuid)
    // Pausing removes it from the GMS, resuming puts it back - the sync reads the
    // state and does the right thing either way.
    await syncMatchingEntryToGms(user, entry)
    // Resuming an entry that was paused before it was ever keyed puts it on the
    // list; pausing takes it off. Either way the run is the one that sorts it out.
    matchingKeyingRun.nudge()
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

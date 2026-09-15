// AI-GENERATED — not an architecture reference
import { and, eq, inArray, or, sql } from 'drizzle-orm'
import { drizzleDb } from '../AppDatabase'
import {
  ForeignMemberAvatarDateInsert,
  foreignMemberAvatarDatesTable,
} from '../schemas/drizzle.schema'

/** A member of another community, as a booking and the wallet name them: the uuid pair. */
export interface ForeignMemberRef {
  communityUuid: string
  gradidoId: string
}

/**
 * The key {@link dbSelectForeignMemberAvatarDates} files each date under. Exported so the
 * reader builds the same string the map was filled with, instead of a second copy of it.
 */
export const foreignMemberAvatarDateKey = ({ communityUuid, gradidoId }: ForeignMemberRef) =>
  `${communityUuid}/${gradidoId}`

/**
 * The picture dates of these members of other communities, as the refresh last stored them
 * (AS-019) -- for a whole page of a list in one query.
 *
 * A pair without a row is missing from the map; a pair whose community said it has nothing to
 * show maps to null. The lists read both as null (`?? null`): nobody needs to tell "no answer
 * yet" from "answered, nothing there" today.
 *
 * The same member may be named many times -- a booking list names the counterparty once per
 * booking -- and is asked about once. Grouped by community, so the lookup is one
 * `community_uuid = ? AND gradido_id IN (…)` per community, which the primary key answers.
 */
export async function dbSelectForeignMemberAvatarDates(
  refs: ForeignMemberRef[],
): Promise<Map<string, Date | null>> {
  // ⛔ Not only a shortcut: `or()` of nothing is no condition at all, and the query below
  // would hand back every row of the table.
  if (refs.length === 0) {
    return new Map()
  }
  const byCommunity = new Map<string, Set<string>>()
  for (const { communityUuid, gradidoId } of refs) {
    const ids = byCommunity.get(communityUuid) ?? new Set<string>()
    ids.add(gradidoId)
    byCommunity.set(communityUuid, ids)
  }

  const rows = await drizzleDb()
    .select({
      communityUuid: foreignMemberAvatarDatesTable.communityUuid,
      gradidoId: foreignMemberAvatarDatesTable.gradidoId,
      avatarUpdatedAt: foreignMemberAvatarDatesTable.avatarUpdatedAt,
    })
    .from(foreignMemberAvatarDatesTable)
    .where(
      or(
        ...[...byCommunity].map(([communityUuid, ids]) =>
          and(
            eq(foreignMemberAvatarDatesTable.communityUuid, communityUuid),
            inArray(foreignMemberAvatarDatesTable.gradidoId, [...ids]),
          ),
        ),
      ),
    )

  return new Map(rows.map((row) => [foreignMemberAvatarDateKey(row), row.avatarUpdatedAt]))
}

/**
 * Stores what a community answered about its members' picture dates, one row per pair,
 * replacing what was stored before -- a changed picture brings its new date, a withdrawn one
 * brings null.
 *
 * ⛔ Each row takes its OWN values on a duplicate (`VALUES(col)`), not one value for all:
 * one statement carries a whole block of up to a hundred members, some with a date, some
 * without.
 *
 * No `affectedRows` check: an upsert answers 1 for a new row, 2 for a changed one and 0 for a
 * row that already held the value -- the most common case of all here, a date that did not
 * change -- so the counter cannot tell success from failure. A failed write throws.
 */
export async function dbUpsertForeignMemberAvatarDates(
  rows: ForeignMemberAvatarDateInsert[],
): Promise<void> {
  if (rows.length === 0) {
    return
  }
  await drizzleDb()
    .insert(foreignMemberAvatarDatesTable)
    .values(rows)
    .onDuplicateKeyUpdate({
      set: {
        avatarUpdatedAt: sql`values(${sql.identifier(foreignMemberAvatarDatesTable.avatarUpdatedAt.name)})`,
        checkedAt: sql`values(${sql.identifier(foreignMemberAvatarDatesTable.checkedAt.name)})`,
      },
    })
}

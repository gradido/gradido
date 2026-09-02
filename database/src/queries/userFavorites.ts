// AI-GENERATED — not an architecture reference
import { and, eq, sql } from 'drizzle-orm'
import { VoidResult } from 'shared'
import { drizzleDb } from '../AppDatabase'
import { DBNotFoundError } from '../errorTypes'
import {
  UserFavoriteInsert,
  UserFavoriteSelect,
  userFavoritesTable,
} from '../schemas/drizzle.schema'

const UserFavoriteNotFound = (where: string) => new DBNotFoundError('user_favorites', where)

/**
 * The favourite as the wallet addresses it: the uuid pair of the person marked.
 *
 * Never the alias -- it changes, the pair does not (see migration 0128).
 */
export interface FavoriteRef {
  communityUuid: string
  gradidoId: string
}

/**
 * Everyone this member has marked, oldest heart first.
 *
 * The pair breaks ties: two hearts given within the same millisecond would otherwise come
 * back in whatever order the storage engine chose, and a list that changes its order between
 * two reads is a list nobody can compare.
 */
export async function dbSelectFavoritesByUserId(userId: number): Promise<UserFavoriteSelect[]> {
  return drizzleDb()
    .select()
    .from(userFavoritesTable)
    .where(eq(userFavoritesTable.userId, userId))
    .orderBy(
      userFavoritesTable.createdAt,
      userFavoritesTable.favoriteCommunityUuid,
      userFavoritesTable.favoriteGradidoId,
    )
}

/**
 * Marks somebody as a favourite. Marking them twice is not a failure but the same heart:
 * the primary key catches the duplicate and the statement leaves the row as it is -- a
 * double tap on a phone must not turn into an error message.
 *
 * Plain `void` on purpose: with valid input this always succeeds, so there is no expected
 * failure to model (AGENTS.md, "functions that always succeed on valid input").
 */
export async function dbInsertFavorite(row: UserFavoriteInsert): Promise<void> {
  await drizzleDb()
    .insert(userFavoritesTable)
    .values(row)
    // No-op update: keeps `created_at` of the first heart and makes the insert idempotent.
    .onDuplicateKeyUpdate({ set: { userId: sql`${userFavoritesTable.userId}` } })
}

/** Takes the heart away. Not found IS an expected outcome here: two taps, one row. */
export async function dbDeleteFavorite(
  userId: number,
  favorite: FavoriteRef,
): Promise<VoidResult<DBNotFoundError>> {
  const result = await drizzleDb()
    .delete(userFavoritesTable)
    .where(
      and(
        eq(userFavoritesTable.userId, userId),
        eq(userFavoritesTable.favoriteCommunityUuid, favorite.communityUuid),
        eq(userFavoritesTable.favoriteGradidoId, favorite.gradidoId),
      ),
    )
  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true }
  }
  return {
    success: false,
    error: UserFavoriteNotFound(
      `user_id = ${userId} AND favorite = ${favorite.communityUuid}/${favorite.gradidoId}`,
    ),
  }
}

/**
 * Every heart this member ever gave -- for the day an account is removed for good. There
 * is no foreign key to do this (users are soft-deleted, so a cascade would never fire),
 * which makes it a code obligation; this is the function that discharges it. Returns how
 * many rows went, and zero is a perfectly good answer.
 */
export async function dbDeleteFavoritesByUserId(userId: number): Promise<number> {
  const result = await drizzleDb()
    .delete(userFavoritesTable)
    .where(eq(userFavoritesTable.userId, userId))
  return result[0]?.affectedRows ?? 0
}

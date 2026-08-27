// AI-GENERATED — not an architecture reference
import { eq, lt } from 'drizzle-orm'
import { Result } from 'shared'
import { drizzleDb } from '../AppDatabase'
import { DBNotFoundError } from '../errorTypes'
import {
  AssistedRegistrationInsert,
  AssistedRegistrationSelect,
  assistedRegistrationsTable,
} from '../schemas/drizzle.schema'

// TODO: replace results with valibot schema after update to typescript 5 is possible

const AssistedRegistrationNotFound = (where: string) =>
  new DBNotFoundError('assisted_registrations', where)

/**
 * Parks a registration attempt whose address rang an existing member's doorbell
 * (EM-013). Written from createUser's multi-registration branch, and only when the
 * attempt carried a redeem code — the café case. The row is what the helper link in
 * the member's mail points at.
 */
export async function dbInsertAssistedRegistration(row: AssistedRegistrationInsert): Promise<void> {
  await drizzleDb().insert(assistedRegistrationsTable).values(row)
}

/**
 * The row behind a helper link. Whether the code is still inside its validity window is
 * the caller's question — this only answers whether the code exists at all. A miss is an
 * expected result (mistyped, already used, purged), not an error.
 */
export async function dbFindAssistedRegistrationByCode(
  assistCode: bigint,
): Promise<Result<AssistedRegistrationSelect, DBNotFoundError>> {
  const rows = await drizzleDb()
    .select()
    .from(assistedRegistrationsTable)
    .where(eq(assistedRegistrationsTable.assistCode, assistCode))
    .limit(1)

  const row = rows.at(0)
  return row
    ? { success: true, value: row }
    : { success: false, error: AssistedRegistrationNotFound(`assistCode = ${assistCode}`) }
}

/**
 * Removes a parked attempt once the account has been created from it. Deliberately not
 * part of the account-creation transaction: that one is TypeORM, this is Drizzle, and a
 * TypeORM transaction does not cover Drizzle writes (AGENTS.md). Nothing depends on the
 * two being atomic — a row that survives an aborted delete simply expires.
 */
export async function dbDeleteAssistedRegistration(id: number): Promise<void> {
  await drizzleDb().delete(assistedRegistrationsTable).where(eq(assistedRegistrationsTable.id, id))
}

/**
 * Lazy cleanup, same pattern as expired e-mail changes: called whenever a new attempt is
 * parked, so the table never grows past what one validity window can hold.
 */
export async function dbPurgeExpiredAssistedRegistrations(cutoff: Date): Promise<void> {
  await drizzleDb()
    .delete(assistedRegistrationsTable)
    .where(lt(assistedRegistrationsTable.createdAt, cutoff))
}

import { eq, sql } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { Ed25519PublicKey } from 'shared'
import { In, Not } from 'typeorm'
import {
  CommunityHandshakeState,
  CommunityHandshakeStateType,
  DrizzleTransaction,
  drizzleDb,
} from '..'
import {
  CommunityHandshakeStatesInsert,
  communityHandshakeStatesTable,
} from '../schemas/drizzle.schema'

/**
 * Find a pending community handshake by public key.
 * @param publicKey The public key of the community.
 * @param apiVersion The API version of the community.
 * @param status The status of the community handshake. Optional, if not set, it will find a pending community handshake.
 * @returns The CommunityHandshakeState with associated federated community and community.
 */
export function findPendingCommunityHandshake(
  publicKey: Ed25519PublicKey,
  apiVersion: string,
  status?: CommunityHandshakeStateType,
): Promise<CommunityHandshakeState | null> {
  return CommunityHandshakeState.findOne({
    where: {
      publicKey: publicKey.asBuffer(),
      apiVersion,
      status:
        status ||
        Not(
          In([
            CommunityHandshakeStateType.EXPIRED,
            CommunityHandshakeStateType.FAILED,
            CommunityHandshakeStateType.SUCCESS,
          ]),
        ),
    },
  })
}

export function findPendingCommunityHandshakeOrFailByOneTimeCode(
  oneTimeCode: number,
): Promise<CommunityHandshakeState> {
  return CommunityHandshakeState.findOneOrFail({
    where: { oneTimeCode },
  })
}

export async function dbInsertCommunityHandshakeState(
  handshakeState: CommunityHandshakeStatesInsert,
  tx: DrizzleTransaction | MySql2Database = drizzleDb(),
): Promise<number> {
  const rows = await tx.insert(communityHandshakeStatesTable).values(handshakeState)
  return rows[0].insertId
}

// return: affected rows
export async function dbUpdateCommunityHandshakeStateError(
  id: number,
  error: string,
): Promise<number> {
  const rows = await drizzleDb()
    .update(communityHandshakeStatesTable)
    .set({ lastError: error, status: CommunityHandshakeStateType.FAILED })
    .where(eq(communityHandshakeStatesTable.id, id))
  return rows[0].affectedRows
}

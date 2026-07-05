import { Ed25519PublicKey } from 'shared'
import { drizzleDb } from '../AppDatabase'
import { communityHandshakeStatesTable, CommunityHandshakeStateType, CommunityHandshakeStateInsert, CommunityHandshakeStateSelect } from '..'
import { and, eq, notInArray } from 'drizzle-orm'

export async function findCommunityHandshakeStateById(id: number): Promise<CommunityHandshakeStateSelect | null> {
  const result = await drizzleDb()
    .select()
    .from(communityHandshakeStatesTable)
    .where(eq(communityHandshakeStatesTable.id, id))
    .limit(1)
  return result[0] || null
}

export async function insertCommunityHandshakeState(state: CommunityHandshakeStateInsert): Promise<CommunityHandshakeStateSelect> {
  const result = await drizzleDb().insert(communityHandshakeStatesTable).values(state)
  if (!result[0]) {
    throw new Error('Failed to insert community handshake state')
  }
  const insertId = result[0].insertId
  const communityHandshakeState = await findCommunityHandshakeStateById(insertId)
  if (!communityHandshakeState) {
    throw new Error('Failed to find community handshake state')
  }
  return communityHandshakeState
}

/**
 * Find a pending community handshake by public key.
 * @param publicKey The public key of the community.
 * @param apiVersion The API version of the community.
 * @param status The status of the community handshake. Optional, if not set, it will find a pending community handshake.
 * @returns The CommunityHandshakeState with associated federated community and community.
 */
export async function findPendingCommunityHandshake(
  publicKey: Ed25519PublicKey,
  apiVersion: string,
  status?: CommunityHandshakeStateType,
): Promise<CommunityHandshakeStateSelect | null> {
  const result = await drizzleDb()
    .select()
    .from(communityHandshakeStatesTable)
    .where(
      and(
        eq(communityHandshakeStatesTable.publicKey, publicKey.asHex()),
        eq(communityHandshakeStatesTable.apiVersion, apiVersion),
        status
          ? notInArray(communityHandshakeStatesTable.status, [
              CommunityHandshakeStateType.EXPIRED,
              CommunityHandshakeStateType.FAILED,
              CommunityHandshakeStateType.SUCCESS,
            ])
          : undefined,
      )
    )
    .limit(1)

  return result[0] || null
}

export async function findPendingCommunityHandshakeOrFailByOneTimeCode(
  oneTimeCode: number,
): Promise<CommunityHandshakeStateSelect> {
  const result = await drizzleDb()
    .select()
    .from(communityHandshakeStatesTable)
    .where(eq(communityHandshakeStatesTable.oneTimeCode, oneTimeCode))
    .limit(1)

  if (!result[0]) {
    throw new Error('Community handshake not found')
  }
  return result[0]
}

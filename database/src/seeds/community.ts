import { randomBytes } from 'node:crypto'
import { v4 as uuidv4 } from 'uuid'
import { drizzleDb } from '../AppDatabase'
import { dbFindCommunityByUuid } from '../queries/communities'
import { CommunitiesInsert, CommunitiesSelect, communitiesTable } from '../schemas'

/**
 * Creates a community and writes it to the db.
 * @param foreign
 * @param values set over the generated ones, for a test that needs a value of its own
 * @returns the row as the db holds it
 */
export async function createCommunity(
  foreign: boolean,
  values: Partial<CommunitiesInsert> = {},
): Promise<CommunitiesSelect> {
  const community: CommunitiesInsert = {
    foreign,
    publicKey: randomBytes(32),
    publicEncryptionKey: randomBytes(32),
    communityUuid: uuidv4(),
    creationDate: new Date(),
    ...(foreign
      ? {
          name: 'ForeignCommunity-name',
          description: 'ForeignCommunity-description',
          url: `http://foreign-${Math.random()}/api`,
          authenticatedAt: new Date(),
        }
      : {
          // todo: generate valid public/private key pair (ed25519)
          privateKey: randomBytes(64),
          privateEncryptionKey: randomBytes(32),
          name: 'HomeCommunity-name',
          description: 'HomeCommunity-description',
          url: 'http://localhost/api',
        }),
    ...values,
  }
  await drizzleDb().insert(communitiesTable).values(community)
  const written = await dbFindCommunityByUuid(community.communityUuid)
  if (!written) {
    throw new Error(`community ${community.communityUuid} was just written and cannot be read`)
  }
  return written
}

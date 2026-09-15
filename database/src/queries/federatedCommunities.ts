// AI-GENERATED — not an architecture reference
import { Result } from 'shared'
import { FederatedCommunity as DbFederatedCommunity } from '../entity'
import { DBNotFoundError } from '../errorTypes'

const FederatedCommunityNotFound = (where: string) =>
  new DBNotFoundError('federated_communities', where)

/**
 * The entry through which another community is reached on one API version.
 *
 * The same lookup core's processXComSendCoins makes inline with `findOneOrFail`; that caller
 * stays as it is, this one serves the member pictures relay. Not found is an expected
 * outcome -- the other community announced no entry for this version, or the DHT has not
 * written it yet -- so it is returned, not thrown.
 */
export async function dbFindFederatedCommunityByPublicKeyAndApi(
  publicKey: Buffer,
  apiVersion: string,
): Promise<Result<DbFederatedCommunity, DBNotFoundError>> {
  const federatedCommunity = await DbFederatedCommunity.findOne({
    where: { publicKey, apiVersion },
  })
  if (!federatedCommunity) {
    return {
      success: false,
      error: FederatedCommunityNotFound(
        `public_key = ${publicKey.toString('hex')} and api_version = ${apiVersion}`,
      ),
    }
  }
  return { success: true, value: federatedCommunity }
}

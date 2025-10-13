import { CommunityHandshakeState } from '../entity'
import { FederatedCommunity } from '../entity/FederatedCommunity'

/**
 * Find a pending community handshake by public key.
 * @param publicKey The public key of the community.
 * @param withRelations Whether to include the federated community and community in the result, default true.
 * @returns The CommunityHandshakeState with associated federated community and community.
 */
export function findPendingCommunityHandshake(federatedCommunity: FederatedCommunity, withRelations = true): Promise<CommunityHandshakeState | null> {
  return CommunityHandshakeState.findOne({
    where: { publicKey: federatedCommunity.publicKey, apiVersion: federatedCommunity.apiVersion },
    relations: withRelations ? { federatedCommunity: { community: true } } : undefined,
  })
}
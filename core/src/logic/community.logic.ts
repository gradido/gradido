import { Community as DbCommunity, FederatedCommunity as DbFederatedCommunity } from 'database'

export function getFederatedCommunityWithApiOrFail(
  community: DbCommunity,
  apiVersion: string,
): DbFederatedCommunity {
  const fedCom = community.federatedCommunities?.find((fedCom) => fedCom.apiVersion === apiVersion)
  if (!fedCom) {
    throw new Error(`Missing federated community with api version ${apiVersion}`)
  }
  return fedCom
}

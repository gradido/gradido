import { Community as DbCommunity, FederatedCommunity as DbFederatedCommunity } from 'database'

export class CommunityLogic {
  public constructor(private self: DbCommunity) {}
  
  public getFederatedCommunityWithApiOrFail(apiVersion: string): DbFederatedCommunity {
    const fedCom = this.self.federatedCommunities?.find((fedCom) => fedCom.apiVersion === apiVersion)
    if (!fedCom) {
      throw new Error(`Missing federated community with api version ${apiVersion}`)
    }
    return fedCom
  }
}
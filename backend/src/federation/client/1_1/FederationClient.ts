/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'

import { FederationClient as FedClient } from '@/federation/client/1_0/FederationClient'
// import { GraphQLError } from 'graphql'
// import { gql } from 'graphql-request'

// import { GraphQLGetClient } from '@/federation/client/GraphQLGetClient'
// import { backendLogger as logger } from '@/server/logger'

export class FederationClient {
  async requestGetPublicKey(dbCom: DbFederatedCommunity): Promise<string | undefined> {
    return await new FedClient().requestGetPublicKey(dbCom)
  }
}

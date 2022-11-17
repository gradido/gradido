import { Resolver, Query, Authorized, Mutation, Args } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import { readHomeCommunity } from '@/dao/CommunityDAO'
import { GetPublicKeyResult } from '../model/GetPublicKeyResult'
import { backendLogger as logger } from '@/server/logger'

@Resolver()
export class FederationResolver {
  @Authorized([RIGHTS.FEDERATE_PUBKEY])
  @Query(() => GetPublicKeyResult)
  async getPublicKey(): Promise<GetPublicKeyResult> {
    logger.info(`getPublicKey()...`)
    const fdCom = await readHomeCommunity()
    logger.info(`getPublicKey()... with publicKey=${fdCom.publicKey}`)
    return new GetPublicKeyResult(fdCom.publicKey)
  }
}

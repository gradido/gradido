import { Resolver, Query, Authorized, Mutation, Args } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import { readHomeCommunity } from '@/dao/CommunityDAO'
import { GetPublicKeyResult } from '../model/GetPublicKeyResult'
import { backendLogger as logger } from '@/server/logger'

/* eslint camelcase: ["error", {allow: ["^v0_"]}] */

@Resolver()
export class FederationResolver {
  @Authorized([RIGHTS.FEDERATE_PUBKEY])
  @Query(() => GetPublicKeyResult)
  async v0_getPublicKey(): Promise<GetPublicKeyResult> {
    logger.info(`getPublicKey()...`)
    const fdCom = await readHomeCommunity()
    logger.info(`getPublicKey()... with publicKey=${fdCom.publicKey}`)
    return new GetPublicKeyResult(fdCom.publicKey)
  }
}

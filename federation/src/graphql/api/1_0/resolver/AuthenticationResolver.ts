// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Arg, Mutation, Resolver } from 'type-graphql'
import { federationLogger as logger } from '@/server/logger'
import { Community as DbCommunity } from '@entity/Community'
import { LogError } from '@/server/LogError'
import { OpenConnectionArgs } from '../model/OpenConnectionArgs'
import {
  startOpenConnectionCallback,
  startOpenConnectionRedirect,
} from '../util/authenticateCommunity'
import { OpenConnectionCallbackArgs } from '../model/OpenConnectionCallbackArgs'
import { ApiVersionType } from '@/client/enum/apiVersionType'

@Resolver()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class AuthenticationResolver {
  @Mutation(() => Boolean)
  async openConnection(
    @Arg('data')
    args: OpenConnectionArgs,
  ): Promise<boolean> {
    logger.debug(`Authentication: openConnection() via apiVersion=1_0 ...`, args)

    // first find with args.publicKey the community, which starts openConnection request
    const requestedCom = await DbCommunity.findOneBy({
      publicKey: Buffer.from(args.publicKey),
    })
    if (!requestedCom) {
      throw new LogError(`unknown requesting community with publicKey`, args.publicKey)
    }
    void startOpenConnectionRedirect(args, requestedCom, ApiVersionType.V1_0)
    return true
  }

  @Mutation(() => Boolean)
  async openConnectionCallback(
    @Arg('data')
    args: OpenConnectionCallbackArgs,
  ): Promise<boolean> {
    logger.debug(`Authentication: openConnectionCallback() via apiVersion=1_0 ...`, args)
    // first find with args.publicKey the community, which invokes openConnectionCallback
    const callbackCom = await DbCommunity.findOneBy({
      publicKey: Buffer.from(args.publicKey),
    })
    if (!callbackCom) {
      throw new LogError(`unknown callback community with publicKey`, args.publicKey)
    }
    void startOpenConnectionCallback(args, callbackCom)
    return true
  }
}

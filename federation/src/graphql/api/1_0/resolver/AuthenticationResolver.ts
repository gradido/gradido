import { CONFIG } from '@/config'
import { LogError } from '@/server/LogError'
import {
  CommunityLoggingView,
  Community as DbCommunity,
  FederatedCommunity as DbFedCommunity,
  FederatedCommunityLoggingView,
} from 'database'
import { getLogger } from 'log4js'
import { Arg, Mutation, Resolver } from 'type-graphql'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { AuthenticationArgs } from '../model/AuthenticationArgs'
import { OpenConnectionArgs } from '../model/OpenConnectionArgs'
import { OpenConnectionCallbackArgs } from '../model/OpenConnectionCallbackArgs'
import { startAuthentication, startOpenConnectionCallback } from '../util/authenticateCommunity'
import { verifyAndDecrypt } from 'backend/src/auth/jwt/JWT'
import { OpenConnectionJwtPayloadType } from 'backend/src/auth/jwt/payloadtypes/OpenConnectionJwtPayloadType'
import { JwtPayloadType } from 'backend/src/auth/jwt/payloadtypes/JwtPayloadType'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.api.1_0.resolver.AuthenticationResolver`)

@Resolver()
export class AuthenticationResolver {
  @Mutation(() => Boolean)
  async openConnection(
    @Arg('data')
    args: OpenConnectionArgs,
  ): Promise<boolean> {
    const pubKeyBuf = Buffer.from(args.publicKey, 'hex')
    logger.debug(`openConnection() via apiVersion=1_0:`, args)

    // first find with args.publicKey the community 'comA', which starts openConnection request
    const comA = await DbCommunity.findOneBy({
      publicKey: pubKeyBuf, // Buffer.from(args.publicKey),
    })
    if (!comA) {
      throw new LogError(`unknown requesting community with publicKey`, pubKeyBuf.toString('hex'))
    }
    if (!comA.publicJwtKey) {
      throw new LogError(`missing publicJwtKey of community with publicKey`, pubKeyBuf.toString('hex'))
    }
    logger.debug(`found requestedCom:`, new CommunityLoggingView(comA))
    // verify the signing of args.jwt with homeCom.privateJwtKey and decrypt args.jwt with comA.publicJwtKey
    const homeCom = await DbCommunity.findOneByOrFail({ foreign: false })
    const openConnectionJwtPayload = await verifyAndDecrypt(args.jwt, homeCom.privateJwtKey!, comA.publicJwtKey) as OpenConnectionJwtPayloadType
    if (!openConnectionJwtPayload) {
      throw new LogError(`invalid payload of community with publicKey`, pubKeyBuf.toString('hex'))
    }
    if (!openConnectionJwtPayload.url) {
      throw new LogError(`invalid url of community with publicKey`, pubKeyBuf.toString('hex'))
    }
    if (openConnectionJwtPayload.tokentype !== OpenConnectionJwtPayloadType.OPEN_CONNECTION_TYPE) {
      throw new LogError(`invalid tokentype of community with publicKey`, pubKeyBuf.toString('hex'))
    }
    /*
    if (openConnectionJwtPayload.expiration < new Date().toISOString()) {
      throw new LogError(`invalid expiration of community with publicKey`, pubKeyBuf.toString('hex'))
    }
    if (openConnectionJwtPayload.issuer !== JwtPayloadType.ISSUER) {
      throw new LogError(`invalid issuer of community with publicKey`, pubKeyBuf.toString('hex'))
    }
    if (openConnectionJwtPayload.audience !== JwtPayloadType.AUDIENCE) {
      throw new LogError(`invalid audience of community with publicKey`, pubKeyBuf.toString('hex'))
    }
    */
    const fedComA = await DbFedCommunity.findOneByOrFail({ publicKey: comA.publicKey })
    if (!openConnectionJwtPayload.url.startsWith(fedComA.endPoint)) {
      throw new LogError(`invalid url of community with publicKey`, pubKeyBuf.toString('hex'))
    }

    // biome-ignore lint/complexity/noVoid: no await to respond immediately and invoke callback-request asynchronously
    void startOpenConnectionCallback(comA, CONFIG.FEDERATION_API)
    return true
  }

  @Mutation(() => Boolean)
  async openConnectionCallback(
    @Arg('data')
    args: OpenConnectionCallbackArgs,
  ): Promise<boolean> {
    logger.debug(`openConnectionCallback() via apiVersion=1_0 ...`, args)
    // TODO decrypt args.url with homeCom.privateJwtKey and verify signing with callbackFedCom.publicKey
    const endPoint = args.url.slice(0, args.url.lastIndexOf('/') + 1)
    const apiVersion = args.url.slice(args.url.lastIndexOf('/') + 1, args.url.length)
    logger.debug(`search fedComB per:`, endPoint, apiVersion)
    const fedComB = await DbFedCommunity.findOneBy({ endPoint, apiVersion })
    if (!fedComB) {
      throw new LogError(`unknown callback community with url`, args.url)
    }
    logger.debug(
      `found fedComB and start authentication:`,
      new FederatedCommunityLoggingView(fedComB),
    )
    // biome-ignore lint/complexity/noVoid: no await to respond immediately and invoke authenticate-request asynchronously
    void startAuthentication(args.oneTimeCode, fedComB)
    return true
  }

  @Mutation(() => String)
  async authenticate(
    @Arg('data')
    args: AuthenticationArgs,
  ): Promise<string | null> {
    logger.debug(`authenticate() via apiVersion=1_0 ...`, args)
    const authCom = await DbCommunity.findOneByOrFail({ communityUuid: args.oneTimeCode })
    logger.debug('found authCom:', new CommunityLoggingView(authCom))
    if (authCom) {
      // TODO decrypt args.uuid with authCom.publicKey
      authCom.communityUuid = args.uuid
      authCom.authenticatedAt = new Date()
      await DbCommunity.save(authCom)
      logger.debug('store authCom.uuid successfully:', new CommunityLoggingView(authCom))
      const homeCom = await DbCommunity.findOneByOrFail({ foreign: false })
      // TODO encrypt homeCom.uuid with homeCom.privateKey
      if (homeCom.communityUuid) {
        return homeCom.communityUuid
      }
    }
    return null
  }
}

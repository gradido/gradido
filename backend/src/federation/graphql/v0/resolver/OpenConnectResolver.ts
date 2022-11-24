import { Resolver, Query, Authorized, Mutation, Args } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import {
  readFederationCommunityByDhtPubKey,
  readFederationCommunityByUrl,
  readHomeCommunity,
  setFedComUUID,
} from '@/dao/CommunityDAO'
import OpenConnectArgs from '../arg/OpenConnectArgs'
import { decryptMessage, SecretKeyCryptographyDecrypt } from '@/util/encryptionTools'
import { backendLogger as logger } from '@/server/logger'
import {
  startOneTimeRequestLoop,
  startRedirectRequestLoop,
} from '@/federation/control/HandshakeControler'
import OpenConnectRedirectArgs from '../arg/OpenConnectRedirectArgs'
import OpenConnectOneTimeArgs from '../arg/OpenConnectOneTimeArgs'

/* eslint camelcase: ["error", {allow: ["^v0_"]}] */

@Resolver()
export class OpenConnectResolver {
  @Authorized([RIGHTS.FEDERATE_OPEN_CONNECTION])
  @Query(() => Boolean)
  async v0_openConnect(
    @Args()
    { pubKey, encryptedUrl }: OpenConnectArgs,
  ): Promise<boolean> {
    logger.debug(`openConnect(pubKey=${pubKey}, encryptedUrl=${encryptedUrl})`)
    // first check if pubKey of rmoteCom exists in my database
    const fedCom = await readFederationCommunityByDhtPubKey(Buffer.from(pubKey, 'hex'))
    if (fedCom) {
      logger.debug(`found fedCom=${JSON.stringify(fedCom)}`)
      const homeCom = await readHomeCommunity()
      logger.debug(`decrypt(encryptedUrl=${encryptedUrl}, privKey=${homeCom.privKey})`)

      const decryptedRemoteUrlBuf = decryptMessage(
        Buffer.from(homeCom.privKey, 'hex'),
        Buffer.from(fedCom.publicKey, 'hex'),
        Buffer.from(encryptedUrl, 'hex'),
      )
      logger.debug(
        `decryptedRemoteUrlBuf=${decryptedRemoteUrlBuf.toString()} === fedCom.url=${fedCom.url}`,
      )
      const decryptedRemoteUrl = decryptedRemoteUrlBuf.toString()
      logger.debug(`decryptedRemoteUrlBuf=${decryptedRemoteUrl}`)

      if (decryptedRemoteUrl && decryptedRemoteUrl === fedCom.url) {
        logger.debug(`matching PubKey and Url of remote fedCom...`)
        // here NO AWAIT to run in background
        startRedirectRequestLoop(homeCom, fedCom)
        return true
      }
    }
    logger.warn(`unknown pubKey in Request openConnect`)
    return false
  }

  @Authorized([RIGHTS.FEDERATE_OPEN_CONNECTION_REDIRECT])
  @Query(() => Boolean)
  async v0_openConnectRedirect(
    @Args()
    { oneTimeCode, url, encryptedRedirectUrl }: OpenConnectRedirectArgs,
  ): Promise<boolean> {
    logger.debug(
      `openConnectRedirect(oneTimeCode=${oneTimeCode}, url=${url}, encryptedUrl=${encryptedRedirectUrl})`,
    )
    const homeCom = await readHomeCommunity()
    const fedCom = await readFederationCommunityByUrl(url)
    const decryptedRedirectUrl = decryptMessage(
      Buffer.from(homeCom.privKey, 'hex'),
      Buffer.from(fedCom.publicKey, 'hex'),
      Buffer.from(encryptedRedirectUrl, 'hex'),
    )
    // here NO AWAIT to run in background
    startOneTimeRequestLoop(homeCom, fedCom, oneTimeCode, decryptedRedirectUrl.toString())
    return true
  }

  @Authorized([RIGHTS.FEDERATE_OPEN_CONNECTION_ONETIME])
  @Query(() => Boolean)
  async v0_openConnectOneTime(
    @Args()
    { oneTimeCode, encryptedUuid }: OpenConnectOneTimeArgs,
  ): Promise<boolean> {
    logger.debug(
      `openConnectOneTime(oneTimeCode=${oneTimeCode}, encryptedUuid=${encryptedUuid})...`,
    )
    const homeCom = await readHomeCommunity()
    const fedCom = await readFederationCommunityByDhtPubKey(Buffer.from(oneTimeCode, 'hex'))
    const decryptedUuid = decryptMessage(
      Buffer.from(homeCom.privKey, 'hex'),
      Buffer.from(fedCom.publicKey, 'hex'),
      Buffer.from(encryptedUuid, 'hex'),
    )
    fedCom.uuid = decryptedUuid.toString()
    logger.debug(`decrypted uuid=${decryptedUuid}`)
    await setFedComUUID(fedCom)
    logger.debug(`openConnectOneTime()...successful`)
    return true
  }
}

import {
  deleteForeignFedComAndApiVersionEntries,
  readFederationCommunityByPubKey,
  setFedComPubkeyVerifiedAt,
  setFedComUUID,
} from '@/dao/CommunityDAO'
import { requestGetPublicKey } from '../client/v0/FederationClient'
import { backendLogger as logger } from '@/server/logger'
import { FdCommunity } from '../graphql/v0/model/FdCommunity'
import CONFIG from '@/config'
import {
  requestOpenConnect,
  requestOpenConnectOneTime,
  requestOpenConnectRedirect,
} from '../client/v0/OpenConnectClient'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const random = require('random-bigint')

export async function startFederationHandshake(
  homeCom: FdCommunity,
  remotePublicKey: Buffer,
): Promise<void> {
  logger.info(`## Federation-Handshake: startFederationHandshake...`)
  try {
    const fedCom = await readFederationCommunityByPubKey(remotePublicKey.toString('hex'))
    logger.info(`## Federation-Handshake: Federation with fedCom=${JSON.stringify(fedCom)}...`)

    const respondedPubKey = await requestGetPublicKey(fedCom)
    if (respondedPubKey && respondedPubKey === fedCom.publicKey) {
      logger.info(`## Federation-Handshake: received identic PubKey from RemoteCommunity...`)
      setFedComPubkeyVerifiedAt(fedCom.id, respondedPubKey)
      logger.info(`## Federation-Handshake: store PublicKey VerificationTime...`)
    }

    logger.info(`## FederationHandshake: requestOpenConnect...`)
    const respondedOpenConnect = await requestOpenConnect(homeCom, fedCom)
    if (!respondedOpenConnect) {
      logger.error(`## Federation-Handshake: requestOpenConnect... FALSE`)
      // fedCom doesn't know homeCome, so remove fedCom from database
      await deleteForeignFedComAndApiVersionEntries(fedCom.id)
    } else {
      logger.info(`## Federation-Handshake: requestOpenConnect... successful`)
    }
    // further handshake actions per request-response loops in FederationClient and -Resolver
  } catch (err) {
    logger.error(`error during federationHandshake: err=${JSON.stringify(err)}`)
  }
  logger.info(`## Federation-Handshake: startFederationHandshake... finished successfully`)
}

export async function startRedirectRequestLoop(
  homeCom: FdCommunity,
  fedCom: FdCommunity,
): Promise<void> {
  logger.info(
    `## Federation-RedirectLoop: startRedirectRequestLoop(homeComId=${homeCom.id}, fedComId=${fedCom.id})...`,
  )
  // TODO prepare redirect-Request with One-Time-Code
  const oneTimeCode = random(64)
  fedCom.uuid = oneTimeCode
  if (!setFedComUUID(fedCom)) {
    logger.error(`Error on storing OneTimeCode in FedCom=${JSON.stringify(fedCom)}`)
  }

  const redirectUrl = `${CONFIG.FEDERATE_COMMUNITY_REDIRECT_URL}:${CONFIG.FEDERATE_COMMUNITY_REDIRECT_PORT}/${CONFIG.FEDERATE_COMMUNITY_REDIRECT_ENDPOINT}`
  const respondedOpenConnectRedirect = await requestOpenConnectRedirect(
    oneTimeCode,
    redirectUrl,
    homeCom,
    fedCom,
  )
  if (!respondedOpenConnectRedirect) {
    logger.error(`## Federation-RedirectLoop: requestOpenConnectRedirect()...FALSE`)
  }
  logger.info(
    `## Federation-RedirectLoop: startRedirectRequestLoop(homeComId=${homeCom.id}, fedComId=${fedCom.id})... successful`,
  )
}

export async function startOneTimeRequestLoop(
  homeCom: FdCommunity,
  fedCom: FdCommunity,
  oneTimeCode: string,
  decryptedRedirectUrl: string,
): Promise<void> {
  logger.info(
    `## Federation-OneTimeLoop: startOneTimeRequestLoop(homeComId=${homeCom.id}, oneTimeCode=${oneTimeCode}, decryptedRemoteUrl=${decryptedRedirectUrl})...`,
  )
  const respondedOpenConnectOneTime = await requestOpenConnectOneTime(
    homeCom,
    fedCom,
    oneTimeCode,
    decryptedRedirectUrl,
  )
  if (!respondedOpenConnectOneTime) {
    logger.error(`## Federation-OneTimeLoop: requestOpenConnectOneTime()...FALSE`)
  }
  logger.info(`## ## Federation-OneTimeLoop: requestOpenConnectOneTime()()... successful`)
}

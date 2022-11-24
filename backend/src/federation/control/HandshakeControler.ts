import {
  deleteForeignFedComAndApiVersionEntries,
  readFederationCommunityByDhtPubKey,
  setFedComDhtPubkeyVerifiedAt,
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
import {
  decryptMessage,
  encryptMessage,
  SecretKeyCryptographyDecrypt,
  SecretKeyCryptographyEncrypt,
  testEncryptDecrypt,
} from '@/util/encryptionTools'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const random = require('random-bigint')

export async function testKeyPairCryptography(
  homeCom: FdCommunity,
  publicKey: Buffer,
  privateKey: Buffer,
): Promise<void> {
  logger.debug(
    `testKeyPairCryptography(pubKey=${publicKey.toString('hex')}, privKey=${privateKey.toString(
      'hex',
    )})`,
  )

  testEncryptDecrypt(homeCom.uuid, publicKey, privateKey)
  /*
  const encryptedUuid = await encryptMessage(privateKey, Buffer.from(homeCom.uuid)) // encryptMessage(privateKey, publicKey, homeCom.uuid)
  logger.debug(`encryptedUuid = ${encryptedUuid.toString('hex')}=${encryptedUuid.length}`)
  logger.debug(`homeCom.uuid  = ${homeCom.uuid}`)

  const decryptedUuid = await decryptMessage(publicKey, encryptedUuid) // await decryptMessage(privateKey, publicKey, encryptedUuid)
  logger.debug(`decryptedUUid = ${decryptedUuid}`)
  logger.debug(`homeCom.uuid  = ${homeCom.uuid}`)
  if (homeCom.uuid !== decryptedUuid.toString('hex')) {
    logger.debug(`!!! gryptography of privateKey is not identic !!!`)
  }
  */
  logger.debug(`testKeyPairCryptography()...successful`)
}

export async function startFederationHandshake(
  homeCom: FdCommunity,
  remoteDhtPublicKey: Buffer,
): Promise<void> {
  logger.info(`## Federation-Handshake: startFederationHandshake...`)
  try {
    const fedCom = await readFederationCommunityByDhtPubKey(remoteDhtPublicKey)
    logger.info(`## Federation-Handshake: Federation with fedCom=${JSON.stringify(fedCom)}...`)

    const respondedDhtPubKey = await requestGetPublicKey(fedCom)
    if (respondedDhtPubKey && respondedDhtPubKey === fedCom.dhtPublicKey) {
      logger.info(`## Federation-Handshake: received identic PubKey from RemoteCommunity...`)
      await setFedComDhtPubkeyVerifiedAt(Buffer.from(fedCom.dhtPublicKey), new Date())
      logger.info(`## Federation-Handshake: store DhtPublicKey VerificationTime...`)
    } else {
      logger.warn(`## Federation-Handshake: received NOT an identic PubKey from RemoteCommunity...`)
      // fedCom url doesn't match with publicKey, so remove fedCom from database
      await deleteForeignFedComAndApiVersionEntries(fedCom.id)
      return
    }

    if (CONFIG.FEDERATE_WITH_OPENCONNECT) {
      logger.info(`## FederationHandshake: requestOpenConnect...`)
      const respondedOpenConnect = await requestOpenConnect(homeCom, fedCom)
      if (!respondedOpenConnect) {
        logger.error(`## Federation-Handshake: requestOpenConnect... FALSE`)
        // fedCom doesn't know homeComes publicKey yet, so reset fedCom.pubKeyVerifiedAt to enable Handshake again
        await setFedComDhtPubkeyVerifiedAt(Buffer.from(fedCom.dhtPublicKey), null)
      } else {
        logger.info(`## Federation-Handshake: requestOpenConnect... successful`)
      }
      // further handshake actions per request-response loops in FederationClient and -Resolver
    } else {
      logger.info(`Federation OpenConnect switched off per configuration...`)
    }
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

  const redirectUrl = `${CONFIG.FEDERATE_COMMUNITY_REDIRECT_URL}:${CONFIG.FEDERATE_COMMUNITY_REDIRECT_PORT}/${CONFIG.FEDERATE_COMMUNITY_APIVERSION}_${CONFIG.FEDERATE_COMMUNITY_REDIRECT_ENDPOINT}`
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
  const respondedRemoteUuid = await requestOpenConnectOneTime(
    homeCom,
    fedCom,
    oneTimeCode,
    decryptedRedirectUrl,
  )
  if (respondedRemoteUuid) {
    logger.debug(`respondedRemoteUuid=${respondedRemoteUuid}`)
    fedCom.uuid = respondedRemoteUuid
    await setFedComUUID(fedCom)
  } else {
    logger.error(`## Federation-OneTimeLoop: requestOpenConnectOneTime()...FALSE`)
  }
  logger.info(`## ## Federation-OneTimeLoop: requestOpenConnectOneTime()()... successful`)
}

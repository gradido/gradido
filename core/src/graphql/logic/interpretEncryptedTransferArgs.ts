import { CommunityLoggingView, Community as DbCommunity, getHomeCommunity } from 'database'
import { getLogger } from 'log4js'
import { Ed25519PublicKey, JwtPayloadType, verifyAndDecrypt } from 'shared'
import { LOG4JS_BASE_CATEGORY_NAME } from '../../config/const'
import { EncryptedTransferArgs } from '../model/EncryptedTransferArgs'

const createLogger = (functionName: string) =>
  getLogger(
    `${LOG4JS_BASE_CATEGORY_NAME}.graphql.logic.interpretEncryptedTransferArgs.${functionName}`,
  )

export const interpretEncryptedTransferArgs = async (
  args: EncryptedTransferArgs,
): Promise<JwtPayloadType | null> => {
  const methodLogger = createLogger('interpretEncryptedTransferArgs')
  methodLogger.addContext('handshakeID', args.handshakeID)
  methodLogger.debug('interpretEncryptedTransferArgs()... args:', args)
  const argsPublicKey = new Ed25519PublicKey(args.publicKey)
  // first find with args.publicKey the community 'requestingCom', which starts the request
  // TODO: maybe use community from caller instead of loading it separately
  const requestingCom = await DbCommunity.findOneBy({ publicKey: argsPublicKey.asBuffer() })
  if (!requestingCom) {
    const errmsg = `unknown requesting community with publicKey ${argsPublicKey.asHex()}`
    methodLogger.error(errmsg)
    throw new Error(errmsg)
  }
  if (!requestingCom.publicJwtKey) {
    const errmsg = `missing publicJwtKey of requesting community with publicKey ${argsPublicKey.asHex()}`
    methodLogger.error(errmsg)
    throw new Error(errmsg)
  }
  methodLogger.debug(`found requestingCom:`, new CommunityLoggingView(requestingCom))
  // verify the signing of args.jwt with homeCom.privateJwtKey and decrypt args.jwt with requestingCom.publicJwtKey
  // TODO: maybe use community from caller instead of loading it separately
  const homeCom = await getHomeCommunity()
  const jwtPayload = (await verifyAndDecrypt(
    args.handshakeID,
    args.jwt,
    homeCom!.privateJwtKey!,
    requestingCom.publicJwtKey,
  )) as JwtPayloadType
  if (!jwtPayload) {
    const errmsg = `invalid payload of community with publicKey ${argsPublicKey.asHex()}`
    methodLogger.error(errmsg)
    throw new Error(errmsg)
  }
  methodLogger.debug('jwtPayload', jwtPayload)
  return jwtPayload
}

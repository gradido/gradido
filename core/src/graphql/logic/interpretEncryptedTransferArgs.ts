import { EncryptedTransferArgs } from '../model/EncryptedTransferArgs'
import { JwtPayloadType } from '../../auth/jwt/payloadtypes/JwtPayloadType'
import { Community as DbCommunity } from 'database'
import { getLogger } from 'log4js'
import { CommunityLoggingView, getHomeCommunity } from 'database'
import { verifyAndDecrypt } from '../../auth/jwt/JWT'
import { LOG4JS_BASE_CATEGORY_NAME } from '../../config/const'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.util.interpretEncryptedTransferArgs`)

export const interpretEncryptedTransferArgs = async (args: EncryptedTransferArgs): Promise<JwtPayloadType | null> => {
  logger.debug('interpretEncryptedTransferArgs()... args:', args)
  // first find with args.publicKey the community 'requestingCom', which starts the request
  const requestingCom = await DbCommunity.findOneBy({ publicKey: Buffer.from(args.publicKey, 'hex') })
  if (!requestingCom) {
    const errmsg = `unknown requesting community with publicKey ${args.publicKey}`
    logger.error(errmsg)
    throw new Error(errmsg)
  }
  if (!requestingCom.publicJwtKey) {
    const errmsg = `missing publicJwtKey of requesting community with publicKey ${args.publicKey}`
    logger.error(errmsg)
    throw new Error(errmsg)
  }
  logger.debug(`found requestingCom:`, new CommunityLoggingView(requestingCom))
  // verify the signing of args.jwt with homeCom.privateJwtKey and decrypt args.jwt with requestingCom.publicJwtKey
  const homeCom = await getHomeCommunity()
  const jwtPayload = await verifyAndDecrypt(args.jwt, homeCom!.privateJwtKey!, requestingCom.publicJwtKey) as JwtPayloadType
  if (!jwtPayload) {
    const errmsg = `invalid payload of community with publicKey ${args.publicKey}`
    logger.error(errmsg)
    throw new Error(errmsg)
  }
  return jwtPayload
}

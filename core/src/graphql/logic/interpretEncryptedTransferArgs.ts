import { EncryptedTransferArgs } from '../model/EncryptedTransferArgs'
import { JwtPayloadType } from '../../auth/jwt/payloadtypes/JwtPayloadType'
import { Community as DbCommunity } from 'database'
import { getLogger } from 'log4js'
import { CommunityLoggingView, getHomeCommunity } from 'database'
import { verifyAndDecrypt } from '../../auth/jwt/JWT'
import { LOG4JS_BASE_CATEGORY_NAME } from '../../config/const'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.util.interpretEncryptedTransferArgs`)

export const interpretEncryptedTransferArgs = async (args: EncryptedTransferArgs): Promise<JwtPayloadType | null> => {
  const pubKeyBuf = Buffer.from(args.publicKey, 'hex')

  // first find with args.publicKey the community 'comA', which starts openConnection request
  const comA = await DbCommunity.findOneBy({ publicKey: pubKeyBuf })
  if (!comA) {
    const errmsg = `unknown requesting community with publicKey ${pubKeyBuf.toString('hex')}`
    logger.error(errmsg)
    throw new Error(errmsg)
  }
  if (!comA.publicJwtKey) {
    const errmsg = `missing publicJwtKey of requesting community with publicKey ${pubKeyBuf.toString('hex')}`
    logger.error(errmsg)
    throw new Error(errmsg)
  }
  logger.debug(`found requestedCom:`, new CommunityLoggingView(comA))
  // verify the signing of args.jwt with homeCom.privateJwtKey and decrypt args.jwt with comA.publicJwtKey
  const homeCom = await getHomeCommunity()
  const jwtPayload = await verifyAndDecrypt(args.jwt, homeCom!.privateJwtKey!, comA.publicJwtKey) as JwtPayloadType
  if (!jwtPayload) {
    const errmsg = `invalid payload of community with publicKey ${pubKeyBuf.toString('hex')}`
    logger.error(errmsg)
    throw new Error(errmsg)
  }
  return jwtPayload
}

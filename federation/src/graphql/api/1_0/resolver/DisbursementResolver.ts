import {
  EncryptedTransferArgs,
  interpretEncryptedTransferArgs,
  processXComCompleteTransaction,
} from 'core'
import { getLogger } from 'log4js'
import { DisburseJwtPayloadType } from 'shared'
import { Arg, Mutation, Resolver } from 'type-graphql'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'

const createLogger = (method: string) =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.api.1_0.resolver.DisbursementResolver.${method}`)

@Resolver()
export class DisbursementResolver {
  @Mutation(() => String)
  async processDisburseJwtOnSenderCommunity(
    @Arg('data')
    args: EncryptedTransferArgs,
  ): Promise<string> {
    const methodLogger = createLogger(`processDisburseJwtOnSenderCommunity`)
    methodLogger.addContext('handshakeID', args.handshakeID)
    if (methodLogger.isDebugEnabled()) {
      methodLogger.debug(`processDisburseJwtOnSenderCommunity() via apiVersion=1_0 ...`, args)
    }
    const authArgs = (await interpretEncryptedTransferArgs(args)) as DisburseJwtPayloadType
    if (!authArgs) {
      const errmsg =
        `invalid disbursement payload of requesting community with publicKey` + args.publicKey
      methodLogger.error(errmsg)
      throw new Error(errmsg)
    }
    if (methodLogger.isDebugEnabled()) {
      methodLogger.debug(`processDisburseJwtOnSenderCommunity() via apiVersion=1_0 ...`, authArgs)
    }
    let result = 'Disbursement of Redeem-Link failed!'
    try {
      if (
        await processXComCompleteTransaction(
          authArgs.sendercommunityuuid,
          authArgs.sendergradidoid,
          authArgs.recipientcommunityuuid,
          authArgs.recipientgradidoid,
          authArgs.amount,
          authArgs.memo,
          authArgs.code,
          authArgs.recipientfirstname,
          authArgs.recipientalias,
        )
      ) {
        result = 'Disbursement of Redeem-Link successfull!'
      }
    } catch (err) {
      result = `Error in Disbursement of Redeem-Link: ` + err
      methodLogger.error(result)
    }
    return result
  }
}

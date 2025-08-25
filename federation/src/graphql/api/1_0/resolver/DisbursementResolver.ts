import { getLogger } from "log4js"
import { Arg, Mutation, Resolver } from "type-graphql"

import { LOG4JS_BASE_CATEGORY_NAME } from "@/config/const"
import { interpretEncryptedTransferArgs } from "core"
import { EncryptedTransferArgs } from "core"
import { DisburseJwtPayloadType } from "shared"

const createLogger = (method: string) => getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.api.1_0.resolver.DisbursementResolver.${method}`)

@Resolver()
export class DisbursementResolver {
  @Mutation(() => String)
  async processDisburseJwtOnSenderCommunity(
    @Arg('data')
    args: EncryptedTransferArgs,
  ): Promise<string> {
    const methodLogger = createLogger(`processDisburseJwtOnSenderCommunity`)
    methodLogger.addContext('handshakeID', args.handshakeID)
    if(methodLogger.isDebugEnabled()) {
      methodLogger.debug(`processDisburseJwtOnSenderCommunity() via apiVersion=1_0 ...`, args)
    }
    const authArgs = await interpretEncryptedTransferArgs(args) as DisburseJwtPayloadType
    if (!authArgs) {
      const errmsg = `invalid disbursement payload of requesting community with publicKey` + args.publicKey
      methodLogger.error(errmsg)
      throw new Error(errmsg)
    }
    if(methodLogger.isDebugEnabled()) {
      methodLogger.debug(`processDisburseJwtOnSenderCommunity() via apiVersion=1_0 ...`, authArgs)
    }
  }
}
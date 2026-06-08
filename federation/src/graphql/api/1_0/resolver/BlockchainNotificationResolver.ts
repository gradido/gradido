import { MutationResult } from 'core'
import { DltConnectorClient } from 'core/src/apis/dltConnector/DltConnectorClient'
import { MutationErrorType } from 'core/src/graphql/enum/MutationErrorType'
import {
  dbSelectDltTransactionByHieroTransactionId,
  dbUpdateWithErrorDltTransaction,
} from 'database'
import { getLogger } from 'log4js'
import { Arg, Mutation, Resolver } from 'type-graphql'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { ConfirmedTransactionInput } from '../input/ConfirmedTransactionInput'
import { InvalidTransactionInput } from '../input/InvalidTransactionInput'

const logger = getLogger(
  `${LOG4JS_BASE_CATEGORY_NAME}.graphql.api.1_0.resolver.BlockchainNotificationResolver`,
)

@Resolver()
export class BlockchainNotificationResolver {
  @Mutation(() => MutationResult)
  async blockchainConfirmedTx(
    @Arg('data') args: ConfirmedTransactionInput,
  ): Promise<MutationResult> {
    logger.debug('Blockchain notification received:', JSON.stringify(args, null, 2))
    const dltConnectorClient = DltConnectorClient.getInstance()
    if (dltConnectorClient) {
      const response = await dltConnectorClient.validateAndDecodeConfirmedTransaction(
        args.transactionBase64,
        args.communityUuid,
      )
      if (response.statusCode === 200 && response.result) {
        logger.debug(
          'validate and decode confirmed transaction result:',
          JSON.stringify(response.result, null, 2),
        )
        if (response.result.valid) {
          const dltTransaction = dbSelectDltTransactionByHieroTransactionId(
            response.result.hieroTransactionId,
          )
        } else {
          logger.error(
            'validate and decode confirmed transaction failed:',
            JSON.stringify(response.result, null, 2),
          )
          return {
            success: false,
            error: {
              name: 'dlt-connector validateAndDecodeConfirmedTransaction',
              message: response.result.error,
              type: MutationErrorType.DLT_CONNECTOR_ERROR,
            },
          }
        }
      } else {
        logger.error(
          'validate and decode confirmed transaction failed:',
          JSON.stringify(response, null, 2),
        )
        return {
          success: false,
          error: {
            name: 'dlt-connector validateAndDecodeConfirmedTransaction',
            message: `HTTP ${response.statusCode}`,
            type: MutationErrorType.HTTP_ERROR,
          },
        }
      }
    }
    return { success: true }
  }

  @Mutation(() => MutationResult)
  async blockchainRejectedTx(@Arg('data') args: InvalidTransactionInput): Promise<MutationResult> {
    const result = await dbUpdateWithErrorDltTransaction(args.hieroTransactionId, args.errorMessage)
    if (result.success) {
      return { success: true }
    }
    logger.error('Missing dltTransaction entry for blockchainRejectedTx call', args)
    return {
      success: false,
      error: { type: MutationErrorType.DB_ENTRY_NOT_FOUND, ...result.error },
    }
  }
}

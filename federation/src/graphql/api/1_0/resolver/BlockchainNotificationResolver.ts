import {
  compareConfirmedTransaction,
  DltConnectorClient,
  MutationErrorType,
  MutationResult,
} from 'core'
import {
  DBNotFoundError,
  dbSelectDltTransactionByHieroTransactionId,
  dbUpdateConfirmedDltTransaction,
  dbUpdateWithErrorDltTransaction,
} from 'database'
import { getLogger } from 'log4js'
import { VoidResult } from 'shared'
import { isGrdtTransactionType } from 'shared-native'
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
    if (!dltConnectorClient) {
      return { success: true }
    }

    const response = await dltConnectorClient.validateAndDecodeConfirmedTransaction(
      args.transactionBase64,
      args.communityUuid,
    )
    // check if the request has worked
    if (response.statusCode !== 200 || !response.result) {
      logger.error('error requesting dlt connector', JSON.stringify(response, null, 2))
      // Gradido don't need to know that we have intern Connection Problems
      return { success: true }
    }

    logger.debug(
      'validate and decode confirmed transaction result:',
      JSON.stringify(response.result, null, 2),
    )
    // check if the result is valid or invalid
    if (!response.result.valid) {
      logger.error(
        'validate and decode confirmed transaction failed:',
        JSON.stringify(response.result, null, 2),
      )
      // this time we tell Gradido Node that something was wrong with the data,
      // so we can log additional data in GradidoNode for debugging across services if neccessary
      return {
        success: false,
        error: {
          name: 'dlt-connector validateAndDecodeConfirmedTransaction',
          message: response.result.error,
          type: MutationErrorType.DLT_CONNECTOR_ERROR,
        },
      }
    }

    const { hieroTransactionId, transactionType, confirmedAt } = response.result
    if (!hieroTransactionId) {
      logger.error('missing hiero transaction id', JSON.stringify(response.result, null, 2))
      // probably error in dlt-connector, don't need to tell GradidoNode
      return { success: true }
    }
    if (!transactionType || !isGrdtTransactionType(transactionType)) {
      logger.error('invalid transaction type', transactionType)
      // probably error in dlt-connector, don't need to tell GradidoNode
      return { success: true }
    }
    if (!confirmedAt || isNaN(Date.parse(confirmedAt))) {
      logger.error('invalid confirmedAt date', confirmedAt)
      // probably error in dlt-connector, don't need to tell GradidoNode
      return { success: true }
    }

    const dltTransactionResult = await dbSelectDltTransactionByHieroTransactionId(
      hieroTransactionId,
      transactionType,
    )
    if (!dltTransactionResult.success) {
      logger.error("Couldn't load dlt transaction row", dltTransactionResult.error)
      // probably our own mistake, didn't need to tell GradidoNode
      return { success: true }
    }
    const compareResult = compareConfirmedTransaction(dltTransactionResult.value, response.result)
    let updateResult: VoidResult<DBNotFoundError>
    if (!compareResult.success) {
      logger.error('Compare Transactions failed', {
        error: compareResult.error,
        db: dltTransactionResult.value,
        dlt: response.result,
        node: args.transactionBase64,
      })
      updateResult = await dbUpdateWithErrorDltTransaction(
        hieroTransactionId,
        compareResult.error.message,
      )
    } else {
      updateResult = await dbUpdateConfirmedDltTransaction(hieroTransactionId, confirmedAt)
    }
    if (!updateResult.success) {
      logger.error("couldn't update dlt transaction", updateResult.error)
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

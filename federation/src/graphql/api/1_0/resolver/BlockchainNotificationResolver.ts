import { compareConfirmedTransaction, MutationErrorType, MutationResult } from 'core'
import {
  DBNotFoundError,
  dbSelectDltTransactionByLedgerAnchor,
  dbUpdateConfirmedDltTransaction,
  dbUpdateWithErrorDltTransaction,
  dbUpdateWithErrorDltTransactionByHieroTransactionId,
  getHomeCommunity,
} from 'database'
import { getLogger } from 'log4js'
import { VoidResult } from 'shared'
import { CompleteTransaction } from 'shared-native'
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

    const homeCommunity = await getHomeCommunity()
    if (homeCommunity?.communityUuid !== args.communityUuid) {
      logger.warn('Notification for non Home-Community')
      return {
        success: false,
        error: {
          name: 'community uuid check',
          message: "community uuid don't belong to home community",
          type: MutationErrorType.UNKNOWN_COMMUNITY,
        },
      }
    }

    const tx = new CompleteTransaction()
    const initFromProtobufResult = tx.initFromProtobuf(
      new Uint8Array(Buffer.from(args.transactionBase64, 'base64')),
      args.communityUuid,
    )
    if (!initFromProtobufResult.success) {
      logger.error('decode confirmed transaction failed:', initFromProtobufResult.error)
      return {
        success: false,
        error: {
          name: initFromProtobufResult.error.name,
          message: initFromProtobufResult.error.message,
          type: MutationErrorType.PROTOBUF_DECODE_ERROR,
        },
      }
    }
    const validateResult = tx.validate(true)
    if (!validateResult.success) {
      logger.error('validate confirmed transaction failed:', validateResult.error)
      return {
        success: false,
        error: {
          name: validateResult.error.name,
          message: validateResult.error.message,
          type: MutationErrorType.VALIDATION_ERROR,
        },
      }
    }

    const transactionType = tx.getTransactionType()
    const ledgerAnchor = tx.getLedgerAnchor()

    const dltTransactionResult = await dbSelectDltTransactionByLedgerAnchor(
      ledgerAnchor,
      transactionType,
    )
    if (!dltTransactionResult.success) {
      logger.error("Couldn't load dlt transaction row", dltTransactionResult.error)
      // probably our own mistake, didn't need to tell GradidoNode
      return { success: true }
    }

    const compareResult = compareConfirmedTransaction(dltTransactionResult.value, tx)
    let updateResult: VoidResult<DBNotFoundError>
    if (!compareResult.success) {
      logger.error('Compare Transactions failed', {
        error: compareResult.error,
        db: dltTransactionResult.value,
        node: args.transactionBase64,
      })
      updateResult = await dbUpdateWithErrorDltTransaction(
        dltTransactionResult.value.dltTransaction.id,
        compareResult.error.message,
      )
    } else {
      updateResult = await dbUpdateConfirmedDltTransaction(
        dltTransactionResult.value.dltTransaction.id,
        tx.getConfirmedAt().toISOString(),
      )
    }
    if (!updateResult.success) {
      logger.error("couldn't update dlt transaction", updateResult.error)
    }

    return { success: true }
  }

  @Mutation(() => MutationResult)
  async blockchainRejectedTx(@Arg('data') args: InvalidTransactionInput): Promise<MutationResult> {
    const result = await dbUpdateWithErrorDltTransactionByHieroTransactionId(
      args.hieroTransactionId,
      args.errorMessage,
    )
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

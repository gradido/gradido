import { compareConfirmedTransaction, MutationErrorType, MutationResult } from 'core'
import {
  DBNotFoundError,
  dbUpdateConfirmedDltTransaction,
  dbUpdateWithErrorDltTransaction,
  dbUpdateWithErrorDltTransactionByHieroTransactionId,
  getHomeCommunityDrizzle,
  resolveDltTransactionByLedgerAnchor,
} from 'database'
import { getLogger } from 'log4js'
import { CompleteTransaction, VoidResult } from 'shared'
import { MonotonicTimer } from 'shared-native'
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
    const timeUsed = new MonotonicTimer()
    logger.debug('Blockchain notification received:', JSON.stringify(args, null, 2))
    try {
      const homeCommunity = await getHomeCommunityDrizzle()
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
      const initFromProtobufResult = tx.initFromProtobuf(args.transactionBase64, args.communityUuid)
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

      const dltTransactionResult = await resolveDltTransactionByLedgerAnchor(
        ledgerAnchor,
        transactionType,
      )
      if (!dltTransactionResult.success) {
        logger.error("Couldn't load dlt transaction row", dltTransactionResult.error)
        // probably our own mistake, didn't need to tell GradidoNode
        return { success: true }
      }

      const dltTransactionId = dltTransactionResult.value.dltTransaction.id
      // load balance taking pending transaction links into account
      // will also sync tx balance and balance date with confirmed transaction confirmedAt
      const compareResult = await compareConfirmedTransaction(dltTransactionResult.value, tx, true)

      let updateResult: VoidResult<DBNotFoundError>
      if (!compareResult.success) {
        logger.error('Compare Transactions failed', {
          error: compareResult.error,
          db: dltTransactionResult.value,
          node: args.transactionBase64,
        })
        updateResult = await dbUpdateWithErrorDltTransaction(
          dltTransactionId,
          compareResult.error.message,
        )
      } else {
        updateResult = await dbUpdateConfirmedDltTransaction(dltTransactionId, tx.getConfirmedAt())
      }
      if (!updateResult.success) {
        logger.error("couldn't update dlt transaction", updateResult.error)
      } else if (!compareResult.success) {
        logger.error(
          `Error on confirming Transaction by GradidoNode for dltTransaction.id = ${dltTransactionId}`,
          compareResult.error,
        )
      } else {
        logger.info(
          `Success on confirming Transaction by GradidoNode for dltTransaction.id = ${dltTransactionId}`,
        )
      }
    } catch (e) {
      logger.fatal(e)
    }
    logger.info(`blockchainConfirmedTx: ${timeUsed}`)
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

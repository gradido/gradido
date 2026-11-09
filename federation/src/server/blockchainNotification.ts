// AI-GENERATED — not an architecture reference
import { compareConfirmedTransaction } from 'core'
import {
  dbUpdateConfirmedDltTransaction,
  dbUpdateWithErrorDltTransaction,
  dbUpdateWithErrorDltTransactionByHieroTransactionId,
  getHomeCommunityDrizzle,
  resolveDltTransactionByLedgerAnchor,
} from 'database'
import { Elysia, status } from 'elysia'
import { getLogger } from 'log4js'
import { CompleteTransaction, uuidv4Schema } from 'shared'
import { MonotonicTimer } from 'shared-native'
import * as v from 'valibot'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.blockchainNotification`)

/**
 * The GradidoNode tells this community what became of the transactions the dlt-connector sent:
 * confirmed on the ledger, or rejected. The node runs on this host, started by the dlt-connector,
 * and posts plain JSON (its `blockchainUriType: 'json'`), the community in the path.
 *
 * ⛔ Not under /api or /peer-api: nginx does not hand this path on to federation (its public
 * /dlt goes to the node's own api), so only a caller on this host reaches it. That is the whole
 * protection -- the node signs nothing.
 *
 * The node does not read the answer; the status is for the log of whoever looks.
 */
export const blockchainNotificationRoutes = new Elysia({ prefix: 'blockchain-notification/v1' })
  .onError(({ error }) => {
    logger.error('blockchain notification failed', error)
  })
  .post(
    'confirmedTransaction/:communityUuid',
    async ({ params: { communityUuid }, body: { transactionBase64 } }) => {
      const timer = new MonotonicTimer()
      const homeCommunity = await getHomeCommunityDrizzle()
      if (homeCommunity.communityUuid !== communityUuid) {
        logger.warn('notification for another community than this one', communityUuid)
        return status('Not Found')
      }

      const tx = new CompleteTransaction()
      const decoded = tx.initFromProtobuf(transactionBase64, communityUuid)
      if (!decoded.success) {
        logger.error('decode confirmed transaction failed:', decoded.error)
        return status('Bad Request')
      }
      const validated = tx.validate(true)
      if (!validated.success) {
        logger.error('validate confirmed transaction failed:', validated.error)
        return status('Bad Request')
      }

      const found = await resolveDltTransactionByLedgerAnchor(
        tx.getLedgerAnchor(),
        tx.getTransactionType(),
      )
      if (!found.success) {
        // most likely a mistake of this side, nothing the node could do about it
        logger.error("couldn't load dlt transaction row", found.error)
        return true
      }

      const { id } = found.value.dltTransaction
      // also syncs balance and balance date of the transaction with the confirmation
      const compared = await compareConfirmedTransaction(found.value, tx, true)
      if (!compared.success) {
        logger.error(`confirmed transaction does not match dltTransaction.id = ${id}`, {
          error: compared.error,
          node: transactionBase64,
        })
      }
      const updated = compared.success
        ? await dbUpdateConfirmedDltTransaction(id, tx.getConfirmedAt())
        : await dbUpdateWithErrorDltTransaction(id, compared.error.message)
      if (!updated.success) {
        logger.error("couldn't update dlt transaction", updated.error)
      }
      logger.info(`confirmation of dltTransaction.id = ${id} handled after ${timer}`)
      return true
    },
    {
      params: v.object({ communityUuid: uuidv4Schema }),
      body: v.object({ transactionBase64: v.string() }),
    },
  )
  .post(
    'rejectedTransaction',
    async ({ body: { error, hieroTransactionId } }) => {
      const result = await dbUpdateWithErrorDltTransactionByHieroTransactionId(
        hieroTransactionId,
        error,
      )
      if (!result.success) {
        logger.error('no dlt transaction for a rejected transaction', hieroTransactionId)
        return status('Not Found')
      }
      return true
    },
    { body: v.object({ error: v.string(), hieroTransactionId: v.string() }) },
  )

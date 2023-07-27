import { IsNull } from '@dbTools/typeorm'
import { DltTransaction } from '@entity/DltTransaction'
import { Transaction } from '@entity/Transaction'

import { DltConnectorClient } from '@/apis/DltConnectorClient'
import { backendLogger as logger } from '@/server/logger'
import { Monitor, MonitorNames } from '@/util/Monitor'

export async function sendTransactionsToDltConnector(): Promise<void> {
  logger.info('sendTransactionsToDltConnector...')
  // check if this logic is still occupied, no concurrecy allowed
  if (!Monitor.isLocked(MonitorNames.SEND_DLT_TRANSACTIONS)) {
    // mark this block for occuption to prevent concurrency
    Monitor.lockIt(MonitorNames.SEND_DLT_TRANSACTIONS)

    try {
      await createDltTransactions()
      const dltConnector = DltConnectorClient.getInstance()
      if (dltConnector) {
        const dltTransactions = await DltTransaction.find({
          where: { messageId: IsNull() },
          relations: ['transaction'],
          order: { createdAt: 'ASC', id: 'ASC' },
        })
        for (const dltTx of dltTransactions) {
          logger.debug('sending dltTx=', dltTx)
          if (dltTx.transaction && (dltTx.transaction ?? false)) {
            try {
              const messageId = await dltConnector.transmitTransaction(dltTx.transaction)
              logger.debug('received messageId=', messageId)
              const dltMessageId = Buffer.from(messageId, 'hex')
              logger.debug('dltMessageId as Buffer=', dltMessageId)
              if (dltMessageId.length !== 32) {
                logger.error(
                  'Error dlt message id is invalid: %s, should by 32 Bytes long in binary after converting from hex',
                  dltMessageId,
                )
                return
              }
              dltTx.messageId = dltMessageId.toString()
              await DltTransaction.save(dltTx)
              logger.info('store messageId=%s in dltTx=%d', dltTx.messageId, dltTx.id)
            } catch (e) {
              logger.error(
                `error while sending to dlt-connector or writing messageId of dltTx=${dltTx.id}`,
                e,
              )
            }
          }
        }
      }
    } catch (e) {
      logger.error('error on sending transactions to dlt-connector.', e)
    } finally {
      // releae Monitor occupation
      Monitor.releaseIt(MonitorNames.SEND_DLT_TRANSACTIONS)
    }
  } else {
    logger.info('sendTransactionsToDltConnector currently locked by monitor...')
  }
}

async function createDltTransactions(): Promise<void> {
  const dltqb = DltTransaction.createQueryBuilder().select('transactions_id')
  const newTransactions: Transaction[] = await Transaction.createQueryBuilder()
    .select('id')
    .addSelect('balance_date')
    .where('id NOT IN (' + dltqb.getSql() + ')')
    // eslint-disable-next-line camelcase
    .orderBy({ balance_date: 'ASC', id: 'ASC' })
    .getRawMany()

  const dltTxArray: DltTransaction[] = []
  let idx = 0
  while (newTransactions.length > dltTxArray.length) {
    // timing problems with  for(let idx = 0; idx < newTransactions.length; idx++) {
    const dltTx = DltTransaction.create()
    dltTx.transactionId = newTransactions[idx++].id
    await DltTransaction.save(dltTx)
    dltTxArray.push(dltTx)
  }
}

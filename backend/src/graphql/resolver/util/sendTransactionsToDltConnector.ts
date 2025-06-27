import { DltTransaction, Transaction } from 'database'
import { IsNull } from 'typeorm'

import { DltConnectorClient } from '@dltConnector/DltConnectorClient'

import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { Monitor, MonitorNames } from '@/util/Monitor'
import { getLogger } from 'log4js'

const logger = getLogger(
  `${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.util.sendTransactionsToDltConnector`,
)

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
        logger.debug('with sending to DltConnector...')
        const dltTransactions = await DltTransaction.find({
          where: { messageId: IsNull() },
          relations: ['transaction'],
          order: { createdAt: 'ASC', id: 'ASC' },
        })

        for (const dltTx of dltTransactions) {
          if (!dltTx.transaction) {
            continue
          }
          try {
            const result = await dltConnector.transmitTransaction(dltTx.transaction)
            // message id isn't known at this point of time, because transaction will not direct sended to iota,
            // it will first go to db and then sended, if no transaction is in db before
            if (result) {
              dltTx.messageId = 'sended'
              await DltTransaction.save(dltTx)
              logger.info(`store messageId=${dltTx.messageId} in dltTx=${dltTx.id}`)
            }
          } catch (e) {
            logger.error(
              `error while sending to dlt-connector or writing messageId of dltTx=${dltTx.id}`,
              e,
            )
          }
        }
      } else {
        logger.info('sending to DltConnector currently not configured...')
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

import { IsNull } from '@dbTools/typeorm'
import { Community } from '@entity/Community'
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
      // TODO: get actual communities from users
      const homeCommunity = await Community.findOneOrFail({ where: { foreign: false } })
      const senderCommunityUuid = homeCommunity.communityUuid
      const recipientCommunityUuid = ''
      if (dltConnector) {
        logger.debug('with sending to DltConnector...')
        console.log('sender community: %s', senderCommunityUuid)
        if (!senderCommunityUuid) {
          throw new Error('Cannot find community uuid of home community')
        }

        const dltTransactions = await DltTransaction.find({
          where: { messageId: IsNull() },
          relations: {
            transaction: {
              contribution: true,
            },
          },
          order: { createdAt: 'ASC', id: 'ASC' },
        })
        console.log('found dlt transactions: %o', dltTransactions)
        for (const dltTx of dltTransactions) {
          if (!dltTx.transaction) {
            continue
          }
          try {
            const messageId = await dltConnector.transmitTransaction(
              dltTx.transaction,
              senderCommunityUuid,
              recipientCommunityUuid,
            )
            const dltMessageId = Buffer.from(messageId, 'hex')
            if (dltMessageId.length !== 32) {
              logger.error(
                'Error dlt message id is invalid: %s, should by 32 Bytes long in binary after converting from hex',
                dltMessageId,
              )
              return
            }
            dltTx.messageId = dltMessageId.toString('hex')
            await DltTransaction.save(dltTx)
            logger.info('store messageId=%s in dltTx=%d', dltTx.messageId, dltTx.id)
          } catch (e) {
            console.log('exception by calling transmit transaction', e)
            logger.error(
              `error while sending to dlt-connector or writing messageId of dltTx=${dltTx.id}`,
              e,
            )
          }
        }
      } else {
        console.log('sending to DltConnector currently not configured...')
        logger.info('sending to DltConnector currently not configured...')
      }
    } catch (e) {
      console.log('error on sending transactions to dlt-connector. %o', e)
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

import { IsNull } from '@dbTools/typeorm'
import { DltTransaction } from '@entity/DltTransaction'

import { DltConnectorClient } from '@/apis/DltConnectorClient'
import { backendLogger as logger } from '@/server/logger'

export async function sendTransactionsToDltConnector(): Promise<void> {
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
}

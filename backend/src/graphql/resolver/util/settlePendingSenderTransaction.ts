/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable new-cap */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { getConnection } from '@dbTools/typeorm'
import { Community as DbCommunity } from '@entity/Community'
import { PendingTransaction as DbPendingTransaction } from '@entity/PendingTransaction'
import { Transaction as dbTransaction } from '@entity/Transaction'
import { User as DbUser } from '@entity/User'
import { Decimal } from 'decimal.js-light'

import { PendingTransactionState } from '@/graphql/enum/PendingTransactionState'
import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'
import { TRANSACTIONS_LOCK } from '@/util/TRANSACTIONS_LOCK'
import { calculateSenderBalance } from '@/util/calculateSenderBalance'

import { getLastTransaction } from './getLastTransaction'

export async function settlePendingSenderTransaction(
  homeCom: DbCommunity,
  senderUser: DbUser,
  pendingTx: DbPendingTransaction,
): Promise<boolean> {
  // TODO: synchronisation with TRANSACTION_LOCK of federation-modul necessary!!!
  // acquire lock
  const releaseLock = await TRANSACTIONS_LOCK.acquire()
  const queryRunner = getConnection().createQueryRunner()
  await queryRunner.connect()
  await queryRunner.startTransaction('REPEATABLE READ')
  logger.debug(`start Transaction for write-access...`)

  try {
    logger.info('X-Com: settlePendingSenderTransaction:', homeCom, senderUser, pendingTx)

    // ensure that no other pendingTx with the same sender or recipient exists
    const openSenderPendingTx = await DbPendingTransaction.count({
      where: [
        { userGradidoID: pendingTx.userGradidoID, state: PendingTransactionState.NEW },
        { linkedUserGradidoID: pendingTx.linkedUserGradidoID!, state: PendingTransactionState.NEW },
      ],
    })
    const openReceiverPendingTx = await DbPendingTransaction.count({
      where: [
        { userGradidoID: pendingTx.linkedUserGradidoID!, state: PendingTransactionState.NEW },
        { linkedUserGradidoID: pendingTx.userGradidoID, state: PendingTransactionState.NEW },
      ],
    })
    if (openSenderPendingTx > 1 || openReceiverPendingTx > 1) {
      throw new LogError('There are more than 1 pending Transactions for Sender and/or Recipient')
    }

    const lastTransaction = await getLastTransaction(senderUser.id)

    if (lastTransaction?.id !== pendingTx.previous) {
      throw new LogError(
        `X-Com: missmatching transaction order! lastTransationId=${lastTransaction?.id} != pendingTx.previous=${pendingTx.previous}`,
      )
    }

    // transfer the pendingTx to the transactions table
    const transactionSend = new dbTransaction()
    transactionSend.typeId = pendingTx.typeId
    transactionSend.memo = pendingTx.memo
    transactionSend.userId = pendingTx.userId
    transactionSend.userGradidoID = pendingTx.userGradidoID
    transactionSend.userName = pendingTx.userName
    transactionSend.linkedUserId = pendingTx.linkedUserId
    transactionSend.linkedUserCommunityUuid = pendingTx.linkedUserCommunityUuid
    transactionSend.linkedUserGradidoID = pendingTx.linkedUserGradidoID
    transactionSend.linkedUserName = pendingTx.linkedUserName
    transactionSend.amount = pendingTx.amount
    const sendBalance = await calculateSenderBalance(
      senderUser.id,
      pendingTx.amount,
      pendingTx.balanceDate,
    )
    if (!sendBalance) {
      throw new LogError(`Sender has not enough GDD or amount is < 0', sendBalance`)
    }
    transactionSend.balance = sendBalance?.balance ?? new Decimal(0)
    transactionSend.balanceDate = pendingTx.balanceDate
    transactionSend.decay = sendBalance.decay.decay // pendingTx.decay
    transactionSend.decayStart = sendBalance.decay.start // pendingTx.decayStart
    transactionSend.previous = pendingTx.previous
    transactionSend.linkedTransactionId = pendingTx.linkedTransactionId
    await queryRunner.manager.insert(dbTransaction, transactionSend)
    logger.debug(`send Transaction inserted: ${dbTransaction}`)

    // and mark the pendingTx in the pending_transactions table as settled
    pendingTx.state = PendingTransactionState.SETTLED
    await queryRunner.manager.save(DbPendingTransaction, pendingTx)

    await queryRunner.commitTransaction()
    logger.info(`commit send Transaction successful...`)

    /*
    await EVENT_TRANSACTION_SEND(sender, recipient, transactionSend, transactionSend.amount)

    await EVENT_TRANSACTION_RECEIVE(
      recipient,
      sender,
      transactionReceive,
      transactionReceive.amount,
    )
    */
    // trigger to send transaction via dlt-connector
    // void sendTransactionsToDltConnector()
  } catch (e) {
    await queryRunner.rollbackTransaction()
    throw new LogError('X-Com: send Transaction was not successful', e)
  } finally {
    await queryRunner.release()
    releaseLock()
  }
  /*
    void sendTransactionReceivedEmail({
      firstName: recipient.firstName,
      lastName: recipient.lastName,
      email: recipient.emailContact.email,
      language: recipient.language,
      memo,
      senderFirstName: sender.firstName,
      senderLastName: sender.lastName,
      senderEmail: sender.emailContact.email,
      transactionAmount: amount,
    })
    if (transactionLink) {
      void sendTransactionLinkRedeemedEmail({
        firstName: sender.firstName,
        lastName: sender.lastName,
        email: sender.emailContact.email,
        language: sender.language,
        senderFirstName: recipient.firstName,
        senderLastName: recipient.lastName,
        senderEmail: recipient.emailContact.email,
        transactionAmount: amount,
        transactionMemo: memo,
      })
    }
    logger.info(`finished executeTransaction successfully`)
  } finally {
    releaseLock()
  }
  */
  return true
}

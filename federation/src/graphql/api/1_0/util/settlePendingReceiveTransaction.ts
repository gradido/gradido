/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable new-cap */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { getConnection } from '@dbTools/typeorm'
import { Community as DbCommunity } from '@entity/Community'
import { PendingTransaction as DbPendingTransaction } from '@entity/PendingTransaction'
import { Transaction as dbTransaction } from '@entity/Transaction'
import { User as DbUser } from '@entity/User'

import { PendingTransactionState } from '../enum/PendingTransactionState'

import { LogError } from '@/server/LogError'
import { federationLogger as logger } from '@/server/logger'

import { getLastTransaction } from '@/graphql/util/getLastTransaction'
import { TRANSACTIONS_LOCK } from '@/graphql/util/TRANSACTIONS_LOCK'
import { calculateRecipientBalance } from './calculateRecipientBalance'
import Decimal from 'decimal.js-light'

export async function settlePendingReceiveTransaction(
  homeCom: DbCommunity,
  receiverUser: DbUser,
  pendingTx: DbPendingTransaction,
): Promise<boolean> {
  // TODO: synchronisation with TRANSACTION_LOCK of backend-modul necessary!!!
  // acquire lock
  const releaseLock = await TRANSACTIONS_LOCK.acquire()
  const queryRunner = getConnection().createQueryRunner()
  await queryRunner.connect()
  await queryRunner.startTransaction('REPEATABLE READ')
  logger.debug(`start Transaction for write-access...`)

  try {
    logger.info('X-Com: settlePendingReceiveTransaction:', homeCom, receiverUser, pendingTx)

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

    const lastTransaction = await getLastTransaction(receiverUser.id)

    if (lastTransaction !== null && lastTransaction.id !== pendingTx.previous) {
      throw new LogError(
        `X-Com: missmatching transaction order! lastTransationId=${lastTransaction?.id} != pendingTx.previous=${pendingTx.previous}`,
      )
    }

    // transfer the pendingTx to the transactions table
    const transactionReceive = new dbTransaction()
    transactionReceive.typeId = pendingTx.typeId
    transactionReceive.memo = pendingTx.memo
    transactionReceive.userId = pendingTx.userId
    transactionReceive.userCommunityUuid = pendingTx.userCommunityUuid
    transactionReceive.userGradidoID = pendingTx.userGradidoID
    transactionReceive.userName = pendingTx.userName
    transactionReceive.linkedUserId = pendingTx.linkedUserId
    transactionReceive.linkedUserCommunityUuid = pendingTx.linkedUserCommunityUuid
    transactionReceive.linkedUserGradidoID = pendingTx.linkedUserGradidoID
    transactionReceive.linkedUserName = pendingTx.linkedUserName
    transactionReceive.amount = pendingTx.amount
    const receiveBalance = await calculateRecipientBalance(
      receiverUser.id,
      pendingTx.amount,
      pendingTx.balanceDate,
    )
    transactionReceive.balance = receiveBalance ? receiveBalance.balance : pendingTx.amount
    transactionReceive.balanceDate = pendingTx.balanceDate
    transactionReceive.decay = receiveBalance ? receiveBalance.decay.decay : new Decimal(0)
    transactionReceive.decayStart = receiveBalance ? receiveBalance.decay.start : null
    transactionReceive.previous = receiveBalance ? receiveBalance.lastTransactionId : null
    transactionReceive.linkedTransactionId = pendingTx.linkedTransactionId
    await queryRunner.manager.insert(dbTransaction, transactionReceive)
    logger.debug(`receive Transaction inserted: ${dbTransaction}`)

    // and mark the pendingTx in the pending_transactions table as settled
    pendingTx.state = PendingTransactionState.SETTLED
    await queryRunner.manager.save(DbPendingTransaction, pendingTx)

    await queryRunner.commitTransaction()
    logger.info(`commit recipient Transaction successful...`)

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
    throw new LogError('X-Com: recipient Transaction was not successful', e)
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

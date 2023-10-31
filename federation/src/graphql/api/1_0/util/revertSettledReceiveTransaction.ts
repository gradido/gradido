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

export async function revertSettledReceiveTransaction(
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
    logger.info('X-Com: revertSettledReceiveTransaction:', homeCom, receiverUser, pendingTx)

    // ensure that no other pendingTx with the same sender or recipient exists
    const openSenderPendingTx = await DbPendingTransaction.count({
      where: [
        { userGradidoID: pendingTx.userGradidoID, state: PendingTransactionState.NEW },
        { userGradidoID: pendingTx.userGradidoID, state: PendingTransactionState.SETTLED },
        {
          linkedUserGradidoID: pendingTx.linkedUserGradidoID!,
          state: PendingTransactionState.NEW,
        },
        {
          linkedUserGradidoID: pendingTx.linkedUserGradidoID!,
          state: PendingTransactionState.SETTLED,
        },
      ],
    })
    const openReceiverPendingTx = await DbPendingTransaction.count({
      where: [
        { userGradidoID: pendingTx.linkedUserGradidoID!, state: PendingTransactionState.NEW },
        { userGradidoID: pendingTx.linkedUserGradidoID!, state: PendingTransactionState.SETTLED },
        { linkedUserGradidoID: pendingTx.userGradidoID, state: PendingTransactionState.NEW },
        { linkedUserGradidoID: pendingTx.userGradidoID, state: PendingTransactionState.SETTLED },
      ],
    })
    if (openSenderPendingTx > 1 || openReceiverPendingTx > 1) {
      throw new LogError('There are more than 1 pending Transactions for Sender and/or Recipient')
    }

    const lastTransaction = await getLastTransaction(receiverUser.id)
    logger.debug(`LastTransaction vs PendingTransaction`)
    logger.debug(`balance:`, lastTransaction?.balance.toString(), pendingTx.balance.toString())
    logger.debug(
      `balanceDate:`,
      lastTransaction?.balanceDate.toISOString(),
      pendingTx.balanceDate.toISOString(),
    )
    logger.debug(`GradidoID:`, lastTransaction?.userGradidoID, pendingTx.userGradidoID)
    logger.debug(`Name:`, lastTransaction?.userName, pendingTx.userName)
    logger.debug(`amount:`, lastTransaction?.amount.toString(), pendingTx.amount.toString())
    logger.debug(`memo:`, lastTransaction?.memo, pendingTx.memo)
    logger.debug(
      `linkedUserGradidoID:`,
      lastTransaction?.linkedUserGradidoID,
      pendingTx.linkedUserGradidoID,
    )
    logger.debug(`linkedUserName:`, lastTransaction?.linkedUserName, pendingTx.linkedUserName)
    // now the last Tx must be the equivalant to the pendingTX
    if (
      lastTransaction &&
      lastTransaction.balance.comparedTo(pendingTx.balance) === 0 &&
      lastTransaction.balanceDate.toISOString() === pendingTx.balanceDate.toISOString() &&
      lastTransaction.userGradidoID === pendingTx.userGradidoID &&
      lastTransaction.userName === pendingTx.userName &&
      lastTransaction.amount.comparedTo(pendingTx.amount) === 0 &&
      lastTransaction.memo === pendingTx.memo &&
      lastTransaction.linkedUserGradidoID === pendingTx.linkedUserGradidoID &&
      lastTransaction.linkedUserName === pendingTx.linkedUserName
    ) {
      await queryRunner.manager.remove(dbTransaction, lastTransaction)
      logger.debug(`X-Com: revert settlement receive Transaction removed:`, lastTransaction)
      // and mark the pendingTx in the pending_transactions table as reverted
      pendingTx.state = PendingTransactionState.REVERTED
      await queryRunner.manager.save(DbPendingTransaction, pendingTx)

      await queryRunner.commitTransaction()
      logger.debug(`commit revert settlement recipient Transaction successful...`)
    } else {
      // TODO: if the last TX is not equivelant to pendingTX, the transactions must be corrected in EXPERT-MODE
      throw new LogError(
        `X-Com: missmatching transaction order for revert settlement!`,
        lastTransaction,
        pendingTx,
      )
    }

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
    throw new LogError('X-Com: revert settlement recipient Transaction was not successful', e)
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

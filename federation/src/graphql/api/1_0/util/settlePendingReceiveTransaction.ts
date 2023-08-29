/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable new-cap */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { getConnection, In } from '@dbTools/typeorm'
import { Community as DbCommunity } from '@entity/Community'
import { PendingTransaction as DbPendingTransaction } from '@entity/PendingTransaction'
import { Transaction as dbTransaction } from '@entity/Transaction'
import { TransactionLink as dbTransactionLink } from '@entity/TransactionLink'
import { User as DbUser } from '@entity/User'
import { Decimal } from 'decimal.js-light'

import { PendingTransactionState } from '../enum/PendingTransactionState'
import { TransactionTypeId } from '../enum/TransactionTypeId'

import { LogError } from '@/server/LogError'
import { federationLogger as logger } from '@/server/logger'

import { getLastTransaction } from '@/graphql/util/getLastTransaction'
import { TRANSACTIONS_LOCK } from '@/graphql/util/TRANSACTIONS_LOCK'

export async function settlePendingReceiveTransaction(
  homeCom: DbCommunity,
  receiverUser: DbUser,
  pendingTx: DbPendingTransaction,
): Promise<boolean> {
  // acquire lock
  const releaseLock = await TRANSACTIONS_LOCK.acquire()
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

    const recipientUser = await DbUser.findOneByOrFail({ gradidoID: userReceiverIdentifier })
    const lastTransaction = await getLastTransaction(recipientUser.id)

    if (lastTransaction?.id !== pendingTx.previous) {
      throw new LogError(
        `X-Com: missmatching transaction order! lastTransationId=${lastTransaction?.id} != pendingTx.previous=${pendingTx.previous}`,
      )
    }
    // validate amount
    const receivedCallDate = new Date()
    const sendBalance = await calculateBalance(
      sender.id,
      amount.mul(-1),
      receivedCallDate,
      transactionLink,
    )
    logger.debug(`calculated Balance=${sendBalance}`)
    if (!sendBalance) {
      throw new LogError('User has not enough GDD or amount is < 0', sendBalance)
    }

    const queryRunner = getConnection().createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('REPEATABLE READ')
    logger.debug(`open Transaction to write...`)
    try {
      // transaction
      const transactionSend = new dbTransaction()
      transactionSend.typeId = TransactionTypeId.SEND
      transactionSend.memo = memo
      transactionSend.userId = sender.id
      transactionSend.userGradidoID = sender.gradidoID
      transactionSend.userName = fullName(sender.firstName, sender.lastName)
      transactionSend.linkedUserId = recipient.id
      transactionSend.linkedUserGradidoID = recipient.gradidoID
      transactionSend.linkedUserName = fullName(recipient.firstName, recipient.lastName)
      transactionSend.amount = amount.mul(-1)
      transactionSend.balance = sendBalance.balance
      transactionSend.balanceDate = receivedCallDate
      transactionSend.decay = sendBalance.decay.decay
      transactionSend.decayStart = sendBalance.decay.start
      transactionSend.previous = sendBalance.lastTransactionId
      transactionSend.transactionLinkId = transactionLink ? transactionLink.id : null
      await queryRunner.manager.insert(dbTransaction, transactionSend)

      logger.debug(`sendTransaction inserted: ${dbTransaction}`)

      const transactionReceive = new dbTransaction()
      transactionReceive.typeId = TransactionTypeId.RECEIVE
      transactionReceive.memo = memo
      transactionReceive.userId = recipient.id
      transactionReceive.userGradidoID = recipient.gradidoID
      transactionReceive.userName = fullName(recipient.firstName, recipient.lastName)
      transactionReceive.linkedUserId = sender.id
      transactionReceive.linkedUserGradidoID = sender.gradidoID
      transactionReceive.linkedUserName = fullName(sender.firstName, sender.lastName)
      transactionReceive.amount = amount
      const receiveBalance = await calculateBalance(recipient.id, amount, receivedCallDate)
      transactionReceive.balance = receiveBalance ? receiveBalance.balance : amount
      transactionReceive.balanceDate = receivedCallDate
      transactionReceive.decay = receiveBalance ? receiveBalance.decay.decay : new Decimal(0)
      transactionReceive.decayStart = receiveBalance ? receiveBalance.decay.start : null
      transactionReceive.previous = receiveBalance ? receiveBalance.lastTransactionId : null
      transactionReceive.linkedTransactionId = transactionSend.id
      transactionReceive.transactionLinkId = transactionLink ? transactionLink.id : null
      await queryRunner.manager.insert(dbTransaction, transactionReceive)
      logger.debug(`receive Transaction inserted: ${dbTransaction}`)

      // Save linked transaction id for send
      transactionSend.linkedTransactionId = transactionReceive.id
      await queryRunner.manager.update(dbTransaction, { id: transactionSend.id }, transactionSend)
      logger.debug('send Transaction updated', transactionSend)

      if (transactionLink) {
        logger.info('transactionLink', transactionLink)
        transactionLink.redeemedAt = receivedCallDate
        transactionLink.redeemedBy = recipient.id
        await queryRunner.manager.update(
          dbTransactionLink,
          { id: transactionLink.id },
          transactionLink,
        )
      }

      await queryRunner.commitTransaction()
      logger.info(`commit Transaction successful...`)

      await EVENT_TRANSACTION_SEND(sender, recipient, transactionSend, transactionSend.amount)

      await EVENT_TRANSACTION_RECEIVE(
        recipient,
        sender,
        transactionReceive,
        transactionReceive.amount,
      )

      // trigger to send transaction via dlt-connector
      void sendTransactionsToDltConnector()
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw new LogError('Transaction was not successful', e)
    } finally {
      await queryRunner.release()
    }
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
  return true
}

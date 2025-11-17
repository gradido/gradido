import {
  AppDatabase,
  CommunityLoggingView,
  Community as DbCommunity,
  PendingTransaction as DbPendingTransaction,
  User as DbUser,
  PendingTransactionLoggingView,
  UserLoggingView,
  Transaction as dbTransaction,
} from 'database'
import { Decimal } from 'decimal.js-light'

import { LOG4JS_BASE_CATEGORY_NAME } from '../../config/const'
import { PendingTransactionState } from 'shared'
// import { LogError } from '@/server/LogError'
import { calculateSenderBalance } from '../../util/calculateSenderBalance'
import { getLastTransaction } from 'database'
import { getLogger } from 'log4js'

const db = AppDatabase.getInstance()
const logger = getLogger(
  `${LOG4JS_BASE_CATEGORY_NAME}.graphql.logic.settlePendingSenderTransaction`,
)

export async function settlePendingSenderTransaction(
  homeCom: DbCommunity,
  senderUser: DbUser,
  pendingTx: DbPendingTransaction,
): Promise<boolean> {
  // TODO: synchronisation with TRANSACTION_LOCK of federation-modul necessary!!!
  // acquire lock
  const releaseLock = await db.TransactionsLock().acquire()
  const queryRunner = db.getDataSource().createQueryRunner()
  await queryRunner.connect()
  await queryRunner.startTransaction('REPEATABLE READ')
  logger.debug(`start Transaction for write-access...`)

  try {
    logger.info('settlePendingSenderTransaction:', new CommunityLoggingView(homeCom), new UserLoggingView(senderUser), new PendingTransactionLoggingView(pendingTx))

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
      const errmsg = `There are more than 1 pending Transactions for Sender and/or Recipient`
      logger.error(errmsg)
      throw new Error(errmsg)
    }

    const lastTransaction = await getLastTransaction(senderUser.id)

    if (lastTransaction?.id !== pendingTx.previous) {
      const errmsg = `X-Com: missmatching transaction order! lastTransationId=${lastTransaction?.id} != pendingTx.previous=${pendingTx.previous}`
      logger.error(errmsg)
      throw new Error(errmsg)
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
      const errmsg = 'Sender has not enough GDD or amount is < 0'
      logger.error(errmsg)
      throw new Error(errmsg)
    }
    transactionSend.balance = sendBalance?.balance ?? new Decimal(0)
    transactionSend.balanceDate = pendingTx.balanceDate
    transactionSend.decay = sendBalance.decay.decay // pendingTx.decay
    transactionSend.decayStart = sendBalance.decay.start // pendingTx.decayStart
    transactionSend.previous = pendingTx.previous
    transactionSend.transactionLinkId = pendingTx.transactionLinkId
    await queryRunner.manager.insert(dbTransaction, transactionSend)
    logger.debug(`send Transaction inserted: ${transactionSend}`)

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
    logger.error('X-Com: send Transaction was not successful', e)
    throw new Error('X-Com: send Transaction was not successful')
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

/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable new-cap */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { getConnection, In } from '@dbTools/typeorm'
import { Transaction as dbTransaction } from '@entity/Transaction'
import { TransactionLink as dbTransactionLink } from '@entity/TransactionLink'
import { User as dbUser } from '@entity/User'
import { Decimal } from 'decimal.js-light'
import { Resolver, Query, Args, Authorized, Ctx, Mutation } from 'type-graphql'

import { Paginated } from '@arg/Paginated'
import { TransactionSendArgs } from '@arg/TransactionSendArgs'
import { Order } from '@enum/Order'
import { TransactionTypeId } from '@enum/TransactionTypeId'
import { Transaction } from '@model/Transaction'
import { TransactionList } from '@model/TransactionList'
import { User } from '@model/User'

import { RIGHTS } from '@/auth/RIGHTS'
import {
  sendTransactionLinkRedeemedEmail,
  sendTransactionReceivedEmail,
} from '@/emails/sendEmailVariants'
import { EVENT_TRANSACTION_RECEIVE, EVENT_TRANSACTION_SEND } from '@/event/Events'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'
import { communityUser } from '@/util/communityUser'
import { TRANSACTIONS_LOCK } from '@/util/TRANSACTIONS_LOCK'
import { fullName } from '@/util/utilities'
import { calculateBalance } from '@/util/validate'
import { virtualLinkTransaction, virtualDecayTransaction } from '@/util/virtualTransactions'

import { BalanceResolver } from './BalanceResolver'
import { MEMO_MAX_CHARS, MEMO_MIN_CHARS } from './const/const'
import { isHomeCommunity } from './util/communities'
import { findUserByIdentifier } from './util/findUserByIdentifier'
import { getLastTransaction } from './util/getLastTransaction'
import { getTransactionList } from './util/getTransactionList'
import { sendTransactionsToDltConnector } from './util/sendTransactionsToDltConnector'
import { transactionLinkSummary } from './util/transactionLinkSummary'

export const executeTransaction = async (
  amount: Decimal,
  memo: string,
  sender: dbUser,
  recipient: dbUser,
  transactionLink?: dbTransactionLink | null,
): Promise<boolean> => {
  // acquire lock
  const releaseLock = await TRANSACTIONS_LOCK.acquire()
  try {
    logger.info('executeTransaction', amount, memo, sender, recipient)

    if (sender.id === recipient.id) {
      throw new LogError('Sender and Recipient are the same', sender.id)
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

/*
export const executeCrossTransaction = async (
  amount: Decimal,
  memo: string,
  sender: dbUser,
  recipientIdentifier: string,
  transactionLink?: dbTransactionLink | null,
): Promise<boolean> => {
  // acquire lock
  const releaseLock = await TRANSACTIONS_LOCK.acquire()
  try {
    logger.info('executeCrossTransaction', amount, memo, sender, recipientIdentifier)

    if (sender.id === recipient.id) {
      throw new LogError('Sender and Recipient are the same', sender.id)
    }

    if (memo.length < MEMO_MIN_CHARS) {
      throw new LogError('Memo text is too short', memo.length)
    }

    if (memo.length > MEMO_MAX_CHARS) {
      throw new LogError('Memo text is too long', memo.length)
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
*/

@Resolver()
export class TransactionResolver {
  @Authorized([RIGHTS.TRANSACTION_LIST])
  @Query(() => TransactionList)
  async transactionList(
    @Args()
    { currentPage = 1, pageSize = 25, order = Order.DESC }: Paginated,
    @Ctx() context: Context,
  ): Promise<TransactionList> {
    const now = new Date()
    const user = getUser(context)

    logger.addContext('user', user.id)
    logger.info(`transactionList(user=${user.firstName}.${user.lastName}, ${user.emailId})`)

    // find current balance
    const lastTransaction = await getLastTransaction(user.id, ['contribution'])
    logger.debug(`lastTransaction=${lastTransaction}`)

    const balanceResolver = new BalanceResolver()
    context.lastTransaction = lastTransaction

    if (!lastTransaction) {
      logger.info('no lastTransaction')
      return new TransactionList(await balanceResolver.balance(context), [])
    }

    // find transactions
    // first page can contain 26 due to virtual decay transaction
    const offset = (currentPage - 1) * pageSize
    const [userTransactions, userTransactionsCount] = await getTransactionList(
      user.id,
      pageSize,
      offset,
      order,
    )
    context.transactionCount = userTransactionsCount

    // find involved users; I am involved
    const involvedUserIds: number[] = [user.id]
    userTransactions.forEach((transaction: dbTransaction) => {
      if (transaction.linkedUserId && !involvedUserIds.includes(transaction.linkedUserId)) {
        involvedUserIds.push(transaction.linkedUserId)
      }
    })
    logger.debug(`involvedUserIds=${involvedUserIds}`)

    // We need to show the name for deleted users for old transactions
    const involvedDbUsers = await dbUser.find({
      where: { id: In(involvedUserIds) },
      withDeleted: true,
      relations: ['emailContact'],
    })
    const involvedUsers = involvedDbUsers.map((u) => new User(u))
    logger.debug(`involvedUsers=${involvedUsers}`)

    const self = new User(user)
    const transactions: Transaction[] = []

    const { sumHoldAvailableAmount, sumAmount, lastDate, firstDate, transactionLinkcount } =
      await transactionLinkSummary(user.id, now)
    context.linkCount = transactionLinkcount
    logger.debug(`transactionLinkcount=${transactionLinkcount}`)
    context.sumHoldAvailableAmount = sumHoldAvailableAmount
    logger.debug(`sumHoldAvailableAmount=${sumHoldAvailableAmount}`)

    // decay & link transactions
    if (currentPage === 1 && order === Order.DESC) {
      logger.debug(`currentPage == 1: transactions=${transactions}`)
      // The virtual decay is always on the booked amount, not including the generated, not yet booked links,
      // since the decay is substantially different when the amount is less
      transactions.push(
        virtualDecayTransaction(
          lastTransaction.balance,
          lastTransaction.balanceDate,
          now,
          self,
          sumHoldAvailableAmount,
        ),
      )
      logger.debug(`transactions=${transactions}`)

      // virtual transaction for pending transaction-links sum
      if (sumHoldAvailableAmount.greaterThan(0)) {
        logger.debug(`sumHoldAvailableAmount > 0: transactions=${transactions}`)
        transactions.push(
          virtualLinkTransaction(
            lastTransaction.balance.minus(sumHoldAvailableAmount.toString()),
            sumAmount.mul(-1),
            sumHoldAvailableAmount.mul(-1),
            sumHoldAvailableAmount.minus(sumAmount.toString()).mul(-1),
            firstDate ?? now,
            lastDate ?? now,
            self,
            (userTransactions.length && userTransactions[0].balance) || new Decimal(0),
          ),
        )
        logger.debug(`transactions=${transactions}`)
      }
    }

    // transactions
    userTransactions.forEach((userTransaction: dbTransaction) => {
      const linkedUser =
        userTransaction.typeId === TransactionTypeId.CREATION
          ? communityUser
          : involvedUsers.find((u) => u.id === userTransaction.linkedUserId)
      transactions.push(new Transaction(userTransaction, self, linkedUser))
    })
    logger.debug(`TransactionTypeId.CREATION: transactions=${transactions}`)

    transactions.forEach((transaction: Transaction) => {
      if (transaction.typeId !== TransactionTypeId.DECAY) {
        const { balance, previousBalance, amount } = transaction
        transaction.decay.decay = new Decimal(
          Number(balance) - Number(amount) - Number(previousBalance),
        ).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
      }
    })

    // Construct Result
    return new TransactionList(await balanceResolver.balance(context), transactions)
  }

  @Authorized([RIGHTS.SEND_COINS])
  @Mutation(() => Boolean)
  async sendCoins(
    @Args()
    { recipientCommunityIdentifier, recipientIdentifier, amount, memo }: TransactionSendArgs,
    @Ctx() context: Context,
  ): Promise<boolean> {
    logger.debug(
      `sendCoins(recipientCommunityIdentifier=${recipientCommunityIdentifier}, identifier=${recipientIdentifier}, amount=${amount}, memo=${memo})`,
    )

    const senderUser = getUser(context)

    if (!recipientCommunityIdentifier || (await isHomeCommunity(recipientCommunityIdentifier))) {
      // processing sendCoins within sender and recepient are both in home community
      // validate recipient user
      const recipientUser = await findUserByIdentifier(recipientIdentifier)
      if (!recipientUser) {
        throw new LogError('The recipient user was not found', recipientUser)
      }

      await executeTransaction(amount, memo, senderUser, recipientUser)
      logger.info('successful executeTransaction', amount, memo, senderUser, recipientUser)
    } else {
      // processing a x-community sendCoins
      logger.debug('processing a x-community transaction...')
    }
    return true
  }
}

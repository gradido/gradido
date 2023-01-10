/* eslint-disable new-cap */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import Decimal from 'decimal.js-light'
import { Resolver, Query, Args, Authorized, Ctx, Mutation } from 'type-graphql'
import { getCustomRepository, getConnection, In } from '@dbTools/typeorm'

import { User as dbUser } from '@entity/User'
import { Transaction as dbTransaction } from '@entity/Transaction'
import { TransactionLink as dbTransactionLink } from '@entity/TransactionLink'
import { TransactionRepository } from '@repository/Transaction'
import { TransactionLinkRepository } from '@repository/TransactionLink'

import { User } from '@model/User'
import { Transaction } from '@model/Transaction'
import { TransactionList } from '@model/TransactionList'
import { Order } from '@enum/Order'
import { TransactionTypeId } from '@enum/TransactionTypeId'
import { calculateBalance } from '@/util/validate'
import TransactionSendArgs from '@arg/TransactionSendArgs'
import Paginated from '@arg/Paginated'

import { backendLogger as logger } from '@/server/logger'
import { Context, getUser } from '@/server/context'
import { RIGHTS } from '@/auth/RIGHTS'
import { communityUser } from '@/util/communityUser'
import { virtualLinkTransaction, virtualDecayTransaction } from '@/util/virtualTransactions'
import {
  sendTransactionLinkRedeemedEmail,
  sendTransactionReceivedEmail,
} from '@/emails/sendEmailVariants'
import { Event, EventTransactionReceive, EventTransactionSend } from '@/event/Event'
import { eventProtocol } from '@/event/EventProtocolEmitter'

import { BalanceResolver } from './BalanceResolver'
import { MEMO_MAX_CHARS, MEMO_MIN_CHARS } from './const/const'
import { findUserByEmail } from './UserResolver'

import { TRANSACTIONS_LOCK } from '@/util/TRANSACTIONS_LOCK'

export const executeTransaction = async (
  amount: Decimal,
  memo: string,
  sender: dbUser,
  recipient: dbUser,
  transactionLink?: dbTransactionLink | null,
): Promise<boolean> => {
  logger.info(
    `executeTransaction(amount=${amount}, memo=${memo}, sender=${sender}, recipient=${recipient})...`,
  )

  if (sender.id === recipient.id) {
    logger.error(`Sender and Recipient are the same.`)
    throw new Error('Sender and Recipient are the same.')
  }

  if (memo.length > MEMO_MAX_CHARS) {
    logger.error(`memo text is too long: memo.length=${memo.length} > ${MEMO_MAX_CHARS}`)
    throw new Error(`memo text is too long (${MEMO_MAX_CHARS} characters maximum)`)
  }

  if (memo.length < MEMO_MIN_CHARS) {
    logger.error(`memo text is too short: memo.length=${memo.length} < ${MEMO_MIN_CHARS}`)
    throw new Error(`memo text is too short (${MEMO_MIN_CHARS} characters minimum)`)
  }

  // acquire lock
  const releaseLock = await TRANSACTIONS_LOCK.acquire()

  try {
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
      logger.error(`user hasn't enough GDD or amount is < 0 : balance=${sendBalance}`)
      throw new Error("user hasn't enough GDD or amount is < 0")
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
      transactionSend.linkedUserId = recipient.id
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
      transactionReceive.linkedUserId = sender.id
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
      logger.debug(`send Transaction updated: ${transactionSend}`)

      if (transactionLink) {
        logger.info(`transactionLink: ${transactionLink}`)
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

      const eventTransactionSend = new EventTransactionSend()
      eventTransactionSend.userId = transactionSend.userId
      eventTransactionSend.xUserId = transactionSend.linkedUserId
      eventTransactionSend.transactionId = transactionSend.id
      eventTransactionSend.amount = transactionSend.amount.mul(-1)
      await eventProtocol.writeEvent(new Event().setEventTransactionSend(eventTransactionSend))

      const eventTransactionReceive = new EventTransactionReceive()
      eventTransactionReceive.userId = transactionReceive.userId
      eventTransactionReceive.xUserId = transactionReceive.linkedUserId
      eventTransactionReceive.transactionId = transactionReceive.id
      eventTransactionReceive.amount = transactionReceive.amount
      await eventProtocol.writeEvent(
        new Event().setEventTransactionReceive(eventTransactionReceive),
      )
    } catch (e) {
      await queryRunner.rollbackTransaction()
      logger.error(`Transaction was not successful: ${e}`)
      throw new Error(`Transaction was not successful: ${e}`)
    } finally {
      await queryRunner.release()
    }
    logger.debug(`prepare Email for transaction received...`)
    await sendTransactionReceivedEmail({
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
      await sendTransactionLinkRedeemedEmail({
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
    return true
  } finally {
    releaseLock()
  }
}

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
    const lastTransaction = await dbTransaction.findOne(
      { userId: user.id },
      { order: { balanceDate: 'DESC' }, relations: ['contribution'] },
    )
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
    const transactionRepository = getCustomRepository(TransactionRepository)
    const [userTransactions, userTransactionsCount] = await transactionRepository.findByUserPaged(
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

    const transactionLinkRepository = getCustomRepository(TransactionLinkRepository)
    const { sumHoldAvailableAmount, sumAmount, lastDate, firstDate, transactionLinkcount } =
      await transactionLinkRepository.summary(user.id, now)
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
            firstDate || now,
            lastDate || now,
            self,
          ),
        )
        logger.debug(`transactions=${transactions}`)
      }
    }

    // transactions
    userTransactions.forEach((userTransaction) => {
      const linkedUser =
        userTransaction.typeId === TransactionTypeId.CREATION
          ? communityUser
          : involvedUsers.find((u) => u.id === userTransaction.linkedUserId)
      transactions.push(new Transaction(userTransaction, self, linkedUser))
    })
    logger.debug(`TransactionTypeId.CREATION: transactions=${transactions}`)

    // Construct Result
    return new TransactionList(await balanceResolver.balance(context), transactions)
  }

  @Authorized([RIGHTS.SEND_COINS])
  @Mutation(() => String)
  async sendCoins(
    @Args() { email, amount, memo }: TransactionSendArgs,
    @Ctx() context: Context,
  ): Promise<boolean> {
    logger.info(`sendCoins(email=${email}, amount=${amount}, memo=${memo})`)
    if (amount.lte(0)) {
      logger.error(`Amount to send must be positive`)
      throw new Error('Amount to send must be positive')
    }

    // TODO this is subject to replay attacks
    const senderUser = getUser(context)

    // validate recipient user
    const recipientUser = await findUserByEmail(email)
    if (recipientUser.deletedAt) {
      logger.error(`The recipient account was deleted: recipientUser=${recipientUser}`)
      throw new Error('The recipient account was deleted')
    }
    const emailContact = recipientUser.emailContact
    if (!emailContact.emailChecked) {
      logger.error(`The recipient account is not activated: recipientUser=${recipientUser}`)
      throw new Error('The recipient account is not activated')
    }

    await executeTransaction(amount, memo, senderUser, recipientUser)
    logger.info(
      `successful executeTransaction(amount=${amount}, memo=${memo}, senderUser=${senderUser}, recipientUser=${recipientUser})`,
    )
    return true
  }
}

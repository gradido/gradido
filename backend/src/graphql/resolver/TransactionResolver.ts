/* eslint-disable new-cap */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { backendLogger as logger } from '@/server/logger'
import CONFIG from '@/config'

import { Context, getUser } from '@/server/context'
import { Resolver, Query, Args, Authorized, Ctx, Mutation } from 'type-graphql'
import { getCustomRepository, getConnection } from '@dbTools/typeorm'

import {
  sendTransactionLinkRedeemedEmail,
  sendTransactionReceivedEmail,
} from '@/mailer/sendTransactionReceivedEmail'

import { Transaction } from '@model/Transaction'
import { TransactionList } from '@model/TransactionList'

import TransactionSendArgs from '@arg/TransactionSendArgs'
import Paginated from '@arg/Paginated'

import { Order } from '@enum/Order'

import { TransactionRepository } from '@repository/Transaction'
import { TransactionLinkRepository } from '@repository/TransactionLink'

import { User as dbUser } from '@entity/User'
import { Transaction as dbTransaction } from '@entity/Transaction'
import { TransactionLink as dbTransactionLink } from '@entity/TransactionLink'

import { TransactionTypeId } from '@enum/TransactionTypeId'
import { calculateBalance, isHexPublicKey } from '@/util/validate'
import { RIGHTS } from '@/auth/RIGHTS'
import { User } from '@model/User'
import { communityUser } from '@/util/communityUser'
import { virtualLinkTransaction, virtualDecayTransaction } from '@/util/virtualTransactions'
import Decimal from 'decimal.js-light'

import { BalanceResolver } from './BalanceResolver'
import { MEMO_MAX_CHARS, MEMO_MIN_CHARS } from './const/const'
import { UserContact } from '@entity/UserContact'
import { findUserByEmail } from './UserResolver'

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
    logger.error(`memo text is too long: memo.length=${memo.length} > (${MEMO_MAX_CHARS}`)
    throw new Error(`memo text is too long (${MEMO_MAX_CHARS} characters maximum)`)
  }

  if (memo.length < MEMO_MIN_CHARS) {
    logger.error(`memo text is too short: memo.length=${memo.length} < (${MEMO_MIN_CHARS}`)
    throw new Error(`memo text is too short (${MEMO_MIN_CHARS} characters minimum)`)
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
    logger.error(`user hasn't enough GDD or amount is < 0 : balance=${sendBalance}`)
    throw new Error("user hasn't enough GDD or amount is < 0")
  }

  const queryRunner = getConnection().createQueryRunner()
  await queryRunner.connect()
  await queryRunner.startTransaction('READ UNCOMMITTED')
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
  } catch (e) {
    await queryRunner.rollbackTransaction()
    logger.error(`Transaction was not successful: ${e}`)
    throw new Error(`Transaction was not successful: ${e}`)
  } finally {
    await queryRunner.release()
  }
  logger.debug(`prepare Email for transaction received...`)
  // send notification email
  // TODO: translate
  await sendTransactionReceivedEmail({
    senderFirstName: sender.firstName,
    senderLastName: sender.lastName,
    recipientFirstName: recipient.firstName,
    recipientLastName: recipient.lastName,
    email: recipient.emailContact.email,
    senderEmail: sender.emailContact.email,
    amount,
    memo,
    overviewURL: CONFIG.EMAIL_LINK_OVERVIEW,
  })
  if (transactionLink) {
    await sendTransactionLinkRedeemedEmail({
      senderFirstName: recipient.firstName,
      senderLastName: recipient.lastName,
      recipientFirstName: sender.firstName,
      recipientLastName: sender.lastName,
      email: sender.email,
      senderEmail: recipient.email,
      amount,
      memo,
      overviewURL: CONFIG.EMAIL_LINK_OVERVIEW,
    })
  }
  logger.info(`finished executeTransaction successfully`)
  return true
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
      { order: { balanceDate: 'DESC' } },
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
    const involvedDbUsers = await dbUser
      .createQueryBuilder()
      .withDeleted()
      .where('id IN (:...userIds)', { userIds: involvedUserIds })
      .getMany()
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

    // TODO this is subject to replay attacks
    const senderUser = getUser(context)
    if (senderUser.pubKey.length !== 32) {
      logger.error(`invalid sender public key:${senderUser.pubKey}`)
      throw new Error('invalid sender public key')
    }

    // validate recipient user
    const recipientUser = await findUserByEmail(email)
    /*
    const emailContact = await UserContact.findOne({ email }, { withDeleted: true })
    if (!emailContact) {
      logger.error(`Could not find UserContact with email: ${email}`)
      throw new Error(`Could not find UserContact with email: ${email}`)
    }
    */
    // const recipientUser = await dbUser.findOne({ id: emailContact.userId })
    if (!recipientUser) {
      logger.error(`unknown recipient to UserContact: email=${email}`)
      throw new Error('unknown recipient')
    }
    if (recipientUser.deletedAt) {
      logger.error(`The recipient account was deleted: recipientUser=${recipientUser}`)
      throw new Error('The recipient account was deleted')
    }
    const emailContact = recipientUser.emailContact
    if (!emailContact.emailChecked) {
      logger.error(`The recipient account is not activated: recipientUser=${recipientUser}`)
      throw new Error('The recipient account is not activated')
    }
    if (!isHexPublicKey(recipientUser.pubKey.toString('hex'))) {
      logger.error(`invalid recipient public key: recipientUser=${recipientUser}`)
      throw new Error('invalid recipient public key')
    }

    await executeTransaction(amount, memo, senderUser, recipientUser)
    logger.info(
      `successful executeTransaction(amount=${amount}, memo=${memo}, senderUser=${senderUser}, recipientUser=${recipientUser})`,
    )
    return true
  }
}

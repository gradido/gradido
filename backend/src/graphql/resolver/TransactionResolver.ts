import {
  Community as DbCommunity,
  PendingTransaction as DbPendingTransaction,
  Transaction as dbTransaction,
  TransactionLink as dbTransactionLink,
  User as dbUser,
} from 'database'
import { Decimal } from 'decimal.js-light'
import { Args, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { In, IsNull, getConnection } from 'typeorm'

import { Paginated } from '@arg/Paginated'
import { TransactionSendArgs } from '@arg/TransactionSendArgs'
import { Order } from '@enum/Order'
import { PendingTransactionState } from '@enum/PendingTransactionState'
import { TransactionTypeId } from '@enum/TransactionTypeId'
import { Transaction } from '@model/Transaction'
import { TransactionList } from '@model/TransactionList'
import { User } from '@model/User'

import { RIGHTS } from '@/auth/RIGHTS'
import { CONFIG } from '@/config'
import {
  sendTransactionLinkRedeemedEmail,
  sendTransactionReceivedEmail,
} from '@/emails/sendEmailVariants'
import { EVENT_TRANSACTION_RECEIVE, EVENT_TRANSACTION_SEND } from '@/event/Events'
import { SendCoinsResult } from '@/federation/client/1_0/model/SendCoinsResult'
import { LogError } from '@/server/LogError'
import { Context, getUser } from '@/server/context'
import { backendLogger as logger } from '@/server/logger'
import { TRANSACTIONS_LOCK } from '@/util/TRANSACTIONS_LOCK'
import { communityUser } from '@/util/communityUser'
import { fullName } from '@/util/utilities'
import { calculateBalance } from '@/util/validate'
import { virtualDecayTransaction, virtualLinkTransaction } from '@/util/virtualTransactions'

import { BalanceResolver } from './BalanceResolver'
import { GdtResolver } from './GdtResolver'
import { getCommunityByIdentifier, getCommunityName, isHomeCommunity } from './util/communities'
import { findUserByIdentifier } from './util/findUserByIdentifier'
import { getLastTransaction } from './util/getLastTransaction'
import { getTransactionList } from './util/getTransactionList'
import { invokeXComSendCoins } from './util/invokeXComSendCoins'
import {
  processXComCommittingSendCoins,
  processXComPendingSendCoins,
} from './util/processXComSendCoins'
import { sendTransactionsToDltConnector } from './util/sendTransactionsToDltConnector'
import { storeForeignUser } from './util/storeForeignUser'
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

    const openSenderPendingTx = await DbPendingTransaction.count({
      where: [
        { userGradidoID: sender.gradidoID, state: PendingTransactionState.NEW },
        { linkedUserGradidoID: sender.gradidoID, state: PendingTransactionState.NEW },
      ],
    })
    const openReceiverPendingTx = await DbPendingTransaction.count({
      where: [
        { userGradidoID: recipient.gradidoID, state: PendingTransactionState.NEW },
        { linkedUserGradidoID: recipient.gradidoID, state: PendingTransactionState.NEW },
      ],
    })
    if (openSenderPendingTx > 0 || openReceiverPendingTx > 0) {
      throw new LogError(
        `There exist still ongoing 'Pending-Transactions' for the involved users on sender-side!`,
      )
    }

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
      transactionSend.userCommunityUuid = sender.communityUuid
      transactionSend.linkedUserId = recipient.id
      transactionSend.linkedUserGradidoID = recipient.gradidoID
      transactionSend.linkedUserName = fullName(recipient.firstName, recipient.lastName)
      transactionSend.linkedUserCommunityUuid = recipient.communityUuid
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
      transactionReceive.userCommunityUuid = recipient.communityUuid
      transactionReceive.linkedUserId = sender.id
      transactionReceive.linkedUserGradidoID = sender.gradidoID
      transactionReceive.linkedUserName = fullName(sender.firstName, sender.lastName)
      transactionReceive.linkedUserCommunityUuid = sender.communityUuid
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
      await sendTransactionsToDltConnector()
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw new LogError('Transaction was not successful', e)
    } finally {
      await queryRunner.release()
    }
    await sendTransactionReceivedEmail({
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
  } finally {
    releaseLock()
  }
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

    let balanceGDTPromise: Promise<number | null> = Promise.resolve(null)
    if (CONFIG.GDT_ACTIVE) {
      const gdtResolver = new GdtResolver()
      balanceGDTPromise = gdtResolver.gdtBalance(context)
    }

    // find current balance
    const lastTransaction = await getLastTransaction(user.id)
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
    const involvedRemoteUsers: User[] = []
    // userTransactions.forEach((transaction: dbTransaction) => {
    // use normal for loop because of timing problems with await in forEach-loop
    for (const transaction of userTransactions) {
      if ((transaction.typeId as TransactionTypeId) === TransactionTypeId.CREATION) {
        continue
      }
      if (transaction.linkedUserId && !involvedUserIds.includes(transaction.linkedUserId)) {
        involvedUserIds.push(transaction.linkedUserId)
      }
      if (!transaction.linkedUserId && transaction.linkedUserGradidoID) {
        logger.debug(
          'search for remoteUser...',
          transaction.linkedUserCommunityUuid,
          transaction.linkedUserGradidoID,
        )
        const dbRemoteUser = await dbUser.findOne({
          where: [
            {
              foreign: true,
              communityUuid: transaction.linkedUserCommunityUuid ?? undefined,
              gradidoID: transaction.linkedUserGradidoID,
            },
          ],
        })
        logger.debug('found dbRemoteUser:', dbRemoteUser)
        const remoteUser = new User(dbRemoteUser)
        if (dbRemoteUser === null) {
          logger.debug('no dbRemoteUser found, init from tx:', transaction)
          if (transaction.linkedUserCommunityUuid !== null) {
            remoteUser.communityUuid = transaction.linkedUserCommunityUuid
          }
          remoteUser.gradidoID = transaction.linkedUserGradidoID
          if (transaction.linkedUserName) {
            remoteUser.firstName = transaction.linkedUserName.slice(
              0,
              transaction.linkedUserName.indexOf(' '),
            )
            remoteUser.lastName = transaction.linkedUserName?.slice(
              transaction.linkedUserName.indexOf(' '),
              transaction.linkedUserName.length,
            )
          }
        }
        remoteUser.communityName = await getCommunityName(remoteUser.communityUuid)
        involvedRemoteUsers.push(remoteUser)
      }
    }
    logger.debug(`involvedUserIds=`, involvedUserIds)
    logger.debug(`involvedRemoteUsers=`, involvedRemoteUsers)

    // We need to show the name for deleted users for old transactions
    const involvedDbUsers = await dbUser.find({
      where: { id: In(involvedUserIds) },
      withDeleted: true,
      relations: ['emailContact'],
    })
    const involvedUsers = involvedDbUsers.map((u) => new User(u))
    logger.debug(`involvedUsers=`, involvedUsers)

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
      if (sumHoldAvailableAmount.isZero()) {
        const linkCount = await dbTransactionLink.count({
          where: {
            userId: user.id,
            redeemedAt: IsNull(),
          },
        })
        if (linkCount > 0) {
          transactions.push(
            virtualLinkTransaction(
              lastTransaction.balance,
              new Decimal(0),
              new Decimal(0),
              new Decimal(0),
              now,
              now,
              self,
              (userTransactions.length && userTransactions[0].balance) || new Decimal(0),
            ),
          )
        }
      } else if (sumHoldAvailableAmount.greaterThan(0)) {
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
        logger.debug(`transactions=`, transactions)
      }
    }

    // transactions
    userTransactions.forEach((userTransaction: dbTransaction) => {
      /*
      const linkedUser =
        userTransaction.typeId === TransactionTypeId.CREATION
          ? communityUser
          : involvedUsers.find((u) => u.id === userTransaction.linkedUserId)
      */
      let linkedUser: User | undefined
      if ((userTransaction.typeId as TransactionTypeId) === TransactionTypeId.CREATION) {
        linkedUser = communityUser
        logger.debug('CREATION-linkedUser=', linkedUser)
      } else if (userTransaction.linkedUserId) {
        linkedUser = involvedUsers.find((u) => u.id === userTransaction.linkedUserId)
        logger.debug('local linkedUser=', linkedUser)
      } else if (userTransaction.linkedUserCommunityUuid) {
        linkedUser = involvedRemoteUsers.find(
          (u) => u.gradidoID === userTransaction.linkedUserGradidoID,
        )
        logger.debug('remote linkedUser=', linkedUser)
      }
      transactions.push(new Transaction(userTransaction, self, linkedUser))
    })
    logger.debug(`TransactionTypeId.CREATION: transactions=`, transactions)

    transactions.forEach((transaction: Transaction) => {
      if (transaction.typeId !== TransactionTypeId.DECAY) {
        const { balance, previousBalance, amount } = transaction
        transaction.decay.decay = new Decimal(
          Number(balance) - Number(amount) - Number(previousBalance),
        ).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
      }
    })
    if (CONFIG.GDT_ACTIVE) {
      const balanceGDT = await balanceGDTPromise
      context.balanceGDT = balanceGDT
    }

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
    logger.info(
      `sendCoins(recipientCommunityIdentifier=${recipientCommunityIdentifier}, recipientIdentifier=${recipientIdentifier}, amount=${amount}, memo=${memo})`,
    )
    const homeCom = await DbCommunity.findOneOrFail({ where: { foreign: false } })
    const senderUser = getUser(context)

    if (!recipientCommunityIdentifier || (await isHomeCommunity(recipientCommunityIdentifier))) {
      // processing sendCoins within sender and recipient are both in home community
      const recipientUser = await findUserByIdentifier(
        recipientIdentifier,
        recipientCommunityIdentifier,
      )
      if (!recipientUser) {
        throw new LogError('The recipient user was not found', recipientUser)
      }
      if (recipientUser.foreign) {
        throw new LogError('Found foreign recipient user for a local transaction:', recipientUser)
      }

      await executeTransaction(amount, memo, senderUser, recipientUser)
      logger.info('successful executeTransaction', amount, memo, senderUser, recipientUser)
    } else {
      await invokeXComSendCoins(
        homeCom,
        recipientCommunityIdentifier,
        amount,
        memo,
        senderUser,
        recipientIdentifier,
      )
    }
    return true
  }
}

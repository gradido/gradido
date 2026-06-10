import { Paginated } from '@arg/Paginated'
import { TransactionSendArgs } from '@arg/TransactionSendArgs'
import { Order } from '@enum/Order'
import { Transaction } from '@model/Transaction'
import { TransactionList } from '@model/TransactionList'
import { User } from '@model/User'
import {
  ApiVersionType,
  CommandClientFactory,
  EncryptedTransferArgs,
  fullName,
  processXComCompleteTransaction,
  SendEmailCommand,
  sendCustomEmail,
  sendTransactionLinkRedeemedEmail,
  sendTransactionReceivedEmail,
  TransactionTypeId,
  V1_0_CommandClient,
} from 'core'
import {
  AppDatabase,
  countOpenPendingTransactions,
  DltTransaction as DbDltTransaction,
  Transaction as dbTransaction,
  TransactionLink as dbTransactionLink,
  User as dbUser,
  findUserByIdentifier,
  getCommunityByUuid,
  getCommunityWithFederatedCommunityByIdentifier,
  getLastTransaction,
} from 'database'
import { getLogger, Logger } from 'log4js'
import { Mutex } from 'redis-semaphore'
import { CommandJwtPayloadType, DecayCalculationType, encryptAndSign, GradidoUnit } from 'shared'
import { randombytes_random } from 'sodium-native'
import { Args, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { In, IsNull } from 'typeorm'
import { redeemDeferredTransferTransaction, transferTransaction } from '@/apis/dltConnector'
import { RIGHTS } from '@/auth/RIGHTS'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { EVENT_TRANSACTION_RECEIVE, EVENT_TRANSACTION_SEND } from '@/event/Events'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'
import { communityUser } from '@/util/communityUser'
import { calculateBalance } from '@/util/validate'
import { virtualDecayTransaction, virtualLinkTransaction } from '@/util/virtualTransactions'
import { SendEmailArgs } from '../arg/SendEmailArgs'
import { BalanceResolver } from './BalanceResolver'
import { GdtResolver } from './GdtResolver'
import { getCommunityName, isHomeCommunity } from './util/communities'
import { getTransactionList } from './util/getTransactionList'
import { transactionLinksDecayed } from './util/transactionLinksDecayed'

const db = AppDatabase.getInstance()
const createLogger = () =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.TransactionResolver`)

export const executeTransaction = async (
  amount: GradidoUnit,
  memo: string,
  sender: dbUser,
  recipient: dbUser,
  logger: Logger,
  transactionLink?: dbTransactionLink | null,
): Promise<boolean> => {
  // acquire lock
  // const releaseLock = await TRANSACTIONS_LOCK.acquire()
  const mutex = new Mutex(db.getRedisClient(), 'TRANSACTIONS_LOCK')
  await mutex.acquire()

  const receivedCallDate = new Date()
  let dltTransactionPromise: Promise<DbDltTransaction | null> = Promise.resolve(null)
  if (!transactionLink) {
    dltTransactionPromise = transferTransaction(
      sender,
      recipient,
      amount.toString(),
      memo,
      receivedCallDate,
    )
  } else {
    dltTransactionPromise = redeemDeferredTransferTransaction(
      transactionLink,
      amount.toString(),
      receivedCallDate,
      recipient,
    )
  }

  try {
    logger.info('executeTransaction', amount, memo, sender, recipient)

    if ((await countOpenPendingTransactions([sender.gradidoID, recipient.gradidoID])) > 0) {
      throw new LogError(
        `There exist still ongoing 'Pending-Transactions' for the involved users on sender-side!`,
      )
    }

    if (sender.id === recipient.id) {
      throw new LogError('Sender and Recipient are the same', sender.id)
    }
    const negativeAmount = amount.negated()
    // validate amount
    const sendBalance = await calculateBalance(
      sender.id,
      negativeAmount,
      receivedCallDate,
      transactionLink,
    )
    logger.debug(`calculated Balance=${sendBalance}`)
    if (!sendBalance) {
      throw new LogError('User has not enough GDD or amount is < 0', sendBalance)
    }

    const queryRunner = db.getDataSource().createQueryRunner()
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
      transactionSend.amount = negativeAmount
      transactionSend.balance = sendBalance.balance
      transactionSend.balanceDate = receivedCallDate
      transactionSend.decay = sendBalance.decay.decay
      transactionSend.decayStart = sendBalance.decay.start
      transactionSend.decayCalculationType = DecayCalculationType.NATIVE_C_FIXED_FACTOR_INTEGER
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
      transactionReceive.decay = receiveBalance ? receiveBalance.decay.decay : new GradidoUnit(0n)
      transactionReceive.decayStart = receiveBalance ? receiveBalance.decay.start : null
      transactionReceive.decayCalculationType = DecayCalculationType.NATIVE_C_FIXED_FACTOR_INTEGER
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
      // update dltTransaction with transactionId
      const startTime = new Date()
      const dltTransaction = await dltTransactionPromise
      const endTime = new Date()
      logger.debug(
        `dlt-connector transaction finished in ${endTime.getTime() - startTime.getTime()} ms`,
      )
      if (dltTransaction) {
        dltTransaction.transactionId = transactionSend.id
        await dltTransaction.save()
      }
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
      const recipientCom = await getCommunityName(recipient.communityUuid)
      await sendTransactionLinkRedeemedEmail({
        firstName: sender.firstName,
        lastName: sender.lastName,
        email: sender.emailContact.email,
        language: sender.language,
        senderFirstName: recipient.firstName,
        senderLastName: recipient.lastName,
        senderEmail: recipientCom, // recipient.emailContact.email,
        transactionAmount: amount,
        transactionMemo: memo,
      })
    }
    logger.info(`finished executeTransaction successfully`)
  } finally {
    // releaseLock()
    await mutex.release()
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
    const logger = createLogger()
    logger.addContext('user', user.id)
    logger.info(`transactionList`)

    let balanceGDTPromise: Promise<number | null> = Promise.resolve(null)
    if (CONFIG.GDT_ACTIVE) {
      const gdtResolver = new GdtResolver()
      balanceGDTPromise = gdtResolver.gdtBalance(context)
    }

    // find current balance
    const lastTransaction = await getLastTransaction(user.id)
    logger.debug(`lastTransaction=${lastTransaction?.id}`)

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
        logger.debug(`found dbRemoteUser: ${dbRemoteUser?.id}`)
        const remoteUser = new User(dbRemoteUser)
        if (dbRemoteUser === null) {
          logger.debug(`no dbRemoteUser found, init from tx: ${transaction.id}`)
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
    logger.debug(
      `involvedRemoteUsers=`,
      involvedRemoteUsers.map((u) => u.id),
    )

    // We need to show the name for deleted users for old transactions
    const involvedDbUsers = await dbUser.find({
      where: { id: In(involvedUserIds) },
      withDeleted: true,
      relations: ['emailContact'],
    })
    const involvedUsers = involvedDbUsers.map((u) => new User(u))
    logger.debug(
      `involvedUsers=`,
      involvedUsers.map((u) => u.id),
    )

    const self = new User(user)
    const transactions: Transaction[] = []

    const { sumHoldAvailableDecayedAmount, sumAmount, transactionLinkCount } =
      await transactionLinksDecayed(user.id, now)

    context.linkCount = transactionLinkCount
    logger.debug(`transactionLinkCount=${transactionLinkCount}`)
    context.sumHoldAvailableDecayedAmount = sumHoldAvailableDecayedAmount
    logger.debug(`sumHoldAvailableDecayedAmount=${sumHoldAvailableDecayedAmount.toString()}`)

    const lastTransactionBalance = lastTransaction.balance

    // decay & link transactions
    if (currentPage === 1 && order === Order.DESC) {
      logger.debug(`currentPage == 1: transactions=${transactions.map((t) => t.id)}`)
      // The virtual decay is always on the booked amount, not including the generated, not yet booked links,
      // since the decay is substantially different when the amount is less
      transactions.push(
        virtualDecayTransaction(
          lastTransactionBalance,
          lastTransaction.balanceDate,
          now,
          self,
          sumHoldAvailableDecayedAmount,
        ),
      )
      logger.debug(`transactions=${transactions.map((t) => t.id)}`)

      // virtual transaction for pending transaction-links sum
      const zeroAmount = new GradidoUnit(0n)
      if (sumHoldAvailableDecayedAmount.comparedTo(zeroAmount) === 0n) {
        const linkCount = await dbTransactionLink.count({
          where: {
            userId: user.id,
            redeemedAt: IsNull(),
          },
        })
        if (linkCount > 0) {
          transactions.push(virtualLinkTransaction(zeroAmount, self))
        }
      } else if (sumHoldAvailableDecayedAmount.comparedTo(zeroAmount) > 0) {
        logger.debug(
          `sumHoldAvailableDecayedAmount > 0: transactions=${transactions.map((t) => t.id)}`,
        )
        transactions.push(virtualLinkTransaction(sumAmount.negated(), self))
        logger.debug(`transactions=${transactions.map((t) => t.id)}`)
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
        logger.debug(`CREATION-linkedUser=${linkedUser.id}`)
      } else if (userTransaction.linkedUserId) {
        linkedUser = involvedUsers.find((u) => u.id === userTransaction.linkedUserId)
        logger.debug(`local linkedUser=${linkedUser?.id}`)
      } else if (userTransaction.linkedUserCommunityUuid) {
        linkedUser = involvedRemoteUsers.find(
          (u) => u.gradidoID === userTransaction.linkedUserGradidoID,
        )
        logger.debug(`remote linkedUser=${linkedUser?.id}`)
      }
      transactions.push(new Transaction(userTransaction, self, linkedUser))
    })
    logger.debug(
      `TransactionTypeId.CREATION: transactions=`,
      transactions.map((t) => t.id),
    )

    /**
     * ⚠️ Legacy Data Correction – Decay Recalculation
     *
     * This block recalculates the decay value for transactions on-the-fly during read operations.
     * It exists to compensate for historical precision inconsistencies in earlier system versions.
     *
     * --- Background ---
     * Previously, monetary values (balance, amount, previousBalance) were stored and calculated
     * using high precision (Decimal.js with ~25 decimal places). However, when these values were
     * transferred to and displayed in the frontend (rounded to 2 decimal places), small rounding
     * discrepancies occasionally appeared.
     *
     * In rare cases (~0.126%), this caused the following invariant to break from the user's perspective:
     *
     * previousBalance ± amount ± decay === balance
     *
     * Instead, users would observe slight mismatches due to precision loss during rounding.
     *
     * Showing 4 decimal places in the frontend would make it even worse, because than it occurs in ~ 25% of cases.
     *
     * --- Purpose of this Code ---
     * This loop recomputes decay dynamically using the formula:
     *
     * decay = balance - amount - previousBalance
     *
     * This ensures that the invariant holds again when values are displayed, effectively masking
     * historical rounding inconsistencies for legacy transactions.
     *
     * --- Important Notes ---
     *
     * The recalculation is NOT persisted to the database.
     * It mutates the transaction object in memory on every read.
     *
     * --- Trade-offs / Risks ---
     *
     * ⚠️ Hidden data mutation:
     * The system silently alters values at read time, which can make debugging and auditing harder.
     *
     * ⚠️ Performance overhead:
     * Every transaction list query incurs additional computation.
     *
     * ⚠️ Non-deterministic representation:
     * The value of decay depends on whether this code path is executed.
     *
     * ⚠️ Technical debt:
     * This is a workaround for historical inconsistencies, not a root-cause fix.
     *
     * --- Current Situation ---
     * Newer transactions are now consistently calculated and stored using a unified precision
     * (4 decimal places across backend and frontend), which eliminates this issue going forward.
     *
     * --- Recommended Next Steps ---
     * Consider replacing this runtime correction with:
     *
     * - One-time data migration:
     *   Recalculate and persist correct decay values for all legacy transactions.
     *
     * Once legacy data is cleaned up, this block should be removed to restore deterministic behavior.
     */
    transactions.forEach((transaction: Transaction) => {
      if (transaction.typeId !== TransactionTypeId.DECAY) {
        const { balance, previousBalance, amount } = transaction
        transaction.decay.decay = balance.subtract(amount).subtract(previousBalance)
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
    const logger = createLogger()
    logger.addContext('from', context.user?.id)
    logger.addContext('amount', amount.toString())
    logger.debug(
      `sendCoins(recipientCommunityIdentifier=${recipientCommunityIdentifier}, recipientIdentifier=${recipientIdentifier}, amount=${amount}, memo=${memo})`,
    )
    const senderUser = getUser(context)
    if (!recipientCommunityIdentifier || (await isHomeCommunity(recipientCommunityIdentifier))) {
      // processing sendCoins within sender and recipient are both in home community
      const recipientUser = await findUserByIdentifier(
        recipientIdentifier,
        recipientCommunityIdentifier,
      )
      if (!recipientUser) {
        const errmsg = 'The recipient user was not found: ' + recipientIdentifier
        logger.error(errmsg)
        throw new Error(errmsg)
      }
      logger.addContext('to', recipientUser?.id)
      if (recipientUser.foreign) {
        const errmsg = 'Found foreign recipient user for a local transaction: ' + recipientUser
        logger.error(errmsg)
        throw new Error(errmsg)
      }

      await executeTransaction(amount, memo, senderUser, recipientUser, logger)
      logger.info('successful executeTransaction')
    } else {
      await processXComCompleteTransaction(
        senderUser.communityUuid,
        senderUser.gradidoID,
        recipientCommunityIdentifier,
        recipientIdentifier,
        amount.toString(),
        memo,
      )
    }
    return true
  }

  @Authorized([RIGHTS.SEND_COINS])
  @Mutation(() => Boolean)
  async sendEmail(
    @Args()
    { recipientCommunityIdentifier, recipientIdentifier, subject, memo }: SendEmailArgs,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const logger = createLogger()
    logger.addContext('from', context.user?.id)
    logger.debug(
      `sendEmail(recipientCommunityIdentifier=${recipientCommunityIdentifier}, recipientIdentifier=${recipientIdentifier}, subject=${subject}, memo=${memo})`,
    )
    const senderUser = getUser(context)
    if (!recipientCommunityIdentifier || (await isHomeCommunity(recipientCommunityIdentifier))) {
      // processing sendEmail within sender and recipient are both in home community
      const recipientUser = await findUserByIdentifier(
        recipientIdentifier,
        recipientCommunityIdentifier,
      )
      if (!recipientUser) {
        const errmsg = 'The recipient user was not found: ' + recipientIdentifier
        logger.error(errmsg)
        throw new Error(errmsg)
      }
      if (senderUser.id === recipientUser.id) {
        const errmsg = 'You cannot send an email to yourself'
        logger.error(errmsg)
        throw new Error(errmsg)
      }
      logger.addContext('to', recipientUser?.id)
      if (recipientUser.foreign) {
        const errmsg = 'Found foreign recipient user for a local action: ' + recipientUser
        logger.error(errmsg)
        throw new Error(errmsg)
      }
      if (!recipientUser.emailContact) {
        const errmsg = 'Recipient user has no email contact: ' + recipientUser
        logger.error(errmsg)
        throw new Error(errmsg)
      }
      sendCustomEmail({
        firstName: recipientUser.firstName,
        lastName: recipientUser.lastName,
        email: recipientUser.emailContact.email,
        language: recipientUser.language,
        senderFirstName: senderUser.firstName,
        senderLastName: senderUser.lastName,
        subject: subject,
        memo: memo,
        senderUuid: senderUser.gradidoID,
        senderCommunityUuid: senderUser.communityUuid,
      })
    } else {
      // sendEmail for foreign communities
      const senderCom = await getCommunityByUuid(senderUser.communityUuid)
      if (senderCom === null) {
        const errmsg = 'The sender community was not found' + senderUser.communityUuid
        logger.error(errmsg)
        throw new Error(errmsg)
      }

      const receiverCom = await getCommunityWithFederatedCommunityByIdentifier(
        recipientCommunityIdentifier,
      )
      if (receiverCom === null) {
        const errmsg = 'The recipient community was not found' + recipientCommunityIdentifier
        logger.error(errmsg)
        throw new Error(errmsg)
      }
      if (!receiverCom.federatedCommunities || receiverCom.federatedCommunities.length === 0) {
        const errmsg =
          'The recipient community has no federated communities' + recipientCommunityIdentifier
        logger.error(errmsg)
        throw new Error(errmsg)
      }
      const receiverFCom = receiverCom.federatedCommunities.find(
        (fcom) => fcom.apiVersion === ApiVersionType.V1_0,
      )
      if (!receiverFCom) {
        const errmsg =
          'The federated community of the recipient community was not found ' +
          recipientCommunityIdentifier
        logger.error(errmsg)
        throw new Error(errmsg)
      }
      const cmdClient = CommandClientFactory.getInstance(receiverFCom)

      if (cmdClient instanceof V1_0_CommandClient) {
        const handshakeID = randombytes_random().toString()

        const payload = new CommandJwtPayloadType(
          handshakeID,
          SendEmailCommand.SEND_MAIL_COMMAND,
          SendEmailCommand.name,
          [
            JSON.stringify({
              mailType: 'sendCustomEmail',
              senderComUuid: senderUser.communityUuid,
              senderGradidoId: senderUser.gradidoID,
              receiverComUuid: recipientCommunityIdentifier,
              receiverGradidoId: recipientIdentifier,
              subject: subject,
              memo: memo,
            }),
          ],
        )
        const jws = await encryptAndSign(
          payload,
          senderCom.privateJwtKey!,
          receiverCom.publicJwtKey!,
        )
        const args = new EncryptedTransferArgs()
        args.publicKey = senderCom.publicKey.toString('hex')
        args.jwt = jws
        args.handshakeID = handshakeID
        const result = await cmdClient.sendCommand(args)
        if (typeof result === 'string') {
          const errmsg = 'Failed to send command to federated community with error: ' + result
          logger.error(errmsg)
          throw new Error(result)
        }
      }
    }
    return true
  }
}

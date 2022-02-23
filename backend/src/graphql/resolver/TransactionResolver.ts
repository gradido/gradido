/* eslint-disable new-cap */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { Resolver, Query, Args, Authorized, Ctx, Mutation } from 'type-graphql'
import { getCustomRepository, getConnection, QueryRunner, In } from '@dbTools/typeorm'

import CONFIG from '../../config'
import { sendTransactionReceivedEmail } from '../../mailer/sendTransactionReceivedEmail'

import { Transaction } from '../model/Transaction'
import { TransactionList } from '../model/TransactionList'

import TransactionSendArgs from '../arg/TransactionSendArgs'
import Paginated from '../arg/Paginated'

import { Order } from '../enum/Order'

import { UserRepository } from '../../typeorm/repository/User'
import { UserTransactionRepository } from '../../typeorm/repository/UserTransaction'

import { User as dbUser } from '@entity/User'
import { UserTransaction as dbUserTransaction } from '@entity/UserTransaction'
import { Transaction as dbTransaction } from '@entity/Transaction'
import { Balance as dbBalance } from '@entity/Balance'

import { apiPost } from '../../apis/HttpRequest'
import { roundFloorFrom4, roundCeilFrom4 } from '../../util/round'
import { calculateDecay } from '../../util/decay'
import { TransactionTypeId } from '../enum/TransactionTypeId'
import { TransactionType } from '../enum/TransactionType'
import { hasUserAmount, isHexPublicKey } from '../../util/validate'
import { RIGHTS } from '../../auth/RIGHTS'

// Helper function
async function calculateAndAddDecayTransactions(
  userTransactions: dbUserTransaction[],
  user: dbUser,
  decay: boolean,
  skipFirstTransaction: boolean,
): Promise<Transaction[]> {
  const finalTransactions: Transaction[] = []
  const transactionIds: number[] = []
  const involvedUserIds: number[] = []

  userTransactions.forEach((userTransaction: dbUserTransaction) => {
    transactionIds.push(userTransaction.transactionId)
  })

  const transactions = await dbTransaction.find({ where: { id: In(transactionIds) } })
  const transactionIndiced: dbTransaction[] = []
  transactions.forEach((transaction: dbTransaction) => {
    transactionIndiced[transaction.id] = transaction
    involvedUserIds.push(transaction.userId)
    if (transaction.transactionTypeId === TransactionTypeId.SEND) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      involvedUserIds.push(transaction.sendReceiverUserId!) // TODO ensure not null properly
    }
  })
  // remove duplicates
  // https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
  const involvedUsersUnique = involvedUserIds.filter((v, i, a) => a.indexOf(v) === i)
  const userRepository = getCustomRepository(UserRepository)
  const userIndiced = await userRepository.getUsersIndiced(involvedUsersUnique)

  for (let i = 0; i < userTransactions.length; i++) {
    const userTransaction = userTransactions[i]
    const transaction = transactionIndiced[userTransaction.transactionId]
    const finalTransaction = new Transaction()
    finalTransaction.transactionId = transaction.id
    finalTransaction.date = transaction.received.toISOString()
    finalTransaction.memo = transaction.memo
    finalTransaction.totalBalance = roundFloorFrom4(userTransaction.balance)
    const previousTransaction = i > 0 ? userTransactions[i - 1] : null

    if (previousTransaction) {
      const currentTransaction = userTransaction
      const decay = calculateDecay(
        previousTransaction.balance,
        previousTransaction.balanceDate,
        currentTransaction.balanceDate,
      )
      const balance = previousTransaction.balance - decay.balance

      if (CONFIG.DECAY_START_TIME < currentTransaction.balanceDate) {
        finalTransaction.decay = decay
        finalTransaction.decay.balance = roundFloorFrom4(balance)
        if (
          previousTransaction.balanceDate < CONFIG.DECAY_START_TIME &&
          currentTransaction.balanceDate > CONFIG.DECAY_START_TIME
        ) {
          finalTransaction.decay.decayStartBlock = (
            CONFIG.DECAY_START_TIME.getTime() / 1000
          ).toString()
        }
      }
    }

    // sender or receiver when user has sent money
    // group name if creation
    // type: gesendet / empfangen / geschöpft
    // transaktion nr / id
    // date
    // balance
    if (userTransaction.transactionTypeId === TransactionTypeId.CREATION) {
      // creation
      finalTransaction.name = 'Gradido Akademie'
      finalTransaction.type = TransactionType.CREATION
      // finalTransaction.targetDate = creation.targetDate
      finalTransaction.balance = roundFloorFrom4(Number(transaction.amount)) // Todo unsafe conversion
    } else if (userTransaction.transactionTypeId === TransactionTypeId.SEND) {
      // send coin
      let otherUser: dbUser | undefined
      finalTransaction.balance = roundFloorFrom4(Number(transaction.amount)) // Todo unsafe conversion
      if (transaction.userId === user.id) {
        finalTransaction.type = TransactionType.SEND
        otherUser = userIndiced.find((u) => u.id === transaction.sendReceiverUserId)
        // finalTransaction.pubkey = sendCoin.recipiantPublic
      } else if (transaction.sendReceiverUserId === user.id) {
        finalTransaction.type = TransactionType.RECIEVE
        otherUser = userIndiced.find((u) => u.id === transaction.userId)
        // finalTransaction.pubkey = sendCoin.senderPublic
      } else {
        throw new Error('invalid transaction')
      }
      if (otherUser) {
        finalTransaction.name = otherUser.firstName + ' ' + otherUser.lastName
        finalTransaction.email = otherUser.email
      }
    }
    if (i > 0 || !skipFirstTransaction) {
      finalTransactions.push(finalTransaction)
    }

    if (i === userTransactions.length - 1 && decay) {
      const now = new Date()
      const decay = calculateDecay(userTransaction.balance, userTransaction.balanceDate, now)
      const balance = userTransaction.balance - decay.balance

      const decayTransaction = new Transaction()
      decayTransaction.type = 'decay'
      decayTransaction.balance = roundCeilFrom4(balance)
      decayTransaction.decayDuration = decay.decayDuration
      decayTransaction.decayStart = decay.decayStart
      decayTransaction.decayEnd = decay.decayEnd
      finalTransactions.push(decayTransaction)
    }
  }
  return finalTransactions
}

// helper helper function
async function updateStateBalance(
  user: dbUser,
  centAmount: number,
  received: Date,
  queryRunner: QueryRunner,
): Promise<dbBalance> {
  let balance = await dbBalance.findOne({ userId: user.id })
  if (!balance) {
    balance = new dbBalance()
    balance.userId = user.id
    balance.amount = centAmount
    balance.modified = received
  } else {
    const decayedBalance = calculateDecay(balance.amount, balance.recordDate, received).balance
    balance.amount = Number(decayedBalance) + centAmount
    balance.modified = new Date()
  }
  if (balance.amount <= 0) {
    throw new Error('error new balance <= 0')
  }
  balance.recordDate = received
  return queryRunner.manager.save(balance).catch((error) => {
    throw new Error('error saving balance:' + error)
  })
}

// helper helper function
async function addUserTransaction(
  user: dbUser,
  transaction: dbTransaction,
  centAmount: number,
  queryRunner: QueryRunner,
): Promise<dbUserTransaction> {
  let newBalance = centAmount
  const userTransactionRepository = getCustomRepository(UserTransactionRepository)
  const lastUserTransaction = await userTransactionRepository.findLastForUser(user.id)
  if (lastUserTransaction) {
    newBalance += Number(
      calculateDecay(
        Number(lastUserTransaction.balance),
        lastUserTransaction.balanceDate,
        transaction.received,
      ).balance,
    )
  }

  if (newBalance <= 0) {
    throw new Error('error new balance <= 0')
  }

  const newUserTransaction = new dbUserTransaction()
  newUserTransaction.userId = user.id
  newUserTransaction.transactionId = transaction.id
  newUserTransaction.transactionTypeId = transaction.transactionTypeId
  newUserTransaction.balance = newBalance
  newUserTransaction.balanceDate = transaction.received

  return queryRunner.manager.save(newUserTransaction).catch((error) => {
    throw new Error('Error saving user transaction: ' + error)
  })
}

@Resolver()
export class TransactionResolver {
  @Authorized([RIGHTS.TRANSACTION_LIST])
  @Query(() => TransactionList)
  async transactionList(
    @Args()
    {
      currentPage = 1,
      pageSize = 25,
      order = Order.DESC,
      onlyCreations = false,
      userId,
    }: Paginated,
    @Ctx() context: any,
  ): Promise<TransactionList> {
    // load user
    const userRepository = getCustomRepository(UserRepository)
    const user = userId
      ? await userRepository.findOneOrFail({ id: userId }, { withDeleted: true })
      : await userRepository.findByPubkeyHex(context.pubKey)
    let limit = pageSize
    let offset = 0
    let skipFirstTransaction = false
    if (currentPage > 1) {
      offset = (currentPage - 1) * pageSize - 1
      limit++
    }
    if (offset && order === Order.ASC) {
      offset--
    }
    const userTransactionRepository = getCustomRepository(UserTransactionRepository)
    const [userTransactions, userTransactionsCount] =
      await userTransactionRepository.findByUserPaged(user.id, limit, offset, order, onlyCreations)
    skipFirstTransaction = userTransactionsCount > offset + limit
    const decay = !(currentPage > 1)
    let transactions: Transaction[] = []
    if (userTransactions.length) {
      if (order === Order.DESC) {
        userTransactions.reverse()
      }
      transactions = await calculateAndAddDecayTransactions(
        userTransactions,
        user,
        decay,
        skipFirstTransaction,
      )
      if (order === Order.DESC) {
        transactions.reverse()
      }
    }

    const transactionList = new TransactionList()
    transactionList.count = userTransactionsCount
    transactionList.transactions = transactions

    // get gdt sum
    transactionList.gdtSum = null
    try {
      const resultGDTSum = await apiPost(`${CONFIG.GDT_API_URL}/GdtEntries/sumPerEmailApi`, {
        email: user.email,
      })
      if (resultGDTSum.success) transactionList.gdtSum = Number(resultGDTSum.data.sum) || 0
    } catch (err: any) {}

    // get balance
    const balanceEntity = await dbBalance.findOne({ userId: user.id })
    if (balanceEntity) {
      const now = new Date()
      transactionList.balance = roundFloorFrom4(balanceEntity.amount)
      // TODO: Add a decay object here instead of static data representing the decay.
      transactionList.decay = roundFloorFrom4(
        calculateDecay(balanceEntity.amount, balanceEntity.recordDate, now).balance,
      )
      transactionList.decayDate = now.toString()
    }

    return transactionList
  }

  @Authorized([RIGHTS.SEND_COINS])
  @Mutation(() => String)
  async sendCoins(
    @Args() { email, amount, memo }: TransactionSendArgs,
    @Ctx() context: any,
  ): Promise<boolean> {
    // TODO this is subject to replay attacks
    const userRepository = getCustomRepository(UserRepository)
    const senderUser = await userRepository.findByPubkeyHex(context.pubKey)
    if (senderUser.pubKey.length !== 32) {
      throw new Error('invalid sender public key')
    }
    // validate amount
    if (!hasUserAmount(senderUser, amount)) {
      throw new Error("user hasn't enough GDD or amount is < 0")
    }

    // validate recipient user
    const recipientUser = await dbUser.findOne({ email: email }, { withDeleted: true })
    if (!recipientUser) {
      throw new Error('recipient not known')
    }
    if (recipientUser.deletedAt) {
      throw new Error('The recipient account was deleted')
    }
    if (!isHexPublicKey(recipientUser.pubKey.toString('hex'))) {
      throw new Error('invalid recipient public key')
    }

    const centAmount = Math.trunc(amount * 10000)

    const queryRunner = getConnection().createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('READ UNCOMMITTED')
    try {
      // transaction
      const transaction = new dbTransaction()
      transaction.transactionTypeId = TransactionTypeId.SEND
      transaction.memo = memo
      transaction.userId = senderUser.id
      transaction.pubkey = senderUser.pubKey
      transaction.sendReceiverUserId = recipientUser.id
      transaction.sendReceiverPublicKey = recipientUser.pubKey
      transaction.amount = BigInt(centAmount)

      await queryRunner.manager.insert(dbTransaction, transaction)

      // Insert Transaction: sender - amount
      const senderUserTransactionBalance = await addUserTransaction(
        senderUser,
        transaction,
        -centAmount,
        queryRunner,
      )

      // Insert Transaction: recipient + amount
      const recipiantUserTransactionBalance = await addUserTransaction(
        recipientUser,
        transaction,
        centAmount,
        queryRunner,
      )

      // Update Balance: sender - amount
      const senderStateBalance = await updateStateBalance(
        senderUser,
        -centAmount,
        transaction.received,
        queryRunner,
      )

      // Update Balance: recipiant + amount
      const recipiantStateBalance = await updateStateBalance(
        recipientUser,
        centAmount,
        transaction.received,
        queryRunner,
      )

      if (senderStateBalance.amount !== senderUserTransactionBalance.balance) {
        throw new Error('db data corrupted, sender')
      }
      if (recipiantStateBalance.amount !== recipiantUserTransactionBalance.balance) {
        throw new Error('db data corrupted, recipiant')
      }

      // TODO: WTF?
      // I just assume that due to implicit type conversion the decimal places were cut.
      // Using `Math.trunc` to simulate this behaviour
      transaction.sendSenderFinalBalance = BigInt(Math.trunc(senderStateBalance.amount))

      await queryRunner.manager.save(transaction).catch((error) => {
        throw new Error('error saving transaction with tx hash: ' + error)
      })

      await queryRunner.commitTransaction()
    } catch (e) {
      await queryRunner.rollbackTransaction()
      // TODO: This is broken code - we should never correct an autoincrement index in production
      // according to dario it is required tho to properly work. The index of the table is used as
      // index for the transaction which requires a chain without gaps
      const count = await queryRunner.manager.count(dbTransaction)
      // fix autoincrement value which seems not effected from rollback
      await queryRunner
        .query('ALTER TABLE `transactions` auto_increment = ?', [count])
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.log('problems with reset auto increment: %o', error)
        })
      throw e
    } finally {
      await queryRunner.release()
    }
    // send notification email
    // TODO: translate
    await sendTransactionReceivedEmail({
      senderFirstName: senderUser.firstName,
      senderLastName: senderUser.lastName,
      recipientFirstName: recipientUser.firstName,
      recipientLastName: recipientUser.lastName,
      email: recipientUser.email,
      amount,
      memo,
    })

    return true
  }
}

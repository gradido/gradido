/* eslint-disable new-cap */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { Resolver, Query, Args, Authorized, Ctx, Mutation } from 'type-graphql'
import { getCustomRepository, getConnection } from '@dbTools/typeorm'

import CONFIG from '../../config'
import { sendTransactionReceivedEmail } from '../../mailer/sendTransactionReceivedEmail'

import { Transaction } from '../model/Transaction'
import { TransactionList } from '../model/TransactionList'

import TransactionSendArgs from '../arg/TransactionSendArgs'
import Paginated from '../arg/Paginated'

import { Order } from '../enum/Order'

import { UserRepository } from '../../typeorm/repository/User'
import { TransactionRepository } from '../../typeorm/repository/Transaction'

import { User as dbUser } from '@entity/User'
import { Transaction as dbTransaction } from '@entity/Transaction'

import { apiPost } from '../../apis/HttpRequest'
import { TransactionTypeId } from '../enum/TransactionTypeId'
import { calculateBalance, isHexPublicKey } from '../../util/validate'
import { RIGHTS } from '../../auth/RIGHTS'
import { User } from '../model/User'
import { communityUser } from '../../util/communityUser'
import { virtualDecayTransaction } from '../../util/virtualDecayTransaction'
import Decimal from 'decimal.js-light'

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
    // find user
    const userRepository = getCustomRepository(UserRepository)
    // TODO: separate those usecases - this is a security issue
    const user = userId
      ? await userRepository.findOneOrFail({ id: userId }, { withDeleted: true })
      : await userRepository.findByPubkeyHex(context.pubKey)

    // find current balance
    const lastTransaction = await dbTransaction.findOne(
      { userId: user.id },
      { order: { balanceDate: 'DESC' } },
    )

    // get GDT
    let balanceGDT = null
    try {
      const resultGDTSum = await apiPost(`${CONFIG.GDT_API_URL}/GdtEntries/sumPerEmailApi`, {
        email: user.email,
      })
      if (!resultGDTSum.success) {
        throw new Error('Call not successful')
      }
      balanceGDT = Number(resultGDTSum.data.sum) || 0
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.log('Could not query GDT Server', err)
    }

    if (!lastTransaction) {
      return new TransactionList(new Decimal(0), [], 0, balanceGDT)
    }

    // find transactions
    const limit = currentPage === 1 && order === Order.DESC ? pageSize - 1 : pageSize
    const offset =
      currentPage === 1 ? 0 : (currentPage - 1) * pageSize - (order === Order.DESC ? 1 : 0)
    const transactionRepository = getCustomRepository(TransactionRepository)
    const [userTransactions, userTransactionsCount] = await transactionRepository.findByUserPaged(
      user.id,
      limit,
      offset,
      order,
      onlyCreations,
    )

    // find involved users
    let involvedUserIds: number[] = []
    userTransactions.forEach((transaction: dbTransaction) => {
      involvedUserIds.push(transaction.userId)
      if (transaction.linkedUserId) {
        involvedUserIds.push(transaction.linkedUserId)
      }
    })
    // remove duplicates
    involvedUserIds = involvedUserIds.filter((value, index, self) => self.indexOf(value) === index)
    // We need to show the name for deleted users for old transactions
    const involvedDbUsers = await dbUser
      .createQueryBuilder()
      .withDeleted()
      .where('id IN (:...userIds)', { userIds: involvedUserIds })
      .getMany()
    const involvedUsers = involvedDbUsers.map((u) => new User(u))

    const self = new User(user)
    const transactions: Transaction[] = []

    // decay transaction
    if (currentPage === 1 && order === Order.DESC) {
      const now = new Date()
      transactions.push(
        virtualDecayTransaction(lastTransaction.balance, lastTransaction.balanceDate, now, self),
      )
    }

    // transactions
    for (let i = 0; i < userTransactions.length; i++) {
      const userTransaction = userTransactions[i]
      let linkedUser = null
      if (userTransaction.typeId === TransactionTypeId.CREATION) {
        linkedUser = communityUser
      } else {
        linkedUser = involvedUsers.find((u) => u.id === userTransaction.linkedUserId)
      }
      transactions.push(new Transaction(userTransaction, self, linkedUser))
    }

    // Construct Result
    return new TransactionList(
      lastTransaction.balance,
      transactions,
      userTransactionsCount,
      balanceGDT,
    )
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
    const receivedCallDate = new Date()
    const sendBalance = await calculateBalance(senderUser.id, amount.mul(-1), receivedCallDate)
    if (!sendBalance) {
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

    const queryRunner = getConnection().createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('READ UNCOMMITTED')
    try {
      // transaction
      const transactionSend = new dbTransaction()
      transactionSend.typeId = TransactionTypeId.SEND
      transactionSend.memo = memo
      transactionSend.userId = senderUser.id
      transactionSend.linkedUserId = recipientUser.id
      transactionSend.amount = amount
      transactionSend.balance = sendBalance.balance
      transactionSend.balanceDate = receivedCallDate
      transactionSend.decay = sendBalance.decay.decay
      transactionSend.decayStart = sendBalance.decay.start
      transactionSend.previous = sendBalance.lastTransactionId
      await queryRunner.manager.insert(dbTransaction, transactionSend)

      const transactionReceive = new dbTransaction()
      transactionReceive.typeId = TransactionTypeId.RECEIVE
      transactionReceive.memo = memo
      transactionReceive.userId = recipientUser.id
      transactionReceive.linkedUserId = senderUser.id
      transactionReceive.amount = amount
      const receiveBalance = await calculateBalance(recipientUser.id, amount, receivedCallDate)
      if (!receiveBalance) {
        throw new Error('Sender user account corrupted')
      }
      transactionReceive.balance = receiveBalance.balance
      transactionReceive.balanceDate = receivedCallDate
      transactionReceive.decay = receiveBalance.decay.decay
      transactionReceive.decayStart = receiveBalance.decay.start
      transactionReceive.previous = receiveBalance.lastTransactionId
      transactionReceive.linkedTransactionId = transactionSend.id
      await queryRunner.manager.insert(dbTransaction, transactionReceive)

      // Save linked transaction id for send
      transactionSend.linkedTransactionId = transactionReceive.id
      await queryRunner.manager.update(dbTransaction, { id: transactionSend.id }, transactionSend)

      await queryRunner.commitTransaction()
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw new Error(`Transaction was not successful: ${e}`)
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

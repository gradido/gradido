/* eslint-disable new-cap */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { Resolver, Query, Args, Authorized, Ctx, Mutation } from 'type-graphql'
import { getCustomRepository, getConnection } from '@dbTools/typeorm'

import CONFIG from '@/config'
import { sendTransactionReceivedEmail } from '@/mailer/sendTransactionReceivedEmail'

import { Transaction } from '@model/Transaction'
import { TransactionList } from '@model/TransactionList'

import TransactionSendArgs from '@arg/TransactionSendArgs'
import Paginated from '@arg/Paginated'

import { Order } from '@enum/Order'

import { UserRepository } from '@repository/User'
import { TransactionRepository } from '@repository/Transaction'
import { TransactionLinkRepository } from '@repository/TransactionLink'

import { User as dbUser } from '@entity/User'
import { Transaction as dbTransaction } from '@entity/Transaction'

import { apiPost } from '@/apis/HttpRequest'
import { TransactionTypeId } from '@enum/TransactionTypeId'
import { calculateBalance, isHexPublicKey } from '@/util/validate'
import { RIGHTS } from '@/auth/RIGHTS'
import { User } from '@model/User'
import { communityUser } from '@/util/communityUser'
import { virtualDecayTransaction } from '@/util/virtualDecayTransaction'
import Decimal from 'decimal.js-light'
import { calculateDecay } from '@/util/decay'

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
    const now = new Date()
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
    // first page can contain 26 due to virtual decay transaction
    const offset = (currentPage - 1) * pageSize
    const transactionRepository = getCustomRepository(TransactionRepository)
    const [userTransactions, userTransactionsCount] = await transactionRepository.findByUserPaged(
      user.id,
      pageSize,
      offset,
      order,
      onlyCreations,
    )

    // find involved users; I am involved
    const involvedUserIds: number[] = [user.id]
    userTransactions.forEach((transaction: dbTransaction) => {
      if (transaction.linkedUserId && !involvedUserIds.includes(transaction.linkedUserId)) {
        involvedUserIds.push(transaction.linkedUserId)
      }
    })
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
    if (!onlyCreations && currentPage === 1 && order === Order.DESC) {
      transactions.push(
        virtualDecayTransaction(lastTransaction.balance, lastTransaction.balanceDate, now, self),
      )
    }

    // transactions
    userTransactions.forEach((userTransaction) => {
      const linkedUser =
        userTransaction.typeId === TransactionTypeId.CREATION
          ? communityUser
          : involvedUsers.find((u) => u.id === userTransaction.linkedUserId)
      transactions.push(new Transaction(userTransaction, self, linkedUser))
    })

    const transactionLinkRepository = getCustomRepository(TransactionLinkRepository)
    const toHoldAvailable = await transactionLinkRepository.sumAmountToHoldAvailable(user.id, now)

    // Construct Result
    return new TransactionList(
      calculateDecay(lastTransaction.balance, lastTransaction.balanceDate, now).balance.minus(
        toHoldAvailable.toString(),
      ),
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
      transactionSend.amount = amount.mul(-1)
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
      transactionReceive.balance = receiveBalance ? receiveBalance.balance : amount
      transactionReceive.balanceDate = receivedCallDate
      transactionReceive.decay = receiveBalance ? receiveBalance.decay.decay : new Decimal(0)
      transactionReceive.decayStart = receiveBalance ? receiveBalance.decay.start : null
      transactionReceive.previous = receiveBalance ? receiveBalance.lastTransactionId : null
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

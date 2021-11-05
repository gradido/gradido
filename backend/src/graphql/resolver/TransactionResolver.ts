/* eslint-disable new-cap */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Resolver, Query, Args, Authorized, Ctx, Mutation } from 'type-graphql'
import { getCustomRepository, getConnection, QueryRunner } from 'typeorm'
import { createTransport } from 'nodemailer'

import CONFIG from '../../config'

import { Transaction } from '../model/Transaction'
import { TransactionList } from '../model/TransactionList'

import TransactionSendArgs from '../arg/TransactionSendArgs'
import Paginated from '../arg/Paginated'

import { Order } from '../enum/Order'

import { BalanceRepository } from '../../typeorm/repository/Balance'
import { UserRepository } from '../../typeorm/repository/User'
import { UserTransactionRepository } from '../../typeorm/repository/UserTransaction'
import { TransactionRepository } from '../../typeorm/repository/Transaction'

import { User as dbUser } from '@entity/User'
import { UserTransaction as dbUserTransaction } from '@entity/UserTransaction'
import { Transaction as dbTransaction } from '@entity/Transaction'
import { TransactionSendCoin as dbTransactionSendCoin } from '@entity/TransactionSendCoin'
import { Balance as dbBalance } from '@entity/Balance'

import { apiPost } from '../../apis/HttpRequest'
import { roundFloorFrom4, roundCeilFrom4 } from '../../util/round'
import { calculateDecay, calculateDecayWithInterval } from '../../util/decay'
import { TransactionTypeId } from '../enum/TransactionTypeId'
import { TransactionType } from '../enum/TransactionType'
import { hasUserAmount, isHexPublicKey } from '../../util/validate'
import { from_hex as fromHex } from 'libsodium-wrappers'

/*
# Test

## Prepare
> sudo systemctl start docker
> docker-compose up mariadb
> DROP all databases
> docker-compose down
> docker compose up mariadb database
> verify there is exactly one database `gradido_community`

TODO:
INSERT INTO `login_groups` (`id`, `alias`, `name`, `url`, `host`, `home`, `description`) VALUES
  (1, 'docker', 'docker gradido group', 'localhost', 'nginx', '/', 'gradido test group for docker and stage2 with blockchain db');

>> Database is cool

### Start login server
> docker-compose up login-server community-server nginx
>> Login & community servers and nginx proxy are up and running

## Build database
> cd database
> yarn
> yarn build
> cd ..
>> Database has been built successful

### Start backend (no docker for debugging)
> cd backend
> yarn
> yarn dev
>> Backend is up and running

### Create users
> chromium http://localhost:4000/graphql
> mutation{createUser(email: "receiver@user.net", firstName: "Receiver", lastName: "user", password: "123!AAAb", language: "de")}
> mutation{createUser(email: "sender@user.net", firstName: "Sender", lastName: "user", password: "123!AAAb", language: "de")}
> mutation{createUser(email: "creator@user.net", firstName: "Creator", lastName: "user", password: "123!AAAb", language: "de")}
>> Verify you have 3 entries in `login_users`, `login_user_backups` and `state_users` 

### make creator an admin
> INSERT INTO login_user_roles (id, user_id, role_id) VALUES (NULL, '4', '1');
> UPDATE login_users SET email_checked = 1 WHERE id = 4;
> uncomment line: 19 in community_server/src/Controller/ServerUsersController.php
> chromium http://localhost/server-users/add
> create user `creator` `123` `creator@different.net`
>> verify you have 1 entry in `server_users`
> login with user on http://localhost/server-users
> activate server user by changing the corresponding flag in the interface
> navigate to http://localhost/transaction-creations/create-multi
> create 1000GDD for user sender@user.net
> navigate to http://localhost
> login with `creator@user.net` `123!AAAb` 
> confirm transaction (top right corner - click the thingy, click the green button `Transaktion abschließen`)

### the test:
> chromium http://localhost:4000/graphql
> query{login(email: "sender@user.net", password: "123!AAAb"){pubkey}}
>> copy token from network tab (inspect)
> mutation{sendCoins(email: "receiver@user.net", amount: 10.0, memo: "Hier!")}
> mutation{sendCoins(email: "receiver@user.net", amount: 10.0, memo: "Hier!")}
> Headers: {"Authorization": "Bearer ${token}"}
>> Verify via Database that stuff is as it should see `state_balance` & `transaction_send_coins`

### create decay block
> chromium http://localhost/transactions/add
> login with `creator` `123`
> select `decay start`
> press submit
> wait for at least 0.02 display of decay on user sender@user.net on old frontend, this should be aprox 10min
> chromium http://localhost:4000/graphql
> query{login(email: "sender@user.net", password: "123!AAAb"){pubkey}}
>> copy token from network tab (inspect)
> mutation{sendCoins(email: "receiver@user.net", amount: 10.0, memo: "Hier!")}
>> verify in `transaction_send_coins` that a decay was taken into account
>> same in `state_balances`
>> now check the old frontend
>>> sender@user.net should have a decay of 0.02
>>> while receiver@user.net should have zero decay on anything (old frontend)

### Export data
> docker-compose up phpmyadmin
> chromium http://localhost:8074/
> select gradido_community
> export
> select custom
> untick structure
> ok
*/

const sendEMail = async (emailDef: any): Promise<boolean> => {
  if (!CONFIG.EMAIL) {
    // eslint-disable-next-line no-console
    console.log('Emails are disabled via config')
    return false
  }
  const transporter = createTransport({
    host: CONFIG.EMAIL_SMTP_URL,
    port: Number(CONFIG.EMAIL_SMTP_PORT),
    secure: false, // true for 465, false for other ports
    requireTLS: true,
    auth: {
      user: CONFIG.EMAIL_USERNAME,
      pass: CONFIG.EMAIL_PASSWORD,
    },
  })
  const info = await transporter.sendMail(emailDef)
  if (!info.messageId) {
    throw new Error('error sending notification email, but transaction succeed')
  }
  return true
}

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

  const transactionRepository = getCustomRepository(TransactionRepository)
  const transactions = await transactionRepository.joinFullTransactionsByIds(transactionIds)

  const transactionIndiced: dbTransaction[] = []
  transactions.forEach((transaction: dbTransaction) => {
    transactionIndiced[transaction.id] = transaction
    if (transaction.transactionTypeId === TransactionTypeId.SEND) {
      involvedUserIds.push(transaction.transactionSendCoin.userId)
      involvedUserIds.push(transaction.transactionSendCoin.recipiantUserId)
    }
  })
  // remove duplicates
  // https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
  const involvedUsersUnique = involvedUserIds.filter((v, i, a) => a.indexOf(v) === i)
  const userRepository = getCustomRepository(UserRepository)
  const userIndiced = await userRepository.getUsersIndiced(involvedUsersUnique)

  const decayStartTransaction = await transactionRepository.findDecayStartBlock()

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
      const decay = await calculateDecayWithInterval(
        previousTransaction.balance,
        previousTransaction.balanceDate,
        currentTransaction.balanceDate,
      )
      const balance = previousTransaction.balance - decay.balance

      if (
        decayStartTransaction &&
        decayStartTransaction.received < currentTransaction.balanceDate
      ) {
        finalTransaction.decay = decay
        finalTransaction.decay.balance = roundFloorFrom4(balance)
        if (
          decayStartTransaction &&
          previousTransaction.transactionId < decayStartTransaction.id &&
          currentTransaction.transactionId > decayStartTransaction.id
        ) {
          finalTransaction.decay.decayStartBlock = (
            decayStartTransaction.received.getTime() / 1000
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
      const creation = transaction.transactionCreation

      finalTransaction.name = 'Gradido Akademie'
      finalTransaction.type = TransactionType.CREATION
      // finalTransaction.targetDate = creation.targetDate
      finalTransaction.balance = roundFloorFrom4(creation.amount)
    } else if (userTransaction.transactionTypeId === TransactionTypeId.SEND) {
      // send coin
      const sendCoin = transaction.transactionSendCoin
      let otherUser: dbUser | undefined
      finalTransaction.balance = roundFloorFrom4(sendCoin.amount)
      if (sendCoin.userId === user.id) {
        finalTransaction.type = TransactionType.SEND
        otherUser = userIndiced[sendCoin.recipiantUserId]
        // finalTransaction.pubkey = sendCoin.recipiantPublic
      } else if (sendCoin.recipiantUserId === user.id) {
        finalTransaction.type = TransactionType.RECIEVE
        otherUser = userIndiced[sendCoin.userId]
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
      const decay = await calculateDecayWithInterval(
        userTransaction.balance,
        userTransaction.balanceDate,
        now.getTime(),
      )
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

// Helper function
async function listTransactions(
  currentPage: number,
  pageSize: number,
  order: Order,
  user: dbUser,
): Promise<TransactionList> {
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
  let [userTransactions, userTransactionsCount] = await userTransactionRepository.findByUserPaged(
    user.id,
    limit,
    offset,
    order,
  )
  skipFirstTransaction = userTransactionsCount > offset + limit
  const decay = !(currentPage > 1)
  let transactions: Transaction[] = []
  if (userTransactions.length) {
    if (order === Order.DESC) {
      userTransactions = userTransactions.reverse()
    }
    transactions = await calculateAndAddDecayTransactions(
      userTransactions,
      user,
      decay,
      skipFirstTransaction,
    )
    if (order === Order.DESC) {
      transactions = transactions.reverse()
    }
  }

  const transactionList = new TransactionList()
  transactionList.count = userTransactionsCount
  transactionList.transactions = transactions
  return transactionList
}

// helper helper function
async function updateStateBalance(
  user: dbUser,
  centAmount: number,
  received: Date,
  queryRunner: QueryRunner,
): Promise<dbBalance> {
  const balanceRepository = getCustomRepository(BalanceRepository)
  let balance = await balanceRepository.findByUser(user.id)
  if (!balance) {
    balance = new dbBalance()
    balance.userId = user.id
    balance.amount = centAmount
    balance.modified = received
  } else {
    const decaiedBalance = await calculateDecay(balance.amount, balance.recordDate, received).catch(
      () => {
        throw new Error('error by calculating decay')
      },
    )
    balance.amount = Number(decaiedBalance) + centAmount
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
      await calculateDecay(
        Number(lastUserTransaction.balance),
        lastUserTransaction.balanceDate,
        transaction.received,
      ).catch(() => {
        throw new Error('error by calculating decay')
      }),
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

async function getPublicKey(email: string, sessionId: number): Promise<string | undefined> {
  const result = await apiPost(CONFIG.LOGIN_API_URL + 'getUserInfos', {
    session_id: sessionId,
    email,
    ask: ['user.pubkeyhex'],
  })
  if (result.success) {
    return result.data.userData.pubkeyhex
  }
}

@Resolver()
export class TransactionResolver {
  @Authorized()
  @Query(() => TransactionList)
  async transactionList(
    @Args() { currentPage = 1, pageSize = 25, order = Order.DESC }: Paginated,
    @Ctx() context: any,
  ): Promise<TransactionList> {
    // load user
    const userRepository = getCustomRepository(UserRepository)
    const userEntity = await userRepository.findByPubkeyHex(context.pubKey)

    const transactions = await listTransactions(currentPage, pageSize, order, userEntity)

    // get gdt sum
    const resultGDTSum = await apiPost(`${CONFIG.GDT_API_URL}/GdtEntries/sumPerEmailApi`, {
      email: userEntity.email,
    })
    if (!resultGDTSum.success) throw new Error(resultGDTSum.data)
    transactions.gdtSum = resultGDTSum.data.sum || 0

    // get balance
    const balanceRepository = getCustomRepository(BalanceRepository)
    const balanceEntity = await balanceRepository.findByUser(userEntity.id)
    if (balanceEntity) {
      const now = new Date()
      transactions.balance = roundFloorFrom4(balanceEntity.amount)
      transactions.decay = roundFloorFrom4(
        await calculateDecay(balanceEntity.amount, balanceEntity.recordDate, now),
      )
      transactions.decayDate = now.toString()
    }

    return transactions
  }

  @Authorized()
  @Mutation(() => String)
  async sendCoins(
    @Args() { email, amount, memo }: TransactionSendArgs,
    @Ctx() context: any,
  ): Promise<string> {
    // TODO this is subject to replay attacks
    // validate sender user (logged in)
    const userRepository = getCustomRepository(UserRepository)
    const senderUser = await userRepository.findByPubkeyHex(context.pubKey)
    if (senderUser.pubkey.length !== 32) {
      throw new Error('invalid sender public key')
    }
    if (!hasUserAmount(senderUser, amount)) {
      throw new Error("user hasn't enough GDD")
    }

    // validate recipient user
    // TODO: the detour over the public key is unnecessary
    const recipiantPublicKey = await getPublicKey(email, context.sessionId)
    if (!recipiantPublicKey) {
      throw new Error('recipiant not known')
    }
    if (!isHexPublicKey(recipiantPublicKey)) {
      throw new Error('invalid recipiant public key')
    }
    const recipiantUser = await userRepository.findByPubkeyHex(recipiantPublicKey)
    if (!recipiantUser) {
      throw new Error('Cannot find recipiant user by local send coins transaction')
    } else if (recipiantUser.disabled) {
      throw new Error('recipiant user account is disabled')
    }

    // validate amount
    if (amount <= 0) {
      throw new Error('invalid amount')
    }

    const centAmount = Math.trunc(amount * 10000)

    const queryRunner = getConnection().createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('READ UNCOMMITTED')
    try {
      // transaction
      let transaction = new dbTransaction()
      transaction.transactionTypeId = TransactionTypeId.SEND
      transaction.memo = memo

      // TODO: NO! this is problematic in its construction
      const insertResult = await queryRunner.manager.insert(dbTransaction, transaction)
      transaction = await queryRunner.manager
        .findOneOrFail(dbTransaction, insertResult.generatedMaps[0].id)
        .catch((error) => {
          throw new Error('error loading saved transaction: ' + error)
        })

      // Insert Transaction: sender - amount
      const senderUserTransactionBalance = await addUserTransaction(
        senderUser,
        transaction,
        -centAmount,
        queryRunner,
      )
      // Insert Transaction: recipient + amount
      const recipiantUserTransactionBalance = await addUserTransaction(
        recipiantUser,
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
        recipiantUser,
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

      // transactionSendCoin
      const transactionSendCoin = new dbTransactionSendCoin()
      transactionSendCoin.transactionId = transaction.id
      transactionSendCoin.userId = senderUser.id
      transactionSendCoin.senderPublic = senderUser.pubkey
      transactionSendCoin.recipiantUserId = recipiantUser.id
      transactionSendCoin.recipiantPublic = Buffer.from(fromHex(recipiantPublicKey))
      transactionSendCoin.amount = centAmount
      transactionSendCoin.senderFinalBalance = senderStateBalance.amount
      await queryRunner.manager.save(transactionSendCoin).catch((error) => {
        throw new Error('error saving transaction send coin: ' + error)
      })

      await queryRunner.manager.save(transaction).catch((error) => {
        throw new Error('error saving transaction with tx hash: ' + error)
      })

      await queryRunner.commitTransaction()
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
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
    }
    // send notification email
    // TODO: translate
    await sendEMail({
      from: 'Gradido (nicht antworten) <' + CONFIG.EMAIL_SENDER + '>',
      to: recipiantUser.firstName + ' ' + recipiantUser.lastName + ' <' + recipiantUser.email + '>',
      subject: 'Gradido Überweisung',
      text: `Hallo ${recipiantUser.firstName} ${recipiantUser.lastName}
      
      Du hast soeben ${amount} GDD von ${senderUser.firstName} ${senderUser.lastName} erhalten.
      ${senderUser.firstName} ${senderUser.lastName} schreibt:
      
      ${memo}
      
      Bitte antworte nicht auf diese E-Mail!
      
      Mit freundlichen Grüßen Gradido Community Server`,
    })

    return 'success'
  }
}

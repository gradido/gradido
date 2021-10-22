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
import { UserTransaction as DbUserTransaction } from '@entity/UserTransaction'
import { Transaction as DbTransaction } from '@entity/Transaction'
import { TransactionSignature as DbTransactionSignature } from '@entity/TransactionSignature'
import { TransactionSendCoin as DbTransactionSendCoin } from '@entity/TransactionSendCoin'
import { Balance as DbBalance } from '@entity/Balance'

import { apiPost } from '../../apis/HttpRequest'
import { roundFloorFrom4, roundCeilFrom4 } from '../../util/round'
import { calculateDecay, calculateDecayWithInterval } from '../../util/decay'
import { TransactionTypeId } from '../enum/TransactionTypeId'
import { TransactionType } from '../enum/TransactionType'
import { hasUserAmount, isHexPublicKey } from '../../util/validate'
import {
  from_hex as fromHex,
  to_base64 as toBase64,
  from_base64 as fromBase64,
  base64_variants as base64Variants,
  crypto_sign_verify_detached as cryptoSignVerifyDetached,
  crypto_generichash_init as cryptoGenerichashInit,
  crypto_generichash_update as cryptoGenerichashUpdate,
  crypto_generichash_final as cryptoGenerichashFinal,
  crypto_generichash_BYTES as cryptoGenericHashBytes,
} from 'libsodium-wrappers'

import { proto } from '../../proto/bundle'

// Helper function
async function calculateAndAddDecayTransactions(
  userTransactions: DbUserTransaction[],
  user: dbUser,
  decay: boolean,
  skipFirstTransaction: boolean,
): Promise<Transaction[]> {
  const finalTransactions: Transaction[] = []
  const transactionIds: number[] = []
  const involvedUserIds: number[] = []

  userTransactions.forEach((userTransaction: DbUserTransaction) => {
    transactionIds.push(userTransaction.transactionId)
  })

  const transactionRepository = getCustomRepository(TransactionRepository)
  const transactions = await transactionRepository.joinFullTransactionsByIds(transactionIds)

  const transactionIndiced: DbTransaction[] = []
  transactions.forEach((transaction: DbTransaction) => {
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
): Promise<DbBalance> {
  const balanceRepository = getCustomRepository(BalanceRepository)
  let balance = await balanceRepository.findByUser(user.id)
  if (!balance) {
    balance = new DbBalance()
    balance.userId = user.id
    balance.amount = centAmount
  } else {
    const decaiedBalance = calculateDecay(balance.amount, balance.recordDate, received).catch(
      () => {
        throw new Error('error by calculating decay')
      },
    )
    balance.amount = Number(await decaiedBalance) + centAmount
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
  transaction: DbTransaction,
  centAmount: number,
  queryRunner: QueryRunner,
): Promise<DbUserTransaction> {
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

  const newUserTransaction = new DbUserTransaction()
  newUserTransaction.userId = user.id
  newUserTransaction.transactionId = transaction.id
  newUserTransaction.transactionTypeId = transaction.transactionTypeId
  newUserTransaction.balance = newBalance
  newUserTransaction.balanceDate = transaction.received

  return queryRunner.manager.save(newUserTransaction).catch((error) => {
    throw new Error('Error saving user transaction: ' + error)
  })
}

// helper function
/**
 *
 * @param senderPublicKey as hex string
 * @param recipiantPublicKey as hex string
 * @param amount as float
 * @param memo
 * @param groupId
 */
async function sendCoins(
  senderUser: dbUser,
  recipiantPublicKey: string,
  amount: number,
  memo: string,
  sessionId: number,
  groupId = 0,
): Promise<boolean> {
  if (senderUser.pubkey.length !== 32) {
    throw new Error('invalid sender public key')
  }
  if (!isHexPublicKey(recipiantPublicKey)) {
    throw new Error('invalid recipiant public key')
  }
  if (amount <= 0) {
    throw new Error('invalid amount')
  }
  if (!hasUserAmount(senderUser, amount)) {
    throw new Error("user hasn't enough GDD")
  }

  const userRepository = getCustomRepository(UserRepository)
  const recipiantUser = await userRepository.findByPubkeyHex(recipiantPublicKey)
  if (recipiantUser && recipiantUser.disabled) {
    throw new Error('recipiant user account is disabled')
  }

  const centAmount = Math.trunc(amount * 10000)
  const transferAmount = new proto.gradido.TransferAmount({
    pubkey: senderUser.pubkey,
    amount: centAmount,
  })

  // no group id is given so we assume it is a local transfer
  if (!groupId) {
    const localTransfer = new proto.gradido.LocalTransfer({
      sender: transferAmount,
      recipiant: fromHex(recipiantPublicKey),
    })
    const transferTransaction = new proto.gradido.GradidoTransfer({ local: localTransfer })
    const transactionBody = new proto.gradido.TransactionBody({
      memo: memo,
      created: { seconds: new Date().getTime() / 1000 },
      transfer: transferTransaction,
    })

    const bodyBytes = proto.gradido.TransactionBody.encode(transactionBody).finish()
    const bodyBytesBase64 = toBase64(bodyBytes, base64Variants.ORIGINAL)
    // let Login-Server sign transaction

    const result = await apiPost(CONFIG.LOGIN_API_URL + 'signTransaction', {
      session_id: sessionId,
      bodyBytes: bodyBytesBase64,
    })
    if (!result.success) throw new Error(result.data)
    // verify
    const sign = fromBase64(result.data.sign, base64Variants.ORIGINAL)
    if (!cryptoSignVerifyDetached(sign, bodyBytesBase64, senderUser.pubkey)) {
      throw new Error('Could not verify signature')
    }

    const sigPair = new proto.gradido.SignaturePair({
      pubKey: senderUser.pubkey,
      ed25519: sign,
    })
    const sigMap = new proto.gradido.SignatureMap({ sigPair: [sigPair] })

    // process db updates as transaction to able to rollback if an error occure

    const queryRunner = getConnection().createQueryRunner()
    // belong to debugging mysql query / typeorm line
    // const startTime = new Date()
    await queryRunner.connect()
    await queryRunner.startTransaction('READ UNCOMMITTED')
    try {
      // transaction
      let transaction = new DbTransaction()
      transaction.transactionTypeId = TransactionTypeId.SEND
      transaction.memo = memo
      const transactionRepository = getCustomRepository(TransactionRepository)
      const insertResult = await queryRunner.manager.insert(DbTransaction, transaction)
      transaction = await queryRunner.manager
        .findOneOrFail(DbTransaction, insertResult.generatedMaps[0].id)
        .catch((error) => {
          throw new Error('error loading saved transaction: ' + error)
        })

      if (!recipiantUser) {
        throw new Error('Cannot find recipiant user by local send coins transaction')
      }

      // update state balance
      const senderStateBalance = await updateStateBalance(
        senderUser,
        -centAmount,
        transaction.received,
        queryRunner,
      )
      const recipiantStateBalance = await updateStateBalance(
        recipiantUser,
        centAmount,
        transaction.received,
        queryRunner,
      )

      // update user transactions
      const senderUserTransactionBalance = await addUserTransaction(
        senderUser,
        transaction,
        -centAmount,
        queryRunner,
      )
      const recipiantUserTransactionBalance = await addUserTransaction(
        recipiantUser,
        transaction,
        centAmount,
        queryRunner,
      )

      if (senderStateBalance.amount !== senderUserTransactionBalance.balance) {
        throw new Error('db data corrupted, sender')
      }
      if (recipiantStateBalance.amount !== recipiantUserTransactionBalance.balance) {
        throw new Error('db data corrupted, recipiant')
      }

      // transactionSendCoin
      const transactionSendCoin = new DbTransactionSendCoin()
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

      // tx hash
      const state = cryptoGenerichashInit(null, cryptoGenericHashBytes)
      if (transaction.id > 1) {
        const previousTransaction = await transactionRepository.findOne({ id: transaction.id - 1 })
        if (!previousTransaction) {
          throw new Error('Error previous transaction not found, please try again')
        }
        if (!previousTransaction.txHash) {
          throw new Error('Previous tx hash is null')
        }
        cryptoGenerichashUpdate(state, previousTransaction.txHash)
      }
      cryptoGenerichashUpdate(state, transaction.id.toString())
      // should match previous used format: yyyy-MM-dd HH:mm:ss
      const receivedString = transaction.received.toISOString().slice(0, 19).replace('T', ' ')
      cryptoGenerichashUpdate(state, receivedString)
      cryptoGenerichashUpdate(state, proto.gradido.SignatureMap.encode(sigMap).finish())
      transaction.txHash = Buffer.from(cryptoGenerichashFinal(state, cryptoGenericHashBytes))
      await queryRunner.manager.save(transaction).catch((error) => {
        throw new Error('error saving transaction with tx hash: ' + error)
      })

      // save signature
      const signature = new DbTransactionSignature()
      signature.transactionId = transaction.id
      signature.signature = Buffer.from(sign)
      signature.pubkey = senderUser.pubkey
      await queryRunner.manager.save(signature).catch((error) => {
        throw new Error('error saving signature: ' + error)
      })
      await queryRunner.commitTransaction()

      // great way de debug mysql querys / typeorm
      // const result = await queryRunner.query("SELECT * FROM mysql.general_log WHERE thread_id IN (SELECT ID FROM information_schema.processlist WHERE DB = 'gradido_community') AND event_time > ?; ", [startTime])
      // console.log("start time: %o, transaction log: %o", startTime.getTime(), result)
    } catch (e) {
      await queryRunner.rollbackTransaction()
      const count = await queryRunner.manager.count(DbTransaction)
      // fix autoincrement value which seems not effected from rollback
      await queryRunner
        .query('ALTER TABLE `transactions` auto_increment = ?', [count])
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.log('problems with reset auto increment: %o', error)
        })

      throw e
    } finally {
      // you need to release query runner which is manually created:
      await queryRunner.release()
    }
    // send notification email
    if (CONFIG.EMAIL) {
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

      // send mail with defined transport object
      // TODO: translate
      const info = await transporter.sendMail({
        from: 'Gradido (nicht antworten) <' + CONFIG.EMAIL_SENDER + '>', // sender address
        to:
          recipiantUser.firstName + ' ' + recipiantUser.lastName + ' <' + recipiantUser.email + '>', // list of receivers
        subject: 'Gradido Überweisung', // Subject line
        text:
          'Hallo ' +
          recipiantUser.firstName +
          ' ' +
          recipiantUser.lastName +
          ',\n\n' +
          'Du hast soeben ' +
          amount +
          ' GDD von ' +
          senderUser.firstName +
          ' ' +
          senderUser.lastName +
          ' erhalten.\n' +
          senderUser.firstName +
          ' ' +
          senderUser.lastName +
          ' schreibt: \n\n' +
          memo +
          '\n\n' +
          'Bitte antworte nicht auf diese E-Mail!\n\n' +
          'Mit freundlichen Grüßenņ Gradido Community Server', // plain text body
      })
      if (!info.messageId) {
        throw new Error('error sending notification email, but transaction succeed')
      }
    }
  }
  return true
}

// helper function
// target can be email, username or public_key
// groupId if not null and another community, try to get public key from there
async function getPublicKey(
  target: string,
  sessionId: number,
  groupId = 0,
): Promise<string | undefined> {
  // if it is already a public key, return it
  if (isHexPublicKey(target)) {
    return target
  }

  // assume it is a email address if it's contain a @
  if (/@/i.test(target)) {
    const result = await apiPost(CONFIG.LOGIN_API_URL + 'getUserInfos', {
      session_id: sessionId,
      email: target,
      ask: ['user.pubkeyhex'],
    })
    if (result.success) {
      return result.data.userData.pubkeyhex
    }
  }

  // if username is used add code here

  // if we have multiple communities add code here

  return undefined
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
    const recipiantPublicKey = await getPublicKey(email, context.sessionId)
    if (!recipiantPublicKey) {
      throw new Error('recipiant not known')
    }

    // load logged in user
    const userRepository = getCustomRepository(UserRepository)
    const userEntity = await userRepository.findByPubkeyHex(context.pubKey)

    await sendCoins(userEntity, recipiantPublicKey, amount, memo, context.sessionId)
    return 'success'
  }
}

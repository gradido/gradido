/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Resolver, Query, Args, Authorized, Ctx, Mutation } from 'type-graphql'
import { getCustomRepository, getConnection, getRepository } from 'typeorm'
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

import { User as dbUser } from '../../typeorm/entity/User'
import { UserTransaction as DbUserTransaction } from '../../typeorm/entity/UserTransaction'
import { Transaction as DbTransaction } from '../../typeorm/entity/Transaction'
import { TransactionSignature as DbTransactionSignature } from '../../typeorm/entity/TransactionSignature'
import { TransactionSendCoin as DbTransactionSendCoin } from '../../typeorm/entity/TransactionSendCoin'
import { Balance as DbBalance } from '../../typeorm/entity/Balance'

import { apiGet, apiPost } from '../../apis/HttpRequest'
import { roundFloorFrom4 } from '../../util/round'
import { calculateDecay, calculateDecayWithInterval } from '../../util/decay'
import { TransactionTypeId } from '../enum/TransactionTypeId'
import { TransactionType } from '../enum/TransactionType'
import { hasUserAmount, isHexPublicKey } from '../../util/validate'
import protobuf from '@apollo/protobufjs'
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
    const prev = i > 0 ? userTransactions[i - 1] : null

    if (prev && prev.balance > 0) {
      const current = userTransaction
      const decay = await calculateDecayWithInterval(
        prev.balance,
        prev.balanceDate,
        current.balanceDate,
      )
      const balance = prev.balance - decay.balance

      if (balance) {
        finalTransaction.decay = decay
        finalTransaction.decay.balance = roundFloorFrom4(balance)
        if (
          decayStartTransaction &&
          prev.transactionId < decayStartTransaction.id &&
          current.transactionId > decayStartTransaction.id
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
      if (balance) {
        const decayTransaction = new Transaction()
        decayTransaction.type = 'decay'
        decayTransaction.balance = roundFloorFrom4(balance)
        decayTransaction.decayDuration = decay.decayDuration
        decayTransaction.decayStart = decay.decayStart
        decayTransaction.decayEnd = decay.decayEnd
        finalTransactions.push(decayTransaction)
      }
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
): Promise<number> {
  const balanceRepository = getCustomRepository(BalanceRepository)
  let balance = await balanceRepository.findByUser(user.id)
  if (!balance) {
    balance = new DbBalance()
    balance.userId = user.id
    balance.amount = centAmount
  } else {
    balance.amount =
      (await calculateDecay(balance.amount, balance.recordDate, received)) + centAmount
  }
  if (balance.amount <= 0) {
    throw new Error('error new balance <= 0')
  }
  balance.recordDate = received
  balanceRepository.save(balance).catch(() => {
    throw new Error('error saving balance')
  })
  return balance.amount
}

// helper helper function
async function addUserTransaction(user: dbUser, transaction: DbTransaction, centAmount: number) {
  let newBalance = centAmount

  const userTransactionRepository = getCustomRepository(UserTransactionRepository)
  const lastUserTransaction = await userTransactionRepository.findLastForUser(user.id)
  if (lastUserTransaction) {
    newBalance += await calculateDecay(
      lastUserTransaction.balance,
      lastUserTransaction.balanceDate,
      transaction.received,
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

  userTransactionRepository.save(newUserTransaction).catch(() => {
    throw new Error('Error saving user transaction')
  })
  return newBalance
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
  const protoRoot = await protobuf.load('../../proto/gradido/GradidoTransfer.proto')

  const GradidoTransfer = protoRoot.lookupType('proto.gradido.GradidoTransfer')
  const TransferAmount = protoRoot.lookupType('proto.gradido.TransferAmount')
  const centAmount = Math.trunc(amount * 10000)
  const transferAmount = TransferAmount.create({
    pubkey: senderUser.pubkey,
    amount: centAmount,
  })

  // no group id is given so we assume it is a local transfer
  if (!groupId) {
    const LocalTransfer = protoRoot.lookupType('proto.gradido.LocalTransfer')
    const localTransfer = LocalTransfer.create({
      sender: transferAmount,
      recipiant: fromHex(recipiantPublicKey),
    })
    const createTransaction = GradidoTransfer.create({ local: localTransfer })
    const TransactionBody = protoRoot.lookupType('proto.gradido.TransactionBody')

    const transactionBody = TransactionBody.create({
      memo: memo,
      created: new Date(),
      data: createTransaction,
    })

    const bodyBytes = TransactionBody.encode(transactionBody).finish()
    const bodyBytesBase64 = toBase64(bodyBytes, base64Variants.ORIGINAL)
    // let Login-Server sign transaction

    const result = await apiPost(CONFIG.LOGIN_API_URL + 'signTransaction', {
      bodyBytes: bodyBytesBase64,
    })
    if (!result.success) throw new Error(result.data)
    // verify
    const sign = fromBase64(result.data.sign, base64Variants.ORIGINAL)
    if (!cryptoSignVerifyDetached(sign, bodyBytesBase64, senderUser.pubkey)) {
      throw new Error('Could not verify signature')
    }
    const SignatureMap = protoRoot.lookupType('proto.gradido.SignatureMap')
    const SignaturePair = protoRoot.lookupType('proto.gradido.SignaturePair')
    const sigPair = SignaturePair.create({
      pubKey: senderUser.pubkey,
      signature: { ed25519: sign },
    })
    const sigMap = SignatureMap.create({ sigPair: [sigPair] })
    const userRepository = getCustomRepository(UserRepository)
    const recipiantUser = await userRepository.findByPubkeyHex(recipiantPublicKey)

    // created transaction, now save it to db
    await getConnection().transaction(async (transactionalEntityManager) => {
      // transaction
      const transaction = new DbTransaction()
      transaction.transactionTypeId = TransactionTypeId.SEND
      transaction.memo = memo
      const transactionRepository = getCustomRepository(TransactionRepository)
      transactionRepository.save(transaction).catch(() => {
        throw new Error('error saving transaction')
      })
      console.log('transaction after saving: %o', transaction)  
      
      if (!recipiantUser) {
        throw new Error('Cannot find recipiant user by local send coins transaction')
      }

      // update state balance
      const senderStateBalance = updateStateBalance(senderUser, -centAmount, transaction.received)
      const recipiantStateBalance = updateStateBalance(
        recipiantUser,
        centAmount,
        transaction.received,
      )

      // update user transactions
      const senderUserTransactionBalance = addUserTransaction(senderUser, transaction, -centAmount)
      const recipiantUserTransactionBalance = addUserTransaction(
        recipiantUser,
        transaction,
        centAmount,
      )

      if ((await senderStateBalance) !== (await senderUserTransactionBalance)) {
        throw new Error('db data corrupted')
      }
      if ((await recipiantStateBalance) !== (await recipiantUserTransactionBalance)) {
        throw new Error('db data corrupted')
      }

      // transactionSendCoin
      const transactionSendCoin = new DbTransactionSendCoin()
      transactionSendCoin.transactionId = transaction.id
      transactionSendCoin.userId = senderUser.id
      transactionSendCoin.senderPublic = senderUser.pubkey
      transactionSendCoin.recipiantUserId = recipiantUser.id
      transactionSendCoin.recipiantPublic = Buffer.from(fromHex(recipiantPublicKey))
      transactionSendCoin.amount = centAmount
      const transactionSendCoinRepository = getRepository(DbTransactionSendCoin)
      transactionSendCoinRepository.save(transactionSendCoin).catch(() => {
        throw new Error('error saving transaction send coin')
      })

      // tx hash
      const state = cryptoGenerichashInit(null, cryptoGenericHashBytes)
      if (transaction.id > 1) {
        const previousTransaction = await transactionRepository.findOne({ id: transaction.id - 1 })
        if (!previousTransaction) {
          throw new Error('Error previous transaction not found')
        }
        cryptoGenerichashUpdate(state, previousTransaction.txHash)
      }
      cryptoGenerichashUpdate(state, transaction.id.toString())
      // should match previous used format: yyyy-MM-dd HH:mm:ss
      const receivedString = transaction.received.toISOString().slice(0, 19).replace('T', ' ')
      cryptoGenerichashUpdate(state, receivedString)
      cryptoGenerichashUpdate(state, SignatureMap.encode(sigMap).finish())
      transaction.txHash = Buffer.from(cryptoGenerichashFinal(state, cryptoGenericHashBytes))
      transactionRepository.save(transaction).catch(() => {
        throw new Error('error saving transaction with tx hash')
      })

      // save signature
      const signature = new DbTransactionSignature()
      signature.transactionId = transaction.id
      signature.signature = Buffer.from(sign)
      signature.pubkey = senderUser.pubkey
      signature.save().catch(() => {
        throw new Error('error saving signature')
      })
    })
    // send notification email
    if(CONFIG.EMAIL) {
      let transporter = createTransport({
        host: CONFIG.EMAIL_SMTP_URL,
        port: Number(CONFIG.EMAIL_SMTP_PORT),
        secure: false, // true for 465, false for other ports
        requireTLS: true,
        auth: {
          user: CONFIG.EMAIL_USERNAME,
          pass: CONFIG.EMAIL_PASSWORD, 
        },
      });
    
      // send mail with defined transport object
      // TODO: translate
      let info = await transporter.sendMail({
        from: 'Gradido (nicht antworten) <' + CONFIG.EMAIL_SENDER + '>', // sender address
        to: recipiantUser.firstName + ' ' + recipiantUser.lastName + ' <' + recipiantUser.email + '>', // list of receivers
        subject: 'Gradido Überweisung', // Subject line 
        text: 'Hallo ' + recipiantUser.firstName + ' ' + recipiantUser.lastName + ',\n\n'
            + 'Du hast soeben ' + amount + ' GDD von ' + senderUser.firstName + ' ' + senderUser.lastName + ' erhalten.\n'
            + senderUser.firstName + ' ' + senderUser.lastName + ' schreibt: \n\n'
            + memo + '\n\n'
            + 'Bitte antworte nicht auf diese E-Mail!\n\n'
            + 'Mit freundlichen Grüßen\ņ Gradido Community Server', // plain text body
      });
      if(!info.messageId) {
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
    // get public key for current logged in user
    const result = await apiGet(CONFIG.LOGIN_API_URL + 'login?session_id=' + context.sessionId)
    if (!result.success) throw new Error(result.data)

    // load user
    const userRepository = getCustomRepository(UserRepository)
    const userEntity = await userRepository.findByPubkeyHex(result.data.user.public_hex)

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
    const payload = {
      session_id: context.sessionId,
      target_email: email,
      amount: amount * 10000,
      memo,
      auto_sign: true,
      transaction_type: 'transfer',
      blockchain_type: 'mysql',
    }
    /* const result = await apiPost(CONFIG.LOGIN_API_URL + 'createTransaction', payload)
    if (!result.success) {
      throw new Error(result.data)
    } */
    const recipiantPublicKey = await getPublicKey(email, context.sessionId)
    if (!recipiantPublicKey) {
      throw new Error('recipiant not known')
    }

    // load logged in user
    const userRepository = getCustomRepository(UserRepository)
    const userEntity = await userRepository.findByPubkeyHex(context.pubKey)

    const transaction = sendCoins(userEntity, recipiantPublicKey, amount, memo)
    if (!transaction) {
      throw new Error('error sending coins')
    }
    return 'success'
  }
}

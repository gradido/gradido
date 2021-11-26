/* eslint-disable new-cap */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Resolver, Query, Args, Authorized, Ctx, Mutation } from 'type-graphql'
import { getCustomRepository, getConnection, QueryRunner } from 'typeorm'

import CONFIG from '../../config'
import { sendEMail } from '../../util/sendEMail'

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
import { TransactionSignature as DbTransactionSignature } from '@entity/TransactionSignature'

import { apiPost } from '../../apis/HttpRequest'
import { roundFloorFrom4, roundCeilFrom4 } from '../../util/round'
import { calculateDecay, calculateDecayWithInterval } from '../../util/decay'
import { TransactionTypeId } from '../enum/TransactionTypeId'
import { TransactionType } from '../enum/TransactionType'
import { hasUserAmount, isHexPublicKey } from '../../util/validate'
import { LoginUserRepository } from '../../typeorm/repository/LoginUser'
import { RIGHTS } from '../../auth/RIGHTS'

import { proto } from '../../proto/gradido.proto'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sodium = require('sodium-native')

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
> INSERT INTO login_user_roles (id, user_id, role_id) VALUES (NULL, '3', '1');
> UPDATE login_users SET email_checked = 1 WHERE id = 3;
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

## Results
NOTE: We decided not to write the `transaction_signatures` since its unused. This is the main difference.
NOTE: We fixed a bug in the `state_user_transactions code` with the new implementation of apollo


Master:

--
-- Dumping data for table `state_user_transactions`
--

INSERT INTO `state_user_transactions` (`id`, `state_user_id`, `transaction_id`, `transaction_type_id`, `balance`, `balance_date`) VALUES
(1, 2, 1, 1, 10000000, '2021-11-05 12:45:18'),
(2, 2, 2, 2, 9900000, '2021-11-05 12:48:35'),
(3, 1, 2, 2, 100000, '2021-11-05 12:48:35'),
(4, 2, 3, 2, 9800000, '2021-11-05 12:49:07'),
(5, 1, 3, 2, 200000, '2021-11-05 12:49:07'),
(6, 2, 5, 2, 9699845, '2021-11-05 13:03:50'),
(7, 1, 5, 2, 99996, '2021-11-05 13:03:50');

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `state_group_id`, `transaction_type_id`, `tx_hash`, `memo`, `received`, `blockchain_type_id`) VALUES
(1, NULL, 1, 0x9ccdcd01ccb6320c09c2d1da2f0bf735a95ece0e7c1df6bbff51918fbaec061700000000000000000000000000000000, '', '2021-11-05 12:45:18', 1),
(2, NULL, 2, 0x58d7706a67fa4ff4b8038168c6be39a2963d7e28e9d3872759ad09c519fe093700000000000000000000000000000000, 'Hier!', '2021-11-05 12:48:35', 1),
(3, NULL, 2, 0x427cd214f92ef35af671129d50edc5a478c53d1e464f285b7615d9794a69f69b00000000000000000000000000000000, 'Hier!', '2021-11-05 12:49:07', 1),
(4, NULL, 9, 0x32807368f0906a21b94c072599795bc9eeab88fb565df82e85cc62a4fdcde48500000000000000000000000000000000, '', '2021-11-05 12:51:51', 1),
(5, NULL, 2, 0x75eb729e0f60a1c8cead1342955853d2440d7a2ea57dfef6d4a18bff0d94491e00000000000000000000000000000000, 'Hier!', '2021-11-05 13:03:50', 1);

--
-- Dumping data for table `transaction_signatures`
--

INSERT INTO `transaction_signatures` (`id`, `transaction_id`, `signature`, `pubkey`) VALUES
(1, 1, 0x5888edcdcf77aaadad6d321882903bc831d7416f17213fd5020a764365b5fcb336e4c7917385a1278ea44ccdb31eac4a09e448053b5e3f8f1fe5da3baf53c008, 0xd5b20f8dee415038bfa2b6b0e1b40ff54850351109444863b04d6d28825b7b7d),
(2, 2, 0xf6fef428f8f22faf7090f7d740e6088d1d90c58ae92d757117d7d91d799e659f3a3a0c65a3fd97cbde798e761f9d23eff13e8810779a184c97c411f28e7c4608, 0xdc74a589004377ab14836dce68ce2ca34e5b17147cd78ad4b3afe8137524ae8a),
(3, 3, 0x8ebe9730c6cf61f56ef401d6f2bd229f3c298ca3c2791ee9137e4827b7af6c6d6566fca616eb1fe7adc2e4d56b5c7350ae3990c9905580630fa75ecffca8e001, 0xdc74a589004377ab14836dce68ce2ca34e5b17147cd78ad4b3afe8137524ae8a),
(4, 5, 0x50cf418f7e217391e89ab9c2879ae68d7c7c597d846b4fe1c082b5b16e5d0c85c328fbf48ad3490bcfe94f446700ae0a4b0190e76d26cc752abced58f480c80f, 0xdc74a589004377ab14836dce68ce2ca34e5b17147cd78ad4b3afe8137524ae8a);

This Feature Branch:


--
-- Dumping data for table `state_user_transactions`
--

INSERT INTO `state_user_transactions` (`id`, `state_user_id`, `transaction_id`, `transaction_type_id`, `balance`, `balance_date`) VALUES
(1, 2, 1, 1, 10000000, '2021-11-05 00:25:46'),
(12, 2, 7, 2, 9900000, '2021-11-05 00:55:37'),
(13, 1, 7, 2, 100000, '2021-11-05 00:55:37'),
(14, 2, 8, 2, 9800000, '2021-11-05 01:00:04'),
(15, 1, 8, 2, 200000, '2021-11-05 01:00:04'),
(16, 2, 10, 2, 9699772, '2021-11-05 01:17:41'),
(17, 1, 10, 2, 299995, '2021-11-05 01:17:41');

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `state_group_id`, `transaction_type_id`, `tx_hash`, `memo`, `received`, `blockchain_type_id`) VALUES
(1, NULL, 1, 0xdd030d475479877587d927ed9024784ba62266cf1f3d87862fc98ad68f7b26e400000000000000000000000000000000, '', '2021-11-05 00:25:46', 1),
(7, NULL, 2, NULL, 'Hier!', '2021-11-05 00:55:37', 1),
(8, NULL, 2, NULL, 'Hier!', '2021-11-05 01:00:04', 1),
(9, NULL, 9, 0xb1cbedbf126aa35f5edbf06e181c415361d05228ab4da9d19a4595285a673dfa00000000000000000000000000000000, '', '2021-11-05 01:05:34', 1),
(10, NULL, 2, NULL, 'Hier!', '2021-11-05 01:17:41', 1);

--
-- Dumping data for table `transaction_signatures`
--

INSERT INTO `transaction_signatures` (`id`, `transaction_id`, `signature`, `pubkey`) VALUES
(1, 1, 0x60d632479707e5d01cdc32c3326b5a5bae11173a0c06b719ee7b552f9fd644de1a0cd4afc207253329081d39dac1a63421f51571d836995c649fc39afac7480a, 0x48c45cb4fea925e83850f68f2fa8f27a1a4ed1bcba68cdb59fcd86adef3f52ee);
*/

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

async function getPublicKey(email: string): Promise<string | null> {
  const loginUserRepository = getCustomRepository(LoginUserRepository)
  const loginUser = await loginUserRepository.findOne({ email: email })
  // User not found
  if (!loginUser) {
    return null
  }

  return loginUser.pubKey.toString('hex')
}

const protoTransaction = (
  senderPubKey: Buffer,
  senderPrivKey: Buffer,
  recipiantPublicKey: string,
  centAmount: number,
  memo: string,
) => {
  const transferAmount = new proto.gradido.TransferAmount({
    pubkey: senderPubKey,
    amount: centAmount,
  })

  const localTransfer = new proto.gradido.LocalTransfer({
    sender: transferAmount,
    receiver: Buffer.from(recipiantPublicKey, 'hex'),
  })

  const transferTransaction = new proto.gradido.GradidoTransfer({ local: localTransfer })

  const transactionBody = new proto.gradido.TransactionBody({
    memo,
    created: { seconds: new Date().getTime() / 1000 },
    transfer: transferTransaction,
  })

  const bodyBytes = proto.gradido.TransactionBody.encode(transactionBody).finish()

  const sign = Buffer.alloc(sodium.crypto_sign_BYTES)
  sodium.crypto_sign_detached(sign, bodyBytes, senderPrivKey)

  return [bodyBytes, sign]
}

const protoTransactionTxSignature = (
  senderPubKey: Buffer,
  transactionSign: Buffer | Uint8Array,
  previousTransactionTxHash: Buffer | null,
  transactionId: number,
  transactionReceived: Date,
) => {
  const sigPair = new proto.gradido.SignaturePair({
    pubKey: senderPubKey,
    ed25519: transactionSign,
  })
  // TODO: Why an array of sigPair?
  const sigMap = new proto.gradido.SignatureMap({ sigPair: [sigPair] })

  // tx hash
  const state = sodium.crypto_generichash_init(null, sodium.crypto_generic_hash_bytes)
  if (previousTransactionTxHash) {
    sodium.crypto_generichash_update(state, previousTransactionTxHash)
  }
  sodium.crypto_generichash_update(state, transactionId.toString())
  // TODO wtf - this looks scary
  // should match previous used format: yyyy-MM-dd HH:mm:ss
  const receivedString = transactionReceived.toISOString().slice(0, 19).replace('T', ' ')
  sodium.crypto_generichash_update(state, receivedString)
  sodium.crypto_generichash_update(state, proto.gradido.SignatureMap.encode(sigMap).finish())
  return Buffer.from(sodium.crypto_generichash_final(state, sodium.crypto_generic_hash_bytes))
}

@Resolver()
export class TransactionResolver {
  @Authorized([RIGHTS.TRANSACTION_LIST])
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

  @Authorized([RIGHTS.SEND_COINS])
  @Mutation(() => String)
  async sendCoins(
    @Args() { email, amount, memo }: TransactionSendArgs,
    @Ctx() context: any,
  ): Promise<string> {
    // TODO this is subject to replay attacks
    // validate sender user (logged in)
    const userRepository = getCustomRepository(UserRepository)
    const stateUser = await userRepository.findByPubkeyHex(context.pubKey)
    const loginUserRepository = getCustomRepository(LoginUserRepository)
    const senderUser = await loginUserRepository.findByEmail(stateUser.email)
    if (senderUser.pubKey.length !== 32) {
      throw new Error('invalid sender public key')
    }
    if (!hasUserAmount(stateUser, amount)) {
      throw new Error("user hasn't enough GDD")
    }

    // validate recipient user
    // TODO: the detour over the public key is unnecessary
    const recipiantPublicKey = await getPublicKey(email)
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

    let transaction = new dbTransaction()

    const centAmount = Math.trunc(amount * 10000)
    // PROTOBUFF START

    const transactionRepository = getCustomRepository(TransactionRepository)

    // const bodyBytesBase64 = Buffer.from(bodyBytes).toString('base64')

    if (!senderUser.pubKey || !senderUser.privKey) {
      throw new Error('error reading keys')
    }

    // TODO Why don't we save the bodybytes? Thats is the blockchain values we would be writing to the blockchain
    const [bodyBytes, sign] = protoTransaction(
      senderUser.pubKey,
      senderUser.privKey,
      recipiantPublicKey,
      centAmount,
      memo,
    )

    if (!sign) {
      throw new Error('error signing transaction')
    }

    // TODO why generate and then verify?
    /*
    if (!cryptoSignVerifyDetached(sign, bodyBytesBase64, senderUser.pubkey)) {
      throw new Error('Could not verify signature')
    }
    */

    let previousTransactionTxHash = null
    if (transaction.id > 1) {
      const previousTransaction = await transactionRepository.findOne({ id: transaction.id - 1 })
      if (!previousTransaction) {
        throw new Error('Error previous transaction not found')
      }
      previousTransactionTxHash = previousTransaction.txHash
    }

    transaction.txHash = protoTransactionTxSignature(
      senderUser.pubKey,
      sign,
      previousTransactionTxHash,
      transaction.id,
      transaction.received,
    )

    // save signature
    const signature = new DbTransactionSignature()
    signature.transactionId = transaction.id
    signature.signature = Buffer.from(sign)
    signature.pubkey = senderUser.pubKey

    // PROTOBUFF END

    const queryRunner = getConnection().createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('READ UNCOMMITTED')
    try {
      // transaction
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
        stateUser,
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
        stateUser,
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
      transactionSendCoin.senderPublic = senderUser.pubKey
      transactionSendCoin.recipiantUserId = recipiantUser.id
      transactionSendCoin.recipiantPublic = Buffer.from(recipiantPublicKey, 'hex')
      transactionSendCoin.amount = centAmount
      transactionSendCoin.senderFinalBalance = senderStateBalance.amount
      await queryRunner.manager.save(transactionSendCoin).catch((error) => {
        throw new Error('error saving transaction send coin: ' + error)
      })

      await queryRunner.manager.save(transaction).catch((error) => {
        throw new Error('error saving transaction with tx hash: ' + error)
      })

      await queryRunner.manager.save(signature).catch((error) => {
        throw new Error('error saving signature: ' + error)
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
    await sendEMail({
      from: `Gradido (nicht antworten) <${CONFIG.EMAIL_SENDER}>`,
      to: `${recipiantUser.firstName} ${recipiantUser.lastName} <${recipiantUser.email}>`,
      subject: 'Gradido Überweisung',
      text: `Hallo ${recipiantUser.firstName} ${recipiantUser.lastName}
      
      Du hast soeben ${amount} GDD von ${senderUser.firstName} ${senderUser.lastName} erhalten.
      ${senderUser.firstName} ${senderUser.lastName} schreibt:
      
      ${memo}
      
      Bitte antworte nicht auf diese E-Mail!
      
      Mit freundlichen Grüßen,
      dein Gradido-Team`,
    })

    return 'success'
  }
}

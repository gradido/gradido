import { Resolver, Query, Arg, Args, Authorized, Mutation, Ctx } from 'type-graphql'
import { getCustomRepository, Raw } from 'typeorm'
import moment from 'moment'

import { RIGHTS } from '../../auth/RIGHTS'
import { proto } from '../../proto/gradido.proto'
import { TransactionTypeId } from '../enum/TransactionTypeId'

import { Transaction as DbTransaction } from '@entity/Transaction'
import { TransactionSignature as DbTransactionSignature } from '@entity/TransactionSignature'
import { TransactionCreation } from '@entity/TransactionCreation'
import { UserTransaction } from '@entity/UserTransaction'

import { UserAdmin } from '../model/UserAdmin'
import { PendingCreation } from '../model/PendingCreation'
import { UpdatePendingCreation } from '../model/UpdatePendingCreation'
import { LoginUserRepository } from '../../typeorm/repository/LoginUser'
import { TransactionRepository } from '../../typeorm/repository/Transaction'
import { TransactionCreationRepository } from '../../typeorm/repository/TransactionCreation'
import { PendingCreationRepository } from '../../typeorm/repository/PendingCreation'
import { UserRepository } from '../../typeorm/repository/User'
import { UserTransactionRepository } from '../../typeorm/repository/UserTransaction'
import { BalanceRepository } from '../../typeorm/repository/Balance'

import CreatePendingCreationArgs from '../arg/CreatePendingCreationArgs'
import UpdatePendingCreationArgs from '../arg/UpdatePendingCreationArgs'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sodium = require('sodium-native')

const pendingTasksRequestProto = (
  amount: number,
  memo: string,
  receiverPubKey: Buffer,
  date: Date,
) => {
  // TODO: signing user is not part of the transaction?
  const receiver = new proto.gradido.TransferAmount({
    amount,
    pubkey: receiverPubKey,
  })

  const targetDate = new proto.gradido.TimestampSeconds({
    seconds: date.getTime() / 1000,
  })

  const creation = new proto.gradido.GradidoCreation({
    receiver,
    targetDate,
  })

  const transactionBody = new proto.gradido.TransactionBody({
    memo,
    created: { seconds: new Date().getTime() / 1000 },
    creation,
  })

  const bodyBytes = proto.gradido.TransactionBody.encode(transactionBody).finish()

  return bodyBytes // not sure this is the correct value yet

  /*
  // As fas as I understand it request contaisn just the transaction body
  $transaction = new \Proto\Gradido\GradidoTransaction();
  $transaction->setBodyBytes($body_bytes);

  $protoSigMap = new \Proto\Gradido\SignatureMap();
  $sigPairs = $protoSigMap->getSigPair();
  //echo "sigPairs: "; var_dump($sigPairs); echo "<br>";
  //return null;

  // sign with keys
  //foreach($keys as $key) {
    $sigPair = new \Proto\Gradido\SignaturePair();  
    $sigPair->setPubKey(hex2bin($data['signer_public_key']));
    
    $signature = sodium_crypto_sign_detached($body_bytes, hex2bin($data['signer_private_key']));
    echo "signature: " . bin2hex($signature). "<br>";
    $sigPair->setEd25519($signature);

    $sigPairs[] = $sigPair;
    // SODIUM_BASE64_VARIANT_URLSAFE_NO_PADDING
    // SODIUM_BASE64_VARIANT_ORIGINAL
    $transaction->setSigMap($protoSigMap);
    //var_dump($protoSigMap);
    $transaction_bin = $transaction->serializeToString();
  */
}

const protoTransaction = (
  senderPubKey: Buffer,
  senderPrivKey: Buffer,
  memo: string,
  previousTransactionTxHash: Buffer | null,
  transactionId: number,
  transactionReceived: Date,
) => {
  const transactionBody = new proto.gradido.TransactionBody({
    memo,
    created: { seconds: new Date().getTime() / 1000 },
  })

  const bodyBytes = proto.gradido.TransactionBody.encode(transactionBody).finish()

  const sign = Buffer.alloc(sodium.crypto_sign_BYTES)
  sodium.crypto_sign_detached(
    sign,
    bodyBytes,
    senderPrivKey.slice(0, sodium.crypto_sign_SECRETKEYBYTES),
  )

  if (!sign) {
    throw new Error('error signing transaction')
  }

  // const bodyBytesBase64 = Buffer.from(bodyBytes).toString('base64')
  // TODO why generate and then verify?
  /*
  if (!cryptoSignVerifyDetached(sign, bodyBytesBase64, senderUser.pubkey)) {
    throw new Error('Could not verify signature')
  }
  */

  const sigPair = new proto.gradido.SignaturePair({
    pubKey: senderPubKey,
    ed25519: sign,
  })
  // TODO: Why an array of sigPair?
  const sigMap = new proto.gradido.SignatureMap({ sigPair: [sigPair] })

  // tx hash
  const state = Buffer.alloc(sodium.crypto_generichash_STATEBYTES)
  sodium.crypto_generichash_init(state, null, sodium.crypto_generichash_BYTES)
  if (previousTransactionTxHash) {
    sodium.crypto_generichash_update(state, previousTransactionTxHash)
  }
  sodium.crypto_generichash_update(state, Buffer.from(transactionId.toString()))
  // TODO wtf - this looks scary
  // should match previous used format: yyyy-MM-dd HH:mm:ss
  const receivedString = transactionReceived.toISOString().slice(0, 19).replace('T', ' ')
  sodium.crypto_generichash_update(state, Buffer.from(receivedString))
  sodium.crypto_generichash_update(state, 'start decay')
  const sigMapFinish = proto.gradido.SignatureMap.encode(sigMap).finish()
  sodium.crypto_generichash_update(state, sigMapFinish)
  const result = Buffer.alloc(sodium.crypto_generichash_BYTES)
  sodium.crypto_generichash_final(state, result)
  return [sign, result]
}

@Resolver()
export class AdminResolver {
  @Authorized([RIGHTS.CREATE_DECAY_START_BLOCK])
  @Query(() => Boolean)
  async createDecayStartBlock(@Arg('memo') memo: string, @Ctx() context: any): Promise<boolean> {
    const transactionRepository = await getCustomRepository(TransactionRepository)
    if (
      (await transactionRepository.count({ transactionTypeId: TransactionTypeId.DECAY_START })) > 0
    ) {
      throw new Error('Only one start decay block is allowed')
    }
    const userRepository = getCustomRepository(UserRepository)
    const stateUser = await userRepository.findByPubkeyHex(context.pubKey)
    const loginUserRepository = getCustomRepository(LoginUserRepository)
    const senderUser = await loginUserRepository.findByEmail(stateUser.email)
    if (senderUser.pubKey.length !== 32) {
      throw new Error('invalid sender public key')
    }

    if (!senderUser.pubKey || !senderUser.privKey) {
      throw new Error('error reading keys')
    }

    let transaction = new DbTransaction()
    // TODO this should be defined in the entity model aswell
    // transaction.received = new Date()
    transaction = await transactionRepository.save(transaction)

    let previousTransactionTxHash = null
    if (transaction.id > 1) {
      const previousTransaction = await transactionRepository.findOne({ id: transaction.id - 1 })
      if (!previousTransaction) {
        throw new Error('Error previous transaction not found')
      }
      previousTransactionTxHash = previousTransaction.txHash
    }

    const [sign, txHash] = protoTransaction(
      senderUser.pubKey,
      senderUser.privKey,
      memo,
      previousTransactionTxHash,
      transaction.id,
      transaction.received,
    )
    transaction.transactionTypeId = TransactionTypeId.DECAY_START
    transaction.memo = memo
    transaction.txHash = txHash

    await transactionRepository.save(transaction).catch((error) => {
      throw new Error('error saving transaction with tx hash: ' + error)
    })

    // save signature
    // This was not done before - no signature was saved for the decay start block
    const signature = new DbTransactionSignature()
    signature.transactionId = transaction.id
    signature.signature = Buffer.from(sign)
    signature.pubkey = senderUser.pubKey

    return true
  }

  @Authorized([RIGHTS.SEARCH_USERS])
  @Query(() => [UserAdmin])
  async searchUsers(@Arg('searchText') searchText: string): Promise<UserAdmin[]> {
    const userRepository = getCustomRepository(UserRepository)
    const users = await userRepository.findBySearchCriteria(searchText)
    const adminUsers = await Promise.all(
      users.map(async (user) => {
        const adminUser = new UserAdmin()
        adminUser.firstName = user.firstName
        adminUser.lastName = user.lastName
        adminUser.email = user.email
        adminUser.creation = await getUserCreations(user.id)
        return adminUser
      }),
    )
    return adminUsers
  }

  @Authorized([RIGHTS.SEARCH_USERS])
  @Mutation(() => [Number])
  async createPendingCreation(
    @Args() { email, amount, memo, creationDate, moderator }: CreatePendingCreationArgs,
  ): Promise<number[]> {
    const userRepository = getCustomRepository(UserRepository)
    const user = await userRepository.findByEmail(email)

    const creations = await getUserCreations(user.id)
    const creationDateObj = new Date(creationDate)
    if (isCreationValid(creations, amount, creationDateObj)) {
      const pendingCreationRepository = getCustomRepository(PendingCreationRepository)
      const loginPendingTaskAdmin = pendingCreationRepository.create()
      loginPendingTaskAdmin.userId = user.id
      loginPendingTaskAdmin.amount = BigInt(amount * 10000)
      loginPendingTaskAdmin.created = new Date()
      loginPendingTaskAdmin.date = creationDateObj
      loginPendingTaskAdmin.memo = memo
      loginPendingTaskAdmin.moderator = moderator

      pendingCreationRepository.save(loginPendingTaskAdmin)
    }
    return await getUserCreations(user.id)
  }

  // @Authorized([RIGHTS.SEARCH_USERS])
  @Mutation(() => UpdatePendingCreation)
  async updatePendingCreation(
    @Args() { id, email, amount, memo, creationDate, moderator }: UpdatePendingCreationArgs,
  ): Promise<UpdatePendingCreation> {
    const userRepository = getCustomRepository(UserRepository)
    const user = await userRepository.findByEmail(email)

    const pendingCreationRepository = getCustomRepository(PendingCreationRepository)
    const updatedCreation = await pendingCreationRepository.findOneOrFail({ id })

    if (updatedCreation.userId !== user.id)
      throw new Error('user of the pending creation and send user does not correspond')

    updatedCreation.amount = BigInt(amount * 10000)
    updatedCreation.memo = memo
    updatedCreation.date = new Date(creationDate)
    updatedCreation.moderator = moderator

    await pendingCreationRepository.save(updatedCreation)
    const result = new UpdatePendingCreation()
    result.amount = parseInt(amount.toString())
    result.memo = updatedCreation.memo
    result.date = updatedCreation.date
    result.moderator = updatedCreation.moderator
    result.creation = await getUserCreations(user.id)

    return result

    // const creations = await getUserCreations(user.id)
    // const creationDateObj = new Date(creationDate)
    // if (isCreationValid(creations, amount, creationDateObj)) {
    //   const pendingCreationRepository = getCustomRepository(PendingCreationRepository)
    //   const loginPendingTaskAdmin = pendingCreationRepository.create()
    //   loginPendingTaskAdmin.userId = user.id
    //   loginPendingTaskAdmin.amount = BigInt(amount * 10000)
    //   loginPendingTaskAdmin.created = new Date()
    //   loginPendingTaskAdmin.date = creationDateObj
    //   loginPendingTaskAdmin.memo = memo
    //   loginPendingTaskAdmin.moderator = moderator
    //
    //   pendingCreationRepository.save(loginPendingTaskAdmin)
    // }
    // return await getUserCreations(user.id)
  }

  @Query(() => [PendingCreation])
  async getPendingCreations(): Promise<PendingCreation[]> {
    const pendingCreationRepository = getCustomRepository(PendingCreationRepository)
    const pendingCreations = await pendingCreationRepository.find()

    const pendingCreationsPromise = await Promise.all(
      pendingCreations.map(async (pendingCreation) => {
        const userRepository = getCustomRepository(UserRepository)
        const user = await userRepository.findOneOrFail({ id: pendingCreation.userId })

        const parsedAmount = Number(parseInt(pendingCreation.amount.toString()) / 10000)
        // pendingCreation.amount = parsedAmount
        const newPendingCreation = {
          ...pendingCreation,
          amount: parsedAmount,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          creation: await getUserCreations(user.id),
        }

        return newPendingCreation
      }),
    )
    return pendingCreationsPromise
  }

  @Mutation(() => Boolean)
  async deletePendingCreation(@Arg('id') id: number): Promise<boolean> {
    const pendingCreationRepository = getCustomRepository(PendingCreationRepository)
    const entity = await pendingCreationRepository.findOneOrFail(id)
    const res = await pendingCreationRepository.delete(entity)
    return !!res
  }

  @Mutation(() => Boolean)
  async confirmPendingCreation(@Arg('id') id: number): Promise<boolean> {
    const pendingCreationRepository = getCustomRepository(PendingCreationRepository)
    const pendingCreation = await pendingCreationRepository.findOneOrFail(id)

    const transactionRepository = getCustomRepository(TransactionRepository)
    let transaction = new DbTransaction()
    transaction.transactionTypeId = 1
    transaction.memo = pendingCreation.memo
    transaction.received = new Date()
    transaction.blockchainTypeId = 1
    transaction = await transactionRepository.save(transaction)
    if (!transaction) throw new Error('Could not create transaction')

    const transactionCreationRepository = getCustomRepository(TransactionCreationRepository)
    let transactionCreation = new TransactionCreation()
    transactionCreation.transactionId = transaction.id
    transactionCreation.userId = pendingCreation.userId
    transactionCreation.amount = parseInt(pendingCreation.amount.toString())
    transactionCreation.targetDate = pendingCreation.date
    transactionCreation = await transactionCreationRepository.save(transactionCreation)
    if (!transactionCreation) throw new Error('Could not create transactionCreation')

    const userTransactionRepository = getCustomRepository(UserTransactionRepository)
    const lastUserTransaction = await userTransactionRepository.findLastForUser(
      pendingCreation.userId,
    )
    let newBalance = 0
    if (!lastUserTransaction) {
      newBalance = 0
    } else {
      newBalance = lastUserTransaction.balance
    }
    newBalance = Number(newBalance) + Number(parseInt(pendingCreation.amount.toString()))

    const newUserTransaction = new UserTransaction()
    newUserTransaction.userId = pendingCreation.userId
    newUserTransaction.transactionId = transaction.id
    newUserTransaction.transactionTypeId = transaction.transactionTypeId
    newUserTransaction.balance = Number(newBalance)
    newUserTransaction.balanceDate = transaction.received

    await userTransactionRepository.save(newUserTransaction).catch((error) => {
      throw new Error('Error saving user transaction: ' + error)
    })

    const balanceRepository = getCustomRepository(BalanceRepository)
    let userBalance = await balanceRepository.findByUser(pendingCreation.userId)

    if (!userBalance) userBalance = balanceRepository.create()
    userBalance.userId = pendingCreation.userId
    userBalance.amount = Number(newBalance)
    userBalance.modified = new Date()
    userBalance.recordDate = userBalance.recordDate ? userBalance.recordDate : new Date()
    await balanceRepository.save(userBalance)
    await pendingCreationRepository.delete(pendingCreation)

    return true
  }
}

async function getUserCreations(id: number): Promise<number[]> {
  const dateNextMonth = moment().add(1, 'month').format('YYYY-MM') + '-01'
  const dateMonth = moment().format('YYYY-MM') + '-01'
  const dateLastMonth = moment().subtract(1, 'month').format('YYYY-MM') + '-01'
  const dateBeforeLastMonth = moment().subtract(2, 'month').format('YYYY-MM') + '-01'

  const transactionCreationRepository = getCustomRepository(TransactionCreationRepository)
  const createdAmountBeforeLastMonth = await transactionCreationRepository
    .createQueryBuilder('transaction_creations')
    .select('SUM(transaction_creations.amount)', 'sum')
    .where('transaction_creations.state_user_id = :id', { id })
    .andWhere({
      targetDate: Raw((alias) => `${alias} >= :date and ${alias} < :enddate`, {
        date: dateBeforeLastMonth,
        enddate: dateLastMonth,
      }),
    })
    .getRawOne()

  const createdAmountLastMonth = await transactionCreationRepository
    .createQueryBuilder('transaction_creations')
    .select('SUM(transaction_creations.amount)', 'sum')
    .where('transaction_creations.state_user_id = :id', { id })
    .andWhere({
      targetDate: Raw((alias) => `${alias} >= :date and ${alias} < :enddate`, {
        date: dateLastMonth,
        enddate: dateMonth,
      }),
    })
    .getRawOne()

  const createdAmountMonth = await transactionCreationRepository
    .createQueryBuilder('transaction_creations')
    .select('SUM(transaction_creations.amount)', 'sum')
    .where('transaction_creations.state_user_id = :id', { id })
    .andWhere({
      targetDate: Raw((alias) => `${alias} >= :date and ${alias} < :enddate`, {
        date: dateMonth,
        enddate: dateNextMonth,
      }),
    })
    .getRawOne()

  const pendingCreationRepository = getCustomRepository(PendingCreationRepository)
  const pendingAmountMounth = await pendingCreationRepository
    .createQueryBuilder('login_pending_tasks_admin')
    .select('SUM(login_pending_tasks_admin.amount)', 'sum')
    .where('login_pending_tasks_admin.userId = :id', { id })
    .andWhere({
      date: Raw((alias) => `${alias} >= :date and ${alias} < :enddate`, {
        date: dateMonth,
        enddate: dateNextMonth,
      }),
    })
    .getRawOne()

  const pendingAmountLastMounth = await pendingCreationRepository
    .createQueryBuilder('login_pending_tasks_admin')
    .select('SUM(login_pending_tasks_admin.amount)', 'sum')
    .where('login_pending_tasks_admin.userId = :id', { id })
    .andWhere({
      date: Raw((alias) => `${alias} >= :date and ${alias} < :enddate`, {
        date: dateLastMonth,
        enddate: dateMonth,
      }),
    })
    .getRawOne()

  const pendingAmountBeforeLastMounth = await pendingCreationRepository
    .createQueryBuilder('login_pending_tasks_admin')
    .select('SUM(login_pending_tasks_admin.amount)', 'sum')
    .where('login_pending_tasks_admin.userId = :id', { id })
    .andWhere({
      date: Raw((alias) => `${alias} >= :date and ${alias} < :enddate`, {
        date: dateBeforeLastMonth,
        enddate: dateLastMonth,
      }),
    })
    .getRawOne()

  // COUNT amount from 2 tables
  const usedCreationBeforeLastMonth =
    (Number(createdAmountBeforeLastMonth.sum) + Number(pendingAmountBeforeLastMounth.sum)) / 10000
  const usedCreationLastMonth =
    (Number(createdAmountLastMonth.sum) + Number(pendingAmountLastMounth.sum)) / 10000
  const usedCreationMonth =
    (Number(createdAmountMonth.sum) + Number(pendingAmountMounth.sum)) / 10000
  return [
    1000 - usedCreationBeforeLastMonth,
    1000 - usedCreationLastMonth,
    1000 - usedCreationMonth,
  ]
}

function isCreationValid(creations: number[], amount: number, creationDate: Date) {
  const dateMonth = moment().format('YYYY-MM')
  const dateLastMonth = moment().subtract(1, 'month').format('YYYY-MM')
  const dateBeforeLastMonth = moment().subtract(2, 'month').format('YYYY-MM')
  const creationDateMonth = moment(creationDate).format('YYYY-MM')

  let openCreation
  switch (creationDateMonth) {
    case dateMonth:
      openCreation = creations[2]
      break
    case dateLastMonth:
      openCreation = creations[1]
      break
    case dateBeforeLastMonth:
      openCreation = creations[0]
      break
    default:
      throw new Error('CreationDate is not in last three months')
  }

  if (openCreation < amount) {
    throw new Error(`Open creation (${openCreation}) is less than amount (${amount})`)
  }
  return true
}

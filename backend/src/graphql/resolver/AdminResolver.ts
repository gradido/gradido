import { Resolver, Query, Arg, Authorized, Ctx } from 'type-graphql'
import { getCustomRepository } from 'typeorm'
import { UserAdmin } from '../model/UserAdmin'
import { LoginUserRepository } from '../../typeorm/repository/LoginUser'
import { TransactionRepository } from '../../typeorm/repository/Transaction'
import { RIGHTS } from '../../auth/RIGHTS'
import { proto } from '../../proto/gradido.proto'
import { TransactionTypeId } from '../enum/TransactionTypeId'
import { Transaction as DbTransaction } from '@entity/Transaction'
import { TransactionSignature as DbTransactionSignature } from '@entity/TransactionSignature'
import { UserRepository } from '../../typeorm/repository/User'

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
    const loginUserRepository = getCustomRepository(LoginUserRepository)
    const loginUsers = await loginUserRepository.findBySearchCriteria(searchText)
    const users = loginUsers.map((loginUser) => {
      const user = new UserAdmin()
      user.firstName = loginUser.firstName
      user.lastName = loginUser.lastName
      user.email = loginUser.email
      user.creation = [
        (Math.floor(Math.random() * 50) + 1) * 20,
        (Math.floor(Math.random() * 50) + 1) * 20,
        (Math.floor(Math.random() * 50) + 1) * 20,
      ]
      return user
    })
    return users
  }
}

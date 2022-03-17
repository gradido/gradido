import { User } from '@entity/User'
import { apiPost } from '../apis/HttpRequest'
import CONFIG from '../config'
import { KeyPairEd25519Create } from '../graphql/resolver/UserResolver'
import { encryptMemo, PHRASE_WORD_COUNT } from './Crypto'

import { Base64 } from 'js-base64'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sodium = require('sodium-native')

async function recoverPrivateKey(user: User): Promise<Buffer> {
  // this can be only temporary, because the user backup will be encrypted for security reasons
  // TODO: Use another approach
  const passphrase = user.passphrase.slice().split(' ')
  if (passphrase.length < PHRASE_WORD_COUNT) {
    // TODO if this can happen we cannot recover from that
    throw new Error('Could not load a correct passphrase')
  }
  const keyPair = KeyPairEd25519Create(passphrase) // return pub, priv Key
  return keyPair[1]
}

async function signAndSendTransaction(
  signingUser: User,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  packTransaction: any,
  recipientUserPubkey?: Buffer | null,
  memo?: string | null,
  apolloTransactionId?: number | 0,
  recipientGroupAlias?: string | null,
): Promise<Buffer> {
  const privateKey = await recoverPrivateKey(signingUser)
  if (memo && recipientUserPubkey) {
    packTransaction.memo = encryptMemo(memo, privateKey, recipientUserPubkey)
  }
  if (recipientGroupAlias) {
    packTransaction.senderGroupAlias = CONFIG.COMMUNITY_ALIAS
    packTransaction.recipientGroupAlias = recipientGroupAlias
  }
  const resultPackTransaction = await apiPost(
    CONFIG.BLOCKCHAIN_CONNECTOR_API_URL + 'packTransaction',
    packTransaction,
  )
  // throw error if something went wrong
  if (!resultPackTransaction.success) {
    throw new Error(resultPackTransaction.data)
  }

  const sign = Buffer.alloc(sodium.crypto_sign_BYTES)
  sodium.crypto_sign_detached(
    sign,
    Base64.toUint8Array(resultPackTransaction.data.transactions[0].bodyBytesBase64),
    privateKey,
  )
  const signingUserPubkeyHex = signingUser.pubKey.toString('hex')
  const resultSendTransactionIota = await apiPost(
    CONFIG.BLOCKCHAIN_CONNECTOR_API_URL + 'sendTransactionIota',
    {
      bodyBytesBase64: resultPackTransaction.data.transactions[0].bodyBytesBase64,
      apolloTransactionId: apolloTransactionId,
      signaturePairs: [
        {
          pubkey: signingUserPubkeyHex,
          signature: sign.toString('hex'),
        },
      ],
      groupAlias: CONFIG.COMMUNITY_ALIAS,
    },
  )
  // throw error if something went wrong
  if (!resultSendTransactionIota.success) {
    throw new Error(resultSendTransactionIota.data)
  }
  const signature = sign
  if (recipientGroupAlias && resultPackTransaction.data.transactions.length > 1) {
    sodium.crypto_sign_detached(
      sign,
      Base64.toUint8Array(resultPackTransaction.data.transactions[1].bodyBytesBase64),
      privateKey,
    )
    const resultSendTransactionIota = await apiPost(
      CONFIG.BLOCKCHAIN_CONNECTOR_API_URL + 'sendTransactionIota',
      {
        bodyBytesBase64: resultPackTransaction.data.transactions[1].bodyBytesBase64,
        signaturePairs: [
          {
            pubkey: signingUserPubkeyHex,
            signature: sign.toString('hex'),
          },
        ],
        groupAlias: recipientGroupAlias,
      },
    )
    // throw error if something went wrong
    if (!resultSendTransactionIota.success) {
      throw new Error(resultSendTransactionIota.data)
    }
  }
  return signature
}

async function sendCoins(
  created: Date,
  user: User,
  apolloTransactionId: number,
  recipientPublicHex: string,
  amount: string,
  memo: string,
  recipientGroupAlias?: string | null,
): Promise<Buffer> {
  const packTransactionRequest = {
    transactionType: 'transfer',
    created: created.toISOString(),
    senderPubkey: user.pubKey.toString('hex'),
    recipientPubkey: recipientPublicHex,
    amount: amount,
    senderGroupAlias: '',
    recipientGroupAlias: '',
  }

  return signAndSendTransaction(
    user,
    packTransactionRequest,
    Buffer.from(recipientPublicHex, 'hex'),
    memo,
    apolloTransactionId,
    recipientGroupAlias,
  )
}

async function registerNewGroup(
  created: Date,
  user: User,
  communityName: string,
  communityAlias: string,
  communityCoinColor: number | string,
): Promise<Buffer> {
  const packTransactionRequest = {
    transactionType: 'groupAdd',
    created: created.toISOString(),
    groupName: communityName,
    groupAlias: communityAlias,
    coinColor: communityCoinColor,
  }
  return signAndSendTransaction(user, packTransactionRequest)
}

async function creation(
  created: Date,
  signingUser: User,
  recipientUser: User,
  apolloTransactionId: number,
  memo: string,
  amount: string,
  targetDate: Date,
): Promise<Buffer> {
  const packTransactionRequest = {
    transactionType: 'creation',
    created: created.toISOString(),
    recipientPubkey: recipientUser.pubKey.toString('hex'),
    amount: amount,
    targetDate: targetDate.toISOString(),
  }
  return signAndSendTransaction(
    signingUser,
    packTransactionRequest,
    recipientUser.pubKey,
    memo,
    apolloTransactionId,
  )
}

export { sendCoins, registerNewGroup, creation }

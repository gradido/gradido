import { User } from '@entity/User'
import { apiPost } from '../apis/HttpRequest'
import CONFIG from '../config'
import { KeyPairEd25519Create, PHRASE_WORD_COUNT } from './Crypto'

import { Base64 } from 'js-base64'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sodium = require('sodium-native')

async function signAndSendTransaction(
  user: User,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  packTransaction: any,
  recipientGroupAlias: string,
): Promise<Buffer> {
  if (recipientGroupAlias !== '') {
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

  // this can be only temporary, because the user backup will be encrypted for security reasons
  // TODO: Use another approach
  const passphrase = user.passphrase.slice(0, -1).split(' ')
  if (passphrase.length < PHRASE_WORD_COUNT) {
    // TODO if this can happen we cannot recover from that
    throw new Error('Could not load a correct passphrase')
  }
  const keyPair = KeyPairEd25519Create(passphrase) // return pub, priv Key
  const sign = Buffer.alloc(sodium.crypto_sign_BYTES)
  sodium.crypto_sign_detached(
    sign,
    Base64.toUint8Array(resultPackTransaction.data.transactions[0].bodyBytesBase64),
    keyPair[1],
  )
  const senderPubkeyHex = user.pubKey.toString('hex')
  const resultSendTransactionIota = await apiPost(
    CONFIG.BLOCKCHAIN_CONNECTOR_API_URL + 'sendTransactionIota',
    {
      bodyBytesBase64: resultPackTransaction.data.transactions[0].bodyBytesBase64,
      signaturePairs: [
        {
          pubkey: senderPubkeyHex,
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
  if (recipientGroupAlias !== '' && resultPackTransaction.data.transactions.length > 1) {
    sodium.crypto_sign_detached(
      sign,
      Base64.toUint8Array(resultPackTransaction.data.transactions[1].bodyBytesBase64),
      keyPair[1],
    )
    const resultSendTransactionIota = await apiPost(
      CONFIG.BLOCKCHAIN_CONNECTOR_API_URL + 'sendTransactionIota',
      {
        bodyBytesBase64: resultPackTransaction.data.transactions[1].bodyBytesBase64,
        signaturePairs: [
          {
            pubkey: senderPubkeyHex,
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
  recipientGroupAlias: string | '',
): Promise<Buffer> {
  const packTransactionRequest = {
    transactionType: 'transfer',
    created: created.toISOString(),
    apolloTransactionId: apolloTransactionId,
    senderPubkey: user.pubKey.toString('hex'),
    recipientPubkey: recipientPublicHex,
    amount: amount,
    memo: memo,
    senderGroupAlias: '',
    recipientGroupAlias: '',
  }
  return signAndSendTransaction(user, packTransactionRequest, recipientGroupAlias)
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
  return signAndSendTransaction(user, packTransactionRequest, '')
}

async function creation(
  created: Date,
  user: User,
  apolloTransactionId: number,
  memo: string,
  amount: string,
  targetDate: Date,
): Promise<Buffer> {
  const packTransactionRequest = {
    transactionType: 'creation',
    created: created.toISOString(),
    apolloTransactionId: apolloTransactionId,
    memo: memo,
    recipientPubkey: user.pubKey.toString('hex'),
    amount: amount,
    targetDate: targetDate.toISOString(),
  }
  return signAndSendTransaction(user, packTransactionRequest, '')
}

export { sendCoins, registerNewGroup, creation }

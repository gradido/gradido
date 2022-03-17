import { Base64 } from 'js-base64'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sodium = require('sodium-native')

const PHRASE_WORD_COUNT = 24

function encryptMemo(memo: string, senderPrivateKey: Buffer, recipientPublicKey: Buffer): string {
  const memoBuffer = Buffer.from(memo)
  const result = Buffer.alloc(
    sodium.crypto_box_NONCEBYTES + sodium.crypto_box_MACBYTES + memoBuffer.length,
  )
  sodium.randombytes_buf(result)
  sodium.crypto_box_easy(
    result.subarray(sodium.crypto_box_NONCEBYTES),
    memoBuffer,
    result.subarray(0, sodium.crypto_box_NONCEBYTES),
    recipientPublicKey,
    senderPrivateKey.subarray(0, sodium.crypto_box_SECRETKEYBYTES),
  )
  return result.toString('base64url')
}

function decryptMemo(encryptedMemoBase64: string, publicKey: Buffer, privateKey: Buffer): string {
  const encryptedMemo = Base64.toUint8Array(encryptedMemoBase64)
  const result = Buffer.alloc(
    encryptedMemo.length - sodium.crypto_box_NONCEBYTES - sodium.crypto_box_MACBYTES,
  )
  sodium.crypto_box_open_easy(
    result,
    encryptedMemo.subarray(sodium.crypto_box_NONCEBYTES),
    encryptedMemo.subarray(0, sodium.crypto_box_NONCEBYTES),
    publicKey,
    privateKey,
  )
  return result.toString()
}

export { PHRASE_WORD_COUNT, encryptMemo, decryptMemo }

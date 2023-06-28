import { compactDecrypt, compactVerify, CompactSign, CompactEncrypt } from 'jose'

export const verifyToken = async (
  token: string,
  keyPair: { publicKey: Buffer; privateKey: Buffer },
  nonce: number | null = null,
) => {
  const { plaintext } = await compactDecrypt(token, keyPair.privateKey)
  const decryptedJWEPayload = JSON.parse(new TextDecoder().decode(plaintext))
  // TODO: it is unclear if the pubKey must be explicitly put into the payload or
  //       if the toke itself contains it already in its protected headers(or elsewhere)
  //       > Update: after some reasearch - the pubKey is not part of the header -
  //                 we need it for identification and verification tho
  const clientPubKey = decryptedJWEPayload.publicKey
  const decryptedJWS = decryptedJWEPayload.jws
  // TODO: verify clientPubKey (e.g. check federation table + rights here)
  const { payload: payloadJWS } = await compactVerify(decryptedJWS, clientPubKey)

  const payloadRecieved = JSON.parse(new TextDecoder().decode(payloadJWS))
  const recievedNonce = payloadRecieved.nonce

  if (nonce && recievedNonce !== nonce) {
    throw new Error('Could not verify nonce')
  }

  return { publicKey: clientPubKey, nonce: recievedNonce }
}

export const generateToken = async (
  nonce: number,
  keyPair: { publicKey: Buffer; privateKey: Buffer },
  recieverPublicKey: Buffer,
) => {
  const jws = await new CompactSign(new TextEncoder().encode(nonce.toString()))
    .setProtectedHeader({ alg: 'ES256' })
    .sign(keyPair.privateKey)
  return await new CompactEncrypt(
    new TextEncoder().encode(
      JSON.stringify({
        jws,
        publicKey: keyPair.publicKey,
      }),
    ),
  )
    .setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM' })
    .encrypt(recieverPublicKey)
}

/*

Definition:
client: In federation context, the backend is the client 
server: In federation context, the federation module is the backend/server

keyPairClient: The client possesses his own key pair used in the federation 
keyPubServer: The client possesses the public key of the server

keyPairServer: The server possesses his own key pair used in the federation

JWE: Encrypted JSONWebToken - JSON Web Signature 
JWS: Signed JSONWebToken - JSON Web Encryption
Both are part of the JSON Object Signing and Encryption definitions - see https://github.com/panva/jose

In the header the Client send a Request-JWE to prove identity and possession of the private key.
The Request-JWE contains a JWS with a nonce(secret).
The Server decrypts the Request-JWE and verifies the JWS - then returns a Response-JWE, which contains the decrypted nonce.
The client verifies the received Response-JWE and verifies the nonce.

Note: If any verification fails the request/response is invalid
Note: This allows to verify the requesting community and decide if the request is consider authenticated/valid

Handshake:
Client ---(Request-JWE)---> Server
Client <--(Response-JWE)--- Server

The Request-JWE contains:
- an encrypted random nonce(with servers public key)
- the publicKey of the client
- is signed with the clients privateKey(keyPairClient) to allow verification with the keyPubClient

The Response-JWE contains:
- the decrypted nonce from the Request-JWE
- is signed with the servers privateKey(keyPairServer) to allow verification with the keyPubServer

Note: This is a simplification of things - jwe and jws need to be used in order to encrypt and sign.
      The above describes both parts and names it JWE, which its a combination of JWE(JWS(payload))
      For more info see: https://stackoverflow.com/questions/52755369/combining-jwe-and-jws
*/

const client = {
  keyPairClient: 'TODO',
  keyPubServer: 'TODO',
}

const server = {
  keyPairServer: 'TODO',
}

export const handshake = () => {
  // Request
  // Client
  const generatedNonce = sodium.randombytes_buf(32)
  const payloadRequest = {
    nonce: generatedNonce
  }
  const requestToken = generateToken(payloadRequest, client.keyPairClient.privKey, client.keyPubServer)

  // Server
  const {clientPubKey, nonce: recievedNonce} = verifyToken(requestToken, server.keyPairServer)

  // Logic
  // TODO: Logic to generate the actual body for the response

  // Response
  const payloadResponse = {
    nonce: recievedNonce,
  }
  const responseToken = generateToken(payloadResponse, server.keyPairServer, clientPubKey)

  // Client
  verifyToken(responseToken, client.keyPairClient, generatedNonce)
}

const generateToken = (payload, myKeyPair, otherPublicKey) => {
    const jws = await new jose.CompactSign(
        new TextEncoder().encode(payload),
      )
    .setProtectedHeader({ alg: 'ES256' })
    .sign(myKeyPair.privateKey)
    const jwe = await new jose.CompactEncrypt(
        new TextEncoder().encode({
            jws,
            pubKey: myKeyPair.pubKey
        }),
      )
    .setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM' })
    .encrypt(otherPublicKey)
    return jwe
}

const verifyToken = (token, myKeyPair, nonce = null) => {
    const { plaintext } = await jose.compactDecrypt(token, myKeyPair.privateKey)

  const decryptedJWEPayload = new TextDecoder().decode(plaintext)
  // TODO: it is unclear if the pubKey must be explicitly put into the payload or
  //       if the toke itself contains it already in its protected headers(or elsewhere)
  //       > Update: after some reasearch - the pubKey is not part of the header -
  //                 we need it for identification and verification tho
  const clientPubKey = decryptedJWEPayload.pubKey
  const decryptedJWS = decryptedJWEPayload.jws
  // TODO: verify clientPubKey (e.g. check federation table + rights here)
  const { payload: payloadJWS } = await jose.compactVerify(decryptedJWS, clientPubKey)

  const payloadRecieved = new TextDecoder().decode(payloadJWS)
  const recievedNonce = payloadRecieved.nonce

  if(nonce && recievedNonce !== nonce){
    throw new Error('Could not verify nonce')
  }

  return { clientPubKey, nonce: recievedNonce }
}
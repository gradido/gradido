/*

Definition:
client: In Federation context, the backend is the client 
server: In federation context, the federation module is the backend/server

keyPairClient: The client possesses his own keypair used in the federation 
keyPubServer: the client possesses the public key of the server

keyPairServer: The server posses his own keypair used in the federation
keyPubClient: the server posses the publicKey of the client

In the header the Client send a Request-JWE to prove identity and possession of the private key.
The Request-JWE contains a nonce(secret) which can only be decrypted with the private key of the server.
The Server verifies and decrypts the Request-JWE and returns a Response-JWE, which signs the decrypoted nonce.
The client verifies the received Response-JWE and verifies the nonce.

Note: If any verification fails the request/response is invalid
Note: This allows to verify the requesting community and decide if the request is consider authenticated/valid
Note: The Response-JWE does not need to carry any secret, therefore a JWT would be sufficient.
      It is a design choice to enable us to respond with encrypted values, even tho currently not needed.
      This choice is primarily for uniformity rather then any future use and comes with the disadvantage of more encryption work.

Handshake:
Client ---(Request-JWE)---> Server
Client <--(Response-JWE)--- Server

The Request-JWE contains:
- a time of validity(10sec)
- an encrypted random nonce(with servers public key)
- is signed with the clients privateKey(keyPairClient) to allow verification with the keyPubClient

The Response-JWE contains:
- a time of validity(10sec) (TODO: not sure if needed)
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
  // TODO: Logic to generate the actual content-payload for the response
  const data = 'TODO'

  // Response
  const payloadResponse = {
    nonce: recievedNonce,
    data,
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
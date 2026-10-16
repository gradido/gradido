// AI-GENERATED — not an architecture reference
import { createHash, createPrivateKey, createPublicKey, KeyObject, randomBytes } from 'node:crypto'
import { createSigner, createVerifier, httpbis } from 'http-message-signatures'
import { DomainError } from '../errorTypes'

/** The Ed25519 key pair a community signs with, as libsodium stores it: privateKey = seed || publicKey. */
export type SigningCommunity = { publicKey: Buffer; privateKey: Buffer | null }

export class InvalidResponseSignatureError extends DomainError {
  constructor(public readonly reason: string) {
    super(`invalid response signature: ${reason}`)
  }
}

// What an RFC 9421 response signature covers. The body is covered through content-digest (RFC 9530).
const COVERED_RESPONSE_FIELDS = ['@status', 'content-type', 'content-digest']
// The nonce of the request makes a response fresh: it answers this one request and no other.
// No created or expires, so the clocks of the two community servers do not have to agree.
const SIGNATURE_PARAMS = ['keyid', 'alg', 'nonce']

/** 128 random bits as hex, for a request whose response is to be signed, see signatureNonceSchema */
export const createSignatureNonce = (): string => randomBytes(16).toString('hex')

// DER headers of Ed25519 keys in PKCS#8 and SPKI; the 32 raw bytes follow them (RFC 8410)
const ED25519_PKCS8_PREFIX = Buffer.from('302e020100300506032b657004220420', 'hex')
const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex')

export const contentDigest = (body: string): string =>
  `sha-256=:${createHash('sha256').update(body).digest('base64')}:`

const ed25519PrivateKey = (libsodiumPrivateKey: Buffer): KeyObject =>
  createPrivateKey({
    key: Buffer.concat([ED25519_PKCS8_PREFIX, libsodiumPrivateKey.subarray(0, 32)]),
    format: 'der',
    type: 'pkcs8',
  })

const ed25519PublicKey = (publicKey: Buffer): KeyObject =>
  createPublicKey({
    key: Buffer.concat([ED25519_SPKI_PREFIX, publicKey]),
    format: 'der',
    type: 'spki',
  })

/**
 * Serializes value as JSON and signs the response with the community's Ed25519 key (RFC 9421).
 * keyid is the community public key as hex, the same key the DHT announces; nonce is the one
 * the request brought, as hex.
 * @throws Error if the community has no private key - a home community always has one
 */
export async function signedJsonResponse(
  value: unknown,
  status: number,
  community: SigningCommunity,
  nonce: string,
): Promise<Response> {
  if (!community.privateKey) {
    throw new Error('community has no private key, cannot sign the response')
  }
  const body = JSON.stringify(value)
  const { headers } = await httpbis.signMessage(
    {
      key: createSigner(
        ed25519PrivateKey(community.privateKey),
        'ed25519',
        community.publicKey.toString('hex'),
      ),
      fields: COVERED_RESPONSE_FIELDS,
      params: SIGNATURE_PARAMS,
      paramValues: { nonce },
    },
    {
      status,
      headers: { 'content-type': 'application/json', 'content-digest': contentDigest(body) },
    },
  )
  return new Response(body, {
    status,
    headers: Object.entries(headers).flatMap(([name, values]) =>
      [values].flat().map((value): [string, string] => [name, value]),
    ),
  })
}

/**
 * Resolves if the response was signed by the community with this public key, over this body,
 * as the answer to the request that carried this nonce.
 * @throws InvalidResponseSignatureError if the digest does not match the body, the response is
 *         not signed, a signature is by another key, the nonce is not the one of the request,
 *         or the signature does not match
 * @throws the errors of http-message-signatures, as they are, for malformed or incomplete
 *         signatures (UnacceptableSignatureError, MalformedSignatureError, and a plain Error
 *         'Incomplete signature headers' where only one of Signature and Signature-Input is set)
 */
export async function verifySignedResponse(
  response: { status: number; headers: Headers; body: string },
  publicKey: Buffer,
  nonce: string,
): Promise<void> {
  // the signature covers the digest header only, the body is bound by comparing it here
  if (response.headers.get('content-digest') !== contentDigest(response.body)) {
    throw new InvalidResponseSignatureError('content-digest does not match the body')
  }
  const keyid = publicKey.toString('hex')
  const verify = createVerifier(ed25519PublicKey(publicKey), 'ed25519')
  const verified = await httpbis.verifyMessage(
    {
      keyLookup: async (params) => {
        // a signature by any other key refuses the whole response, even beside a valid one
        if (params.keyid !== keyid) {
          throw new InvalidResponseSignatureError(`no signature by key ${keyid}`)
        }
        // a signed answer to another request, replayed
        if (params.nonce !== nonce) {
          throw new InvalidResponseSignatureError('nonce is not the one of the request')
        }
        return { id: keyid, algs: ['ed25519'], verify }
      },
      requiredFields: COVERED_RESPONSE_FIELDS,
      requiredParams: SIGNATURE_PARAMS,
    },
    { status: response.status, headers: Object.fromEntries(response.headers) },
  )
  // null: neither Signature nor Signature-Input, the library asked for no key
  if (verified === null) {
    throw new InvalidResponseSignatureError('response is not signed')
  }
  if (!verified) {
    throw new InvalidResponseSignatureError('signature does not match')
  }
}

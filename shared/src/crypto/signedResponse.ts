// AI-GENERATED — not an architecture reference
import { createHash, createPrivateKey, createPublicKey, KeyObject } from 'node:crypto'
import { createSigner, createVerifier, httpbis } from 'http-message-signatures'
import { DomainError, VoidResult } from '../errorTypes'

/** The Ed25519 key pair a community signs with, as libsodium stores it: privateKey = seed || publicKey. */
export type SigningCommunity = { publicKey: Buffer; privateKey: Buffer | null }

export class InvalidResponseSignatureError extends DomainError {
  constructor(public readonly reason: string) {
    super(`invalid response signature: ${reason}`)
  }
}

// What an RFC 9421 response signature covers. The body is covered through content-digest (RFC 9530).
const COVERED_RESPONSE_FIELDS = ['@status', 'content-type', 'content-digest']
// keyid, alg, created and expires are what signMessage sets by default; a verifier insists on all four
const REQUIRED_SIGNATURE_PARAMS = ['keyid', 'alg', 'created', 'expires']
const MAX_SIGNATURE_AGE_SECONDS = 5 * 60
// how far the clocks of two community servers may drift apart
const CLOCK_TOLERANCE_SECONDS = 30

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
 * keyid is the community public key as hex, the same key the DHT announces.
 * @throws Error if the community has no private key - a home community always has one
 */
export async function signedJsonResponse(
  value: unknown,
  status: number,
  community: SigningCommunity,
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
 * Whether the response was signed by the community with this public key, over this body,
 * within the last MAX_SIGNATURE_AGE_SECONDS.
 */
export async function verifySignedResponse(
  response: { status: number; headers: Headers; body: string },
  publicKey: Buffer,
): Promise<void> {
  // the signature covers the digest header only, the body is bound by comparing it here
  if (response.headers.get('content-digest') !== contentDigest(response.body)) {
    throw new InvalidResponseSignatureError('content-digest does not match the body')
  }
  const keyid = publicKey.toString('hex')
  const verify = createVerifier(ed25519PublicKey(publicKey), 'ed25519')
  const verified = await httpbis.verifyMessage(
    {
      // signatures by any other key count as absent
      keyLookup: async (params) =>
        params.keyid === keyid ? { id: keyid, algs: ['ed25519'], verify } : null,
      requiredFields: COVERED_RESPONSE_FIELDS,
      requiredParams: REQUIRED_SIGNATURE_PARAMS,
      maxAge: MAX_SIGNATURE_AGE_SECONDS,
      tolerance: CLOCK_TOLERANCE_SECONDS,
    },
    { status: response.status, headers: Object.fromEntries(response.headers) },
  )
  if (verified === null) {
    throw new InvalidResponseSignatureError(`no signature by key ${keyid}`)
  }
  if (!verified) {
    throw new InvalidResponseSignatureError('signature does not match')
  }
}

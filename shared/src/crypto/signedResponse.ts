// AI-GENERATED — not an architecture reference
import {
  createHash,
  createPrivateKey,
  createPublicKey,
  KeyObject,
  randomBytes,
  sign,
  verify,
} from 'node:crypto'
import {
  appendSignature,
  component,
  createSignature,
  isSignatureError,
  RequestDescriptor,
  SignatureErrorCode,
  Signer,
  Verifier,
  verifySignature,
} from 'http-message-sig'
import { DomainError } from '../errorTypes'

/** The Ed25519 key pair a community signs with, as libsodium stores it: privateKey = seed || publicKey. */
export type SigningCommunity = { publicKey: Buffer; privateKey: Buffer | null }

/** The request a response answers, as far as its signature covers it. */
export type SignedRequest = { method: string; url: string }

export class InvalidResponseSignatureError extends DomainError {
  constructor(public readonly reason: string) {
    super(`invalid response signature: ${reason}`)
  }
}

// What an RFC 9421 response signature covers. The body is covered through content-digest (RFC 9530).
// Method and path of the request (`;req`) bind the answer to the route it came from: a nonce passed
// on to another signed route of the same community does not make its answer one to this request.
// The path, not the target uri: a proxy in front of the community changes scheme, host and port.
// The verifying side requires the same list; the library compares the components with their
// parameters, `@path` alone does not stand in for `@path;req`.
const COVERED_RESPONSE_COMPONENTS = [
  '@status',
  'content-type',
  'content-digest',
  component('@method', { req: true }),
  component('@path', { req: true }),
]
// The nonce of the request makes a response fresh: it answers this one request and no other.
// No created or expires, so the clocks of the two community servers do not have to agree.
const REQUIRED_SIGNATURE_PARAMS = ['keyid', 'alg', 'nonce']
const ALGORITHM = 'ed25519'

/** 128 random bits as hex, for a request whose response is to be signed, see signatureNonceSchema */
export const createSignatureNonce = (): string => randomBytes(16).toString('hex')

export const contentDigest = (body: string): string =>
  `sha-256=:${createHash('sha256').update(body).digest('base64')}:`

const ed25519PrivateKey = (libsodiumPrivateKey: Buffer): KeyObject =>
  createPrivateKey({
    key: {
      kty: 'OKP',
      crv: 'Ed25519',
      d: libsodiumPrivateKey.subarray(0, 32).toString('base64url'),
      x: libsodiumPrivateKey.subarray(32).toString('base64url'),
    },
    format: 'jwk',
  })

const ed25519PublicKey = (publicKey: Buffer): KeyObject =>
  createPublicKey({
    key: { kty: 'OKP', crv: 'Ed25519', x: publicKey.toString('base64url') },
    format: 'jwk',
  })

// only method and url of the request are covered, its fields are not
const requestDescriptor = ({ method, url }: SignedRequest): RequestDescriptor => ({
  kind: 'request',
  method,
  targetUri: url,
  fields: [],
})

/**
 * Serializes value as JSON and signs the response with the community's Ed25519 key (RFC 9421).
 * keyid is the community public key as hex, the same key the DHT announces; nonce is the one
 * the request brought, as hex; request is the request answered, its method and path are signed too.
 * @throws Error if the community has no private key - a home community always has one
 */
export async function signedJsonResponse(
  value: unknown,
  status: number,
  community: SigningCommunity,
  nonce: string,
  request: SignedRequest,
): Promise<Response> {
  if (!community.privateKey) {
    throw new Error('community has no private key, cannot sign the response')
  }
  const key = ed25519PrivateKey(community.privateKey)
  const signer: Signer = { algorithm: ALGORITHM, sign: (data) => sign(null, data, key) }
  const body = JSON.stringify(value)
  const fields = [
    { name: 'content-type', value: 'application/json' },
    { name: 'content-digest', value: contentDigest(body) },
  ]
  const signature = await createSignature(
    { kind: 'response', status, fields, request: requestDescriptor(request) },
    {
      components: COVERED_RESPONSE_COMPONENTS,
      parameters: { keyid: community.publicKey.toString('hex'), alg: ALGORITHM, nonce },
      signer,
    },
  )
  const headers = appendSignature(
    new Headers(fields.map(({ name, value }): [string, string] => [name, value])),
    signature,
  )
  return new Response(body, { status, headers })
}

/**
 * Resolves if the response was signed by the community with this public key, over this body,
 * as the answer to the request that carried this nonce, with this method and path.
 * @throws InvalidResponseSignatureError if the digest does not match the body, the response is
 *         not signed, the signature is by another key, or the nonce is not the one of the request
 * @throws SignatureError of http-message-sig, as it is, for every other refusal; its code tells
 *         which: VerificationFailed where the signature does not match, PolicyViolation where it
 *         leaves out a required component or parameter, LabelRequired where the response carries
 *         more than one signature, MissingField, MalformedField and LabelMismatch for broken headers
 */
export async function verifySignedResponse(
  response: { status: number; headers: Headers; body: string },
  publicKey: Buffer,
  nonce: string,
  request: SignedRequest,
): Promise<void> {
  // the signature covers the digest header only, the body is bound by comparing it here
  if (response.headers.get('content-digest') !== contentDigest(response.body)) {
    throw new InvalidResponseSignatureError('content-digest does not match the body')
  }
  if (!response.headers.has('signature') && !response.headers.has('signature-input')) {
    throw new InvalidResponseSignatureError('response is not signed')
  }
  const keyid = publicKey.toString('hex')
  const key = ed25519PublicKey(publicKey)
  const verifier: Verifier = {
    algorithm: ALGORITHM,
    verify: (data, signature) => verify(null, data, key, signature),
  }
  try {
    // No label is named: the library verifies the one signature a response carries, and refuses
    // one with more, so a signature by another key beside a valid one refuses the whole response.
    await verifySignature(
      {
        kind: 'response',
        status: response.status,
        fields: [...response.headers].map(([name, value]) => ({ name, value })),
        request: requestDescriptor(request),
      },
      {
        policy: {
          algorithms: [ALGORITHM],
          requiredComponents: COVERED_RESPONSE_COMPONENTS,
          requiredParameters: REQUIRED_SIGNATURE_PARAMS,
          // runs only on a signature that verified
          validate: ({ parameters }) => {
            // a signed answer to another request, replayed
            if (parameters.nonce !== nonce) {
              throw new InvalidResponseSignatureError('nonce is not the one of the request')
            }
          },
        },
        // what the response claims is not trusted yet, only its keyid is compared
        resolveVerifier: ({ parameters }) => {
          if (parameters.keyid !== keyid) {
            throw new InvalidResponseSignatureError(`no signature by key ${keyid}`)
          }
          return verifier
        },
      },
    )
  } catch (error) {
    // the library wraps what resolveVerifier throws, the error of ours is handed on as it was
    throw isSignatureError(error) && error.code === SignatureErrorCode.ResolverFailed
      ? error.cause
      : error
  }
}

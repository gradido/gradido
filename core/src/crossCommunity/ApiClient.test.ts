// AI-GENERATED — not an architecture reference
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { randomBytes } from 'node:crypto'
import { Elysia } from 'elysia'
import { appendSignature } from 'http-message-sig'
import {
  AppContext,
  GradidoUnit,
  InvalidResponseSignatureError,
  signatureNonceSchema,
  signHttpMessage,
  verifyHttpMessage,
} from 'shared'
import { Ed25519KeyPair, hashGenericBase64, X25519KeyPair } from 'shared-native'
import * as v from 'valibot'
import { ApiClient } from './ApiClient'
import { CrossGroupTransaction } from './schema'

// What the client decides, against peers that answer as the routes in apiRoutes.ts are to answer.
// The routes themselves are tested in apiRoutes.test.ts.

// a home community with fresh keys, its row as the dht-node writes it: privateKey = seed || publicKey
const signKeys = Ed25519KeyPair.generate().toBuffer()
const encryptionKeys = X25519KeyPair.generate().toBuffer()
const homeCommunityKeys = {
  publicKey: signKeys.publicKey,
  privateKey: Buffer.concat([signKeys.privateKey as Buffer, signKeys.publicKey]),
  publicEncryptionKey: encryptionKeys.publicKey,
  privateEncryptionKey: encryptionKeys.privateKey,
  communityUuid: '7a2e4c90-1b5d-4f3a-8c6e-0d9b3f2a1e47',
}
const communityPublicKey = signKeys.publicKey
// the community as a peer knows it: its announced public key only
const communityKeyPair = new Ed25519KeyPair(communityPublicKey)
// signHttpMessage signs with the home community of the AppContext, as at server start
beforeAll(() => {
  AppContext.getInstance().setHomeCommunity(homeCommunityKeys)
})

const communityInfo = {
  name: 'Gradido Akademie',
  description: 'Eine Community zum Testen der Signatur',
  creationDate: '2026-01-01T00:00:00.000Z',
  publicKey: communityPublicKey.toString('hex'),
  publicJwtKey: null,
  publicEncryptionKey: encryptionKeys.publicKey.toString('hex'),
  hieroTopicId: null,
}

type Requested = { method: string; url: string }

// a response as a signed route answers: digest over the bytes on the wire, signed with the nonce
async function signedAnswer(
  body: string | Uint8Array,
  contentType: string,
  nonce: string,
  { method, url }: Requested,
  digestOf: string | Uint8Array = body,
): Promise<Response> {
  const fields = [
    { name: 'content-type', value: contentType },
    { name: 'content-digest', value: `blake2b-256=:${hashGenericBase64(digestOf)}:` },
  ]
  const signature = await signHttpMessage(
    {
      kind: 'response',
      status: 200,
      fields,
      request: { kind: 'request', method, targetUri: url, fields: [] },
    },
    nonce,
  )
  return new Response(body as BodyInit, {
    status: 200,
    headers: appendSignature(
      new Headers(fields.map(({ name, value }): [string, string] => [name, value])),
      signature,
    ),
  })
}

// answers on the path of the peer api, with the exchangeId and the nonce of the signature set to
// what the request brought; answerExchangeId and answerRequest decide otherwise
const peerAnswering = (
  answerExchangeId: (requested: string) => string = (requested) => requested,
  answerRequest: (request: Request) => Requested = (request) => request,
) =>
  new Elysia()
    .get(
      'peer-api/v1/communityInfos',
      ({ query, request }) => {
        const exchangeId = answerExchangeId(query.exchangeId)
        return signedAnswer(
          JSON.stringify({ ...communityInfo, exchangeId }),
          'application/json',
          exchangeId,
          answerRequest(request),
        )
      },
      { query: v.object({ exchangeId: signatureNonceSchema }) },
    )
    .listen(0)

const honestPeer = peerAnswering()
// signs as the answer of another of its routes
const otherRoutePeer = peerAnswering(undefined, (request) => ({
  method: request.method,
  url: request.url.replace('communityInfos', 'other'),
}))
// answers nothing signed at all
const unsignedPeer = new Elysia().get('peer-api/v1/communityInfos', () => communityInfo).listen(0)
// accepts the request and never answers
const silentPeer = new Elysia()
  .get(
    'peer-api/v1/communityInfos',
    () =>
      new Promise<never>(() => {
        // never resolved
      }),
  )
  .listen(0)
afterAll(() => {
  honestPeer.stop()
  otherRoutePeer.stop()
  unsignedPeer.stop()
  // the request of the timeout test is still open
  silentPeer.stop(true)
})
const urlOf = (peer: Pick<Elysia, 'server'>) => `http://localhost:${peer.server?.port}/`

describe('ApiClient.getCommunityInfos', () => {
  const exchangeId = randomBytes(16).toString('hex')

  it('hands out the answer signed by the announced key for this request', async () => {
    const { data, error } = await new ApiClient(
      urlOf(honestPeer),
      communityKeyPair,
    ).getCommunityInfos(exchangeId)
    expect(error).toBeNull()
    // Eden reads an ISO date string as Date
    expect(data as unknown).toMatchObject({
      ...communityInfo,
      creationDate: new Date(communityInfo.creationDate),
    })
  })

  it('refuses the answer under another announced key', async () => {
    const { data, error } = await new ApiClient(
      urlOf(honestPeer),
      new Ed25519KeyPair(Ed25519KeyPair.generate().publicKeyToBuffer()),
    ).getCommunityInfos(exchangeId)
    expect(data).toBeNull()
    expect(error?.value).toBeInstanceOf(InvalidResponseSignatureError)
  })

  it('refuses a signed answer of another route', async () => {
    const { data, error } = await new ApiClient(
      urlOf(otherRoutePeer),
      communityKeyPair,
    ).getCommunityInfos(exchangeId)
    expect(data).toBeNull()
    // a SignatureError of http-message-sig, handed on as it is
    expect((error?.value as { code?: string } | undefined)?.code).toBe('VerificationFailed')
  })

  it('refuses an answer that is not signed', async () => {
    const { data, error } = await new ApiClient(
      urlOf(unsignedPeer),
      communityKeyPair,
    ).getCommunityInfos(exchangeId)
    expect(data).toBeNull()
    expect(error).not.toBeNull()
  })

  it('gives up a community that does not answer in time', async () => {
    const started = performance.now()
    const { data, error } = await new ApiClient(
      urlOf(silentPeer),
      communityKeyPair,
      undefined,
      50,
    ).getCommunityInfos(exchangeId)
    expect(data).toBeNull()
    expect((error?.value as DOMException | undefined)?.name).toBe('TimeoutError')
    expect(performance.now() - started).toBeLessThan(1000)
  })
})

describe('ApiClient.emailTransactionReceived', () => {
  // the recipient community: its key pair decrypts, the client knows the public key only
  const recipientKeys = X25519KeyPair.generate().toBuffer()
  const recipientKeyPair = new X25519KeyPair(
    recipientKeys.publicKey,
    recipientKeys.privateKey as Buffer,
  )
  const homePublicOnly = new X25519KeyPair(encryptionKeys.publicKey)
  const tx: CrossGroupTransaction = {
    sender: {
      alias: 'bibi',
      gradidoId: '4f9c1b2e-6d3a-4e8f-9b1c-2a7d5e0f3c61',
      communityUuid: '7a2e4c90-1b5d-4f3a-8c6e-0d9b3f2a1e47',
    },
    recipient: {
      communityUuid: '1c8d7e6f-5a4b-4c3d-9e2f-1a0b9c8d7e6f',
      identifier: 'peter',
    },
    balanceDate: new Date('2026-10-30T10:00:00.000Z'),
    amount: GradidoUnit.fromString('12.5'),
    memo: 'Danke für deine Hilfe',
  }

  // what the route answers next
  let answer: (request: Request) => Response | Promise<Response>
  const nonceOf = (request: Request) =>
    /;nonce="([^"]+)"/.exec(request.headers.get('signature-input') ?? '')?.[1] ?? ''
  const signedOk = (request: Request) =>
    signedAnswer('"OK"', 'application/json', nonceOf(request), request)
  // takes the request as it came over the wire, as a peer that knows nothing but the wire does
  let received: { request: Request; body: Uint8Array } | undefined
  const peer = new Elysia()
    .post(
      'peer-api/v1/emailTransactionReceived',
      async ({ request, body }) => {
        received = { request, body: new Uint8Array(body as ArrayBuffer) }
        return answer(request)
      },
      { parse: 'arrayBuffer' },
    )
    .listen(0)
  afterAll(() => {
    peer.stop()
  })
  const client = () => {
    received = undefined
    return new ApiClient(urlOf(peer), communityKeyPair, new X25519KeyPair(recipientKeys.publicKey))
  }

  it('sends the transaction encrypted for the recipient and signed by the home community', async () => {
    answer = signedOk
    const { error, status } = await client().emailTransactionReceived(tx)
    expect(error).toBeNull()
    expect(status).toBe(200)

    const { request, body } = received!
    expect(request.headers.get('content-type')).toBe('application/octet-stream')
    expect(request.headers.get('content-digest')).toBe(`blake2b-256=:${hashGenericBase64(body)}:`)
    expect(Buffer.from(body).includes(tx.memo)).toBe(false)
    const fields = [...request.headers].map(([name, value]) => ({ name, value }))
    expect(
      await verifyHttpMessage({
        kind: 'request',
        method: request.method,
        targetUri: request.url,
        fields,
      }),
    ).toMatchObject({ keyId: communityPublicKey.toString('hex') })

    const plaintext = recipientKeyPair.decrypt(body, homePublicOnly)
    expect(plaintext.success).toBe(true)
    if (plaintext.success) {
      expect(JSON.parse(plaintext.value)).toEqual({
        sender: tx.sender,
        recipient: tx.recipient,
        balanceDate: '2026-10-30T10:00:00.000Z',
        amount: '12.5',
        memo: tx.memo,
      })
    }
  })

  it('hands out the answer signed for this request', async () => {
    answer = signedOk
    const { data, error } = await client().emailTransactionReceived(tx)
    expect(error).toBeNull()
    expect(data as unknown).toBe('OK')
  })

  it('refuses an answer that is not signed', async () => {
    answer = () => new Response('OK')
    const { data, error } = await client().emailTransactionReceived(tx)
    expect(data).toBeNull()
    expect((error?.value as { code?: string } | undefined)?.code).toBe('MissingField')
  })

  it('refuses a signed answer to another request', async () => {
    answer = (request) => signedAnswer('"OK"', 'application/json', 'e'.repeat(32), request)
    const { data, error } = await client().emailTransactionReceived(tx)
    expect(data).toBeNull()
    expect(error?.value).toBeInstanceOf(InvalidResponseSignatureError)
    expect(String(error?.value)).toContain('nonce is not the one of the request')
  })

  it('refuses a signed answer whose body is not the one the signature covers', async () => {
    answer = (request) =>
      signedAnswer('"OK"', 'application/json', nonceOf(request), request, '"Not OK"')
    const { data, error } = await client().emailTransactionReceived(tx)
    expect(data).toBeNull()
    expect(error?.value).toBeInstanceOf(InvalidResponseSignatureError)
  })

  it('passes an error answer as it is', async () => {
    answer = () => new Response('', { status: 404 })
    const { data, error } = await client().emailTransactionReceived(tx)
    expect(data).toBeNull()
    expect(error?.status).toBe(404)
  })

  it('sends nothing without the encryption key of the recipient', async () => {
    received = undefined
    const { data, error } = await new ApiClient(
      urlOf(peer),
      communityKeyPair,
    ).emailTransactionReceived(tx)
    expect(data).toBeNull()
    expect(String(error?.value)).toContain('missing public encryption key')
    expect(received).toBeUndefined()
  })
})

// no route answers verified and decrypted yet, so this is the step itself
describe('ApiClient.postprocessResponse', () => {
  const recipientKeys = X25519KeyPair.generate().toBuffer()
  const recipientKeyPair = new X25519KeyPair(
    recipientKeys.publicKey,
    recipientKeys.privateKey as Buffer,
  )
  const homePublicOnly = new X25519KeyPair(encryptionKeys.publicKey)
  class Client extends ApiClient {
    public post(response: Response, request: Request, nonce?: string, decrypt = false) {
      return this.postprocessResponse(response, request, nonce, decrypt)
    }
  }
  const client = () => {
    return new Client('http://peer/', communityKeyPair, new X25519KeyPair(recipientKeys.publicKey))
  }
  const request = new Request('http://peer/peer-api/v1/route', { method: 'POST' })
  const nonce = 'c'.repeat(32)
  const box = () => new Uint8Array(recipientKeyPair.encrypt('{"ok":true}', homePublicOnly))

  it('hands out the decrypted body as JSON', async () => {
    const answer = await signedAnswer(box(), 'application/octet-stream', nonce, request)
    const response = await client().post(answer, request, nonce, true)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/json')
    expect(await response.json()).toEqual({ ok: true })
  })

  it('hands out a body that is not encrypted as it came', async () => {
    const answer = await signedAnswer('{"ok":true}', 'application/json', nonce, request)
    const response = await client().post(answer, request, nonce)
    expect(await response.json()).toEqual({ ok: true })
  })

  it('refuses a body whose digest does not match', async () => {
    const answer = await signedAnswer(box(), 'application/octet-stream', nonce, request, box())
    await expect(client().post(answer, request, nonce, true)).rejects.toBeInstanceOf(
      InvalidResponseSignatureError,
    )
  })

  it('refuses another nonce', async () => {
    const answer = await signedAnswer(box(), 'application/octet-stream', 'd'.repeat(32), request)
    await expect(client().post(answer, request, nonce, true)).rejects.toThrow(
      'nonce is not the one of the request',
    )
  })

  it('refuses a signature by another key than the announced one', async () => {
    const answer = await signedAnswer(box(), 'application/octet-stream', nonce, request)
    const other = new Client(
      'http://peer/',
      Ed25519KeyPair.generate(),
      new X25519KeyPair(recipientKeys.publicKey),
    )
    await expect(other.post(answer, request, nonce, true)).rejects.toThrow('Wrong signer')
  })

  it('fails for a box it cannot decrypt', async () => {
    const empty = new Uint8Array(3)
    const answer = await signedAnswer(empty, 'application/octet-stream', nonce, request)
    await expect(client().post(answer, request, nonce, true)).rejects.toBeInstanceOf(Error)
  })
})

// AI-GENERATED — not an architecture reference
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { treaty } from '@elysia/eden'
import { Elysia } from 'elysia'
import {
  AppContext,
  createSignatureNonce,
  InvalidResponseSignatureError,
  signatureNonceSchema,
  signedJsonResponse,
} from 'shared'
import { Ed25519KeyPair, X25519KeyPair } from 'shared-native'
import * as v from 'valibot'
import { statusNumber } from '../server/utils'
import { PeerApiClient } from './PeerApiClient'

// a home community with fresh keys, its row as the dht-node writes it: privateKey = seed || publicKey
const signKeys = Ed25519KeyPair.generate().toBuffer()
const encryptionKeys = X25519KeyPair.generate().toBuffer()
const homeCommunityKeys = {
  publicKey: signKeys.publicKey,
  privateKey: Buffer.concat([signKeys.privateKey as Buffer, signKeys.publicKey]),
  publicEncryptionKey: encryptionKeys.publicKey,
  privateEncryptionKey: encryptionKeys.privateKey,
}
const communityPublicKey = signKeys.publicKey
// the community as a peer knows it: its announced public key only
const communityKeyPair = new Ed25519KeyPair(communityPublicKey)
// signedJsonResponse signs with the home community of the AppContext, as at server start
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

// answers on the path of the peer api and signs like the public routes in peerApi.ts;
// answerNonce decides which nonce goes into the signature, answerRequest which request
const peerAnswering = (
  answerNonce: (requestNonce: string) => string,
  answerRequest: (request: Request) => { method: string; url: string } = (request) => request,
) =>
  new Elysia()
    .get('peer-api/v1/communityInfos', () => communityInfo, {
      query: v.object({ nonce: signatureNonceSchema }),
      mapResponse: async ({ responseValue, set, query, request }) =>
        signedJsonResponse(
          responseValue,
          statusNumber(set.status),
          answerNonce(query.nonce),
          answerRequest(request),
        ),
    })
    .listen(0)

const honestPeer = peerAnswering((requestNonce) => requestNonce)
// signs every answer with one and the same nonce, as an answer captured once and replayed carries it
const capturedNonce = createSignatureNonce()
const replayingPeer = peerAnswering(() => capturedNonce)
// signs as the answer of another of its routes, as when the nonce was passed on to that one
const otherRoutePeer = peerAnswering(
  (requestNonce) => requestNonce,
  (request) => ({ method: request.method, url: request.url.replace('communityInfos', 'other') }),
)
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
  replayingPeer.stop()
  otherRoutePeer.stop()
  // the request of the timeout test is still open
  silentPeer.stop(true)
})
const urlOf = (peer: Pick<Elysia, 'server'>) => `http://localhost:${peer.server?.port}/`

describe('PeerApiClient.getCommunityInfos', () => {
  it('hands out the answer signed by the announced key for this request', async () => {
    const { data, error } = await new PeerApiClient(
      urlOf(honestPeer),
      communityKeyPair,
    ).getCommunityInfos()
    expect(error).toBeNull()
    // Eden reads an ISO date string as Date
    expect(data).toEqual({ ...communityInfo, creationDate: new Date(communityInfo.creationDate) })
  })

  it('refuses the answer under another announced key', async () => {
    const { data, error } = await new PeerApiClient(
      urlOf(honestPeer),
      new Ed25519KeyPair(Ed25519KeyPair.generate().publicKeyToBuffer()),
    ).getCommunityInfos()
    expect(data).toBeNull()
    expect(error?.value).toBeInstanceOf(InvalidResponseSignatureError)
  })

  it('refuses a signed answer to another request', async () => {
    const { data, error } = await new PeerApiClient(
      urlOf(replayingPeer),
      communityKeyPair,
    ).getCommunityInfos()
    expect(data).toBeNull()
    expect(error?.value).toBeInstanceOf(InvalidResponseSignatureError)
    expect(String(error?.value)).toContain('nonce is not the one of the request')
  })

  it('refuses a signed answer of another route', async () => {
    const { data, error } = await new PeerApiClient(
      urlOf(otherRoutePeer),
      communityKeyPair,
    ).getCommunityInfos()
    expect(data).toBeNull()
    // a SignatureError of http-message-sig, handed on as it is
    expect((error?.value as { code?: string } | undefined)?.code).toBe('VerificationFailed')
  })

  it('gives up a community that does not answer in time', async () => {
    const started = performance.now()
    const { data, error } = await new PeerApiClient(
      urlOf(silentPeer),
      communityKeyPair,
      50,
    ).getCommunityInfos()
    expect(data).toBeNull()
    expect((error?.value as DOMException | undefined)?.name).toBe('TimeoutError')
    expect(performance.now() - started).toBeLessThan(1000)
  })
})

describe('a signed route', () => {
  const route = <T>(answer: () => T) =>
    new Elysia().get('info', answer, {
      query: v.object({ nonce: signatureNonceSchema }),
      response: v.object({ name: v.string() }),
      mapResponse: async ({ responseValue, set, query, request }) =>
        signedJsonResponse(responseValue, statusNumber(set.status), query.nonce, request),
    })
  const nonce = createSignatureNonce()

  it('leaves the answer typed for the Eden client', async () => {
    const { data, status } = await treaty(route(() => ({ name: 'Gradido Akademie' }))).info.get({
      query: { nonce },
    })
    expect(status).toBe(200)
    expect(data).toEqual({ name: 'Gradido Akademie' })
  })

  it('signs only what passed the response schema', async () => {
    const invalid = route(() => ({ name: 1 }) as unknown as { name: string })
    const response = await invalid.handle(new Request(`http://localhost/info?nonce=${nonce}`))
    expect(response.status).toBe(422)
    expect(response.headers.get('signature')).toBeNull()
  })

  it('answers nothing signed to a request without a valid nonce', async () => {
    const app = route(() => ({ name: 'Gradido Akademie' }))
    for (const query of ['', '?nonce=abc', `?nonce=${nonce}00`]) {
      const response = await app.handle(new Request(`http://localhost/info${query}`))
      expect(response.status).toBe(422)
      expect(response.headers.get('signature')).toBeNull()
    }
  })
})

describe('statusNumber', () => {
  it('reads a status name as its code, and no status as 200', () => {
    expect(statusNumber('Created')).toBe(201)
    expect(statusNumber(404)).toBe(404)
    expect(statusNumber(undefined)).toBe(200)
  })
})

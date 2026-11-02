// AI-GENERATED — not an architecture reference
import { afterAll, afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import * as database from 'database'
import { Elysia } from 'elysia'
import { appendSignature, createSignature } from 'http-message-sig'
import { AppContext, createKeyPair, GradidoUnit, verifyHttpMessage } from 'shared'
import { Ed25519KeyPair, hashGenericBase64, X25519KeyPair } from 'shared-native'
import * as v from 'valibot'
import * as emails from '../emails'
import { ApiClient } from './ApiClient'
import { apiRoutes } from './apiRoutes'
import { CrossGroupTransaction, crossGroupTransactionWireSchema } from './schema'

// The routes as they are, only the database and the mail server faked.
// ⛔ spyOn, not mock.module: Bun cannot restore a module mock and core runs without --isolate.

const communityKeys = (communityUuid: string) => {
  const sign = Ed25519KeyPair.generate().toBuffer()
  const encryption = X25519KeyPair.generate().toBuffer()
  return {
    publicKey: sign.publicKey,
    privateKey: Buffer.concat([sign.privateKey as Buffer, sign.publicKey]),
    publicEncryptionKey: encryption.publicKey,
    privateEncryptionKey: encryption.privateKey,
    communityUuid,
  }
}
const home = communityKeys('1c8d7e6f-5a4b-4c3d-9e2f-1a0b9c8d7e6f')
const sender = communityKeys('7a2e4c90-1b5d-4f3a-8c6e-0d9b3f2a1e47')
// a community we know as well, with keys of its own
const otherKnown = communityKeys('3e1f0a9b-8c7d-4e6f-a5b4-c3d2e1f0a9b8')
// known, but it never went through the authentication
const notAuthenticated = communityKeys('2d0e9f8a-7b6c-4d5e-b4a3-f2e1d0c9b8a7')
// generated on the spot, by someone we have never heard of
const stranger = communityKeys('9b8a7f6e-5d4c-4b3a-8291-0f1e2d3c4b5a')

const homeRow = {
  ...home,
  name: 'Gradido Akademie',
  description: 'Die Community, die hier antwortet',
  creationDate: new Date('2024-05-06T07:08:09.123Z'),
  publicJwtKey: (await createKeyPair()).publicKey,
  hieroTopicId: null,
}
const foreignRow = (keys: typeof sender) => ({
  ...keys,
  url: 'http://peer.example/api/',
  authenticatedAt: new Date(),
  foreign: true,
})

const tx: CrossGroupTransaction = {
  sender: {
    alias: 'bibi',
    gradidoId: '4f9c1b2e-6d3a-4e8f-9b1c-2a7d5e0f3c61',
    communityUuid: sender.communityUuid,
  },
  recipient: { communityUuid: home.communityUuid, identifier: 'peter' },
  balanceDate: new Date('2026-10-30T10:00:00.000Z'),
  amount: GradidoUnit.fromString('12.5'),
  memo: 'Danke für deine Hilfe',
}
const wire = (value = tx) => JSON.stringify(v.parse(crossGroupTransactionWireSchema, value))
// over a real server: apiRoutes.handle answers a route of a plugin with 404
const server = new Elysia().use(apiRoutes).listen(0)
afterAll(() => {
  server.stop()
})
const baseUrl = `http://localhost:${server.server?.port}`
const url = `${baseUrl}/peer-api/v1/emailTransactionReceived`

class SealingClient extends ApiClient {
  public async seal(body: string) {
    const headers = new Headers({ 'content-type': 'application/json' })
    const prepared = await this.preprocessRequest(url, 'POST', headers, 'a'.repeat(32), body, true)
    return new Request(url, { method: 'POST', ...prepared })
  }
}

// encrypts and signs as the given community for us, as its client does
async function sendSealed(from: typeof sender, body = wire()) {
  AppContext.getInstance().setHomeCommunity(from)
  const client = new SealingClient(url, new Ed25519KeyPair(home.publicKey))
  client.publicEncryptionKey = new X25519KeyPair(home.publicEncryptionKey)
  const request = await client.seal(body)
  AppContext.getInstance().setHomeCommunity(home)
  return request
}

// the body in the clear, signed by signedBy, the signature naming the key of claims
async function signedPlain(signedBy: typeof sender, claims = signedBy, body = wire()) {
  const key = new Ed25519KeyPair(signedBy.publicKey, signedBy.privateKey.subarray(0, 32))
  const headers = new Headers({
    'content-type': 'application/json',
    'content-digest': `blake2b-256=:${hashGenericBase64(body)}:`,
  })
  const signature = await createSignature(
    {
      kind: 'request',
      method: 'POST',
      targetUri: url,
      fields: [...headers].map(([name, value]) => ({ name, value })),
    },
    {
      components: ['@method', '@path', 'content-digest', 'content-type'],
      parameters: {
        keyid: claims.publicKey.toString('base64'),
        alg: 'ed25519',
        created: Math.floor(Date.now() / 1000),
        nonce: 'a'.repeat(32),
      },
      signer: { algorithm: 'ed25519', sign: (data) => key.sign(data) },
    },
  )
  return new Request(url, { method: 'POST', headers: appendSignature(headers, signature), body })
}

let spies: { mockRestore: () => void }[] = []
let sendEmail: ReturnType<typeof spyOn<typeof emails, 'sendTransactionReceivedEmail'>>
let userContactSpy: ReturnType<typeof spyOn<typeof database, 'dbFindUserContact'>>
let userSpy: ReturnType<typeof spyOn<typeof database, 'dbFindUserByIdentifier'>>
let homeRowSpy: ReturnType<typeof spyOn<typeof database, 'getHomeCommunityDrizzle'>>

beforeEach(() => {
  AppContext.getInstance().setHomeCommunity(home)
  homeRowSpy = spyOn(database, 'getHomeCommunityDrizzle').mockResolvedValue(homeRow as never)
  sendEmail = spyOn(emails, 'sendTransactionReceivedEmail').mockResolvedValue({} as never)
  userSpy = spyOn(database, 'dbFindUserByIdentifier').mockResolvedValue({
    id: 1,
    emailId: 5,
    transfersInChat: true,
    firstName: 'Peter',
    lastName: 'Lustig',
    language: 'de',
  } as never)
  userContactSpy = spyOn(database, 'dbFindUserContact').mockResolvedValue({
    email: 'peter@example.org',
  } as never)
  spies = [
    homeRowSpy,
    sendEmail,
    userSpy,
    userContactSpy,
    spyOn(database, 'dbFindForeignCommunityByPublicKey').mockImplementation(async (publicKey) => {
      if (notAuthenticated.publicKey.equals(publicKey)) {
        return { ...foreignRow(notAuthenticated), authenticatedAt: null } as never
      }
      const known = [sender, otherKnown].find((keys) => keys.publicKey.equals(publicKey))
      return (known ? foreignRow(known) : null) as never
    }),
  ]
})
afterEach(() => {
  for (const spy of spies) {
    spy.mockRestore()
  }
})

describe('GET peer-api/v1/communityInfos', () => {
  const infoUrl = `${baseUrl}/peer-api/v1/communityInfos`
  const exchangeId = 'b'.repeat(32)

  it('answers a peer that expects its key', async () => {
    const { data, error } = await new ApiClient(
      `${baseUrl}/`,
      new Ed25519KeyPair(home.publicKey),
    ).getCommunityInfos(exchangeId)
    expect(error).toBeNull()
    expect((data as { publicKey?: string } | null)?.publicKey).toBe(home.publicKey.toString('hex'))
  })

  it('is refused by a peer that expects another key', async () => {
    const { data, error } = await new ApiClient(
      `${baseUrl}/`,
      Ed25519KeyPair.generate(),
    ).getCommunityInfos(exchangeId)
    expect(data).toBeNull()
    expect(error).not.toBeNull()
  })

  it('signs digest and content type of the answer, with the exchangeId of the request', async () => {
    const target = `${infoUrl}?exchangeId=${exchangeId}`
    const response = await fetch(target)
    const body = await response.text()
    expect(response.status).toBe(200)
    expect(JSON.parse(body).exchangeId).toBe(exchangeId)
    expect(response.headers.get('content-digest')).toBe(`blake2b-256=:${hashGenericBase64(body)}:`)
    expect(response.headers.get('content-type')).toStartWith('application/json')
    const fields = [...response.headers].map(([name, value]) => ({ name, value }))
    expect(
      await verifyHttpMessage(
        {
          kind: 'response',
          status: response.status,
          fields,
          request: { kind: 'request', method: 'GET', targetUri: target, fields: [] },
        },
        exchangeId,
      ),
    ).toBe(home.publicKey.toString('hex'))
  })

  it('answers nothing signed to a request without a valid exchangeId', async () => {
    for (const query of ['', '?exchangeId=abc', `?exchangeId=${exchangeId}00`]) {
      const response = await fetch(`${infoUrl}${query}`)
      expect(response.status).toBe(422)
      expect(response.headers.get('signature')).toBeNull()
    }
  })

  it('signs only what passed the response schema', async () => {
    homeRowSpy.mockResolvedValue({ ...homeRow, name: 1 } as never)
    const response = await fetch(`${infoUrl}?exchangeId=${exchangeId}`)
    expect(response.ok).toBe(false)
    expect(response.headers.get('signature')).toBeNull()
  })
})

describe('POST peer-api/v1/emailTransactionReceived', () => {
  it('sends the mail for a request sealed by the community it names', async () => {
    const response = await fetch(await sendSealed(sender))
    expect(response.status).toBe(200)
    expect(sendEmail).toHaveBeenCalledTimes(1)
    const mail = sendEmail.mock.calls[0][0]
    expect(mail).toMatchObject({
      senderAlias: 'bibi',
      email: 'peter@example.org',
      memo: tx.memo,
    })
    expect(mail.transactionAmount.toString()).toBe(tx.amount.toString())
  })

  it('reaches the client as a success', async () => {
    const client = new ApiClient(`${baseUrl}/`, new Ed25519KeyPair(home.publicKey))
    client.publicEncryptionKey = new X25519KeyPair(home.publicEncryptionKey)
    // client and server share this process, each of them is its own home community while it works
    const realFetch = globalThis.fetch
    const fetchSpy = spyOn(globalThis, 'fetch').mockImplementation((async (request: Request) => {
      AppContext.getInstance().setHomeCommunity(home)
      const response = await realFetch(request)
      AppContext.getInstance().setHomeCommunity(sender)
      return response
    }) as never)
    spies.push(fetchSpy)
    AppContext.getInstance().setHomeCommunity(sender)
    const { error, status } = await client.emailTransactionReceived(tx)
    expect(error).toBeNull()
    expect(status).toBe(200)
    expect(sendEmail).toHaveBeenCalledTimes(1)
  })

  it('sends no mail to a user who switched it off, and answers OK', async () => {
    userSpy.mockResolvedValue({ id: 1, emailId: 5, transfersInChat: false } as never)
    const response = await fetch(await sendSealed(sender))
    expect(response.status).toBe(200)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('answers 404 for a recipient that does not exist', async () => {
    userSpy.mockResolvedValue(null as never)
    const response = await fetch(await sendSealed(sender))
    expect(response.status).toBe(404)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('answers 404 for a recipient without contact', async () => {
    userContactSpy.mockResolvedValue(null as never)
    const response = await fetch(await sendSealed(sender))
    expect(response.status).toBe(404)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  // the keyid of a request is what its sender claims, it proves nothing until a known key signed
  it('answers 401 to a body encrypted and signed with a key of its own', async () => {
    const response = await fetch(await sendSealed(stranger))
    expect(response.status).toBe(401)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('answers 401 to a signature that claims the key of a known community', async () => {
    const response = await fetch(await signedPlain(stranger, sender))
    expect(response.status).toBe(401)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('answers 415 to a known community that does not encrypt', async () => {
    const response = await fetch(await signedPlain(sender))
    expect(response.status).toBe(415)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('answers 401 to a body the signature does not cover', async () => {
    const signed = await sendSealed(sender)
    const other = await sendSealed(sender, wire({ ...tx, memo: 'Danke für alles andere' }))
    const response = await fetch(
      new Request(url, {
        method: 'POST',
        headers: signed.headers,
        body: await other.arrayBuffer(),
      }),
    )
    expect(response.status).toBe(401)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('answers 401 to a known community that sends in the name of another one', async () => {
    const response = await fetch(await sendSealed(otherKnown))
    expect(response.status).toBe(401)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('answers 401 to a community that is not authenticated', async () => {
    const response = await fetch(await sendSealed(notAuthenticated))
    expect(response.status).toBe(401)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('answers 400 to a body altered on the way', async () => {
    const request = await sendSealed(sender)
    const box = new Uint8Array(await request.arrayBuffer())
    box[box.length - 1] ^= 1
    const response = await fetch(
      new Request(url, { method: 'POST', headers: request.headers, body: box }),
    )
    expect(response.status).toBe(400)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('answers 400 to a sealed body that is no JSON', async () => {
    const response = await fetch(await sendSealed(sender, 'no json'))
    expect(response.status).toBe(400)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('refuses a sealed body that is no transaction', async () => {
    const response = await fetch(await sendSealed(sender, '{"memo":"Danke"}'))
    expect(response.status).toBe(422)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('answers 401 to a request that is not signed', async () => {
    const response = await fetch(
      new Request(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: wire(),
      }),
    )
    expect(response.status).toBe(401)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('answers 401 to a request that only names a known key, whatever its content type', async () => {
    const signatureInput = `sig1=("@method" "@path");keyid="${sender.publicKey.toString('base64')}";alg="ed25519";created=${Math.floor(Date.now() / 1000)};nonce="n"`
    const form = new URLSearchParams({ memo: 'Danke' }).toString()
    for (const [contentType, body] of [
      [undefined, new TextEncoder().encode(wire())],
      ['text/plain', wire()],
      ['application/x-www-form-urlencoded', form],
      ['application/json; charset=utf-8', wire()],
      ['application/octet-stream', wire()],
    ] as const) {
      const headers = new Headers({ 'signature-input': signatureInput, signature: 'sig1=:AAAA:' })
      if (contentType) {
        headers.set('content-type', contentType)
      }
      const response = await fetch(url, { method: 'POST', headers, body })
      expect(response.status).toBe(401)
    }
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('refuses a transaction for another community', async () => {
    const forOther = {
      ...tx,
      recipient: { ...tx.recipient, communityUuid: otherKnown.communityUuid },
    }
    const response = await fetch(await sendSealed(sender, wire(forOther)))
    expect(response.status).toBe(401)
    expect(sendEmail).not.toHaveBeenCalled()
  })
})

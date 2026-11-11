// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import * as database from 'database'
import { Elysia } from 'elysia'
import { appendSignature, createSignature } from 'http-message-sig'
import {
  AppContext,
  createKeyPair,
  GradidoUnit,
  RECIPIENT_NOT_FOUND,
  verifyHttpMessage,
} from 'shared'
import { Ed25519KeyPair, hashGenericBase64, X25519KeyPair } from 'shared-native'
import * as v from 'valibot'
import * as apis from '../apis'
import { CONFIG } from '../config'
import * as emails from '../emails'
import * as mails from '../emails/sendEmailVariants'
import * as logic from '../logic'
import * as chatMessageLogic from '../logic/ChatMessage.logic'
import { ApiClient } from './ApiClient'
import { apiRoutes } from './apiRoutes'
import { CrossGroupTransaction, crossGroupTransactionWireSchema } from './schema'
import { processXComCompleteTransaction } from './transferCoins'
import * as senderSide from './transferCoins/senderSide'

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
// apiRoutes is a plugin: mounted in an app, handle answers as the server would, no socket in between
const app = new Elysia().use(apiRoutes)
const baseUrl = 'http://home'
const url = `${baseUrl}/peer-api/v1/emailTransactionReceived`

class SealingClient extends ApiClient {
  public async seal(body: string, target = url) {
    const headers = new Headers({ 'content-type': 'application/json' })
    const prepared = await this.preprocessRequest(
      target,
      'POST',
      headers,
      'a'.repeat(32),
      body,
      true,
    )
    return new Request(target, { method: 'POST', ...prepared })
  }
}

// encrypts and signs as the given community for us, as its client does
async function sendSealed(from: typeof sender, body = wire(), target = url) {
  AppContext.getInstance().setHomeCommunity(from)
  const client = new SealingClient(url, new Ed25519KeyPair(home.publicKey))
  client.publicEncryptionKey = new X25519KeyPair(home.publicEncryptionKey)
  const request = await client.seal(body, target)
  AppContext.getInstance().setHomeCommunity(home)
  return request
}

// the body in the clear, signed by signedBy, the signature naming the key of claims
async function signedPlain(
  signedBy: typeof sender,
  claims = signedBy,
  body = wire(),
  withNonce = true,
) {
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
        keyid: claims.publicKey.toString('hex'),
        alg: 'ed25519',
        created: Math.floor(Date.now() / 1000),
        ...(withNonce ? { nonce: 'a'.repeat(32) } : {}),
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
let fetchSpy: ReturnType<typeof spyOn<typeof globalThis, 'fetch'>>

beforeEach(() => {
  AppContext.getInstance().setHomeCommunity(home)
  homeRowSpy = spyOn(database, 'getHomeCommunityDrizzle').mockResolvedValue(homeRow as never)
  // the client's fetch goes to the app as well
  fetchSpy = spyOn(globalThis, 'fetch').mockImplementation(((request: Request) =>
    app.handle(request)) as never)
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
    fetchSpy,
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

  it('signs digest and content type of the answer, which carries the exchangeId', async () => {
    const target = `${infoUrl}?exchangeId=${exchangeId}`
    const response = await app.handle(new Request(target))
    const body = await response.text()
    expect(response.status).toBe(200)
    expect(JSON.parse(body).exchangeId).toBe(exchangeId)
    expect(response.headers.get('content-digest')).toBe(`blake2b-256=:${hashGenericBase64(body)}:`)
    expect(response.headers.get('content-type')).toStartWith('application/json')
    const fields = [...response.headers].map(([name, value]) => ({ name, value }))
    expect(
      await verifyHttpMessage({
        kind: 'response',
        status: response.status,
        fields,
        request: { kind: 'request', method: 'GET', targetUri: target, fields: [] },
      }),
    ).toMatchObject({ keyId: home.publicKey.toString('hex') })
  })

  it('answers nothing signed to a request without a valid exchangeId', async () => {
    for (const query of ['', '?exchangeId=abc', `?exchangeId=${exchangeId}00`]) {
      const response = await app.handle(new Request(`${infoUrl}${query}`))
      expect(response.status).toBe(422)
      expect(response.headers.get('signature')).toBeNull()
    }
  })

  it('signs only what passed the response schema', async () => {
    homeRowSpy.mockResolvedValue({ ...homeRow, name: 1 } as never)
    const response = await app.handle(new Request(`${infoUrl}?exchangeId=${exchangeId}`))
    expect(response.ok).toBe(false)
    expect(response.headers.get('signature')).toBeNull()
  })
})

describe('POST peer-api/v1/emailTransactionReceived', () => {
  it('sends the mail for a request sealed by the community it names', async () => {
    const response = await app.handle(await sendSealed(sender))
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

  it('signs the answer for the sender, with the nonce of its request', async () => {
    const request = await sendSealed(sender)
    const target = request.url
    const response = await app.handle(request)
    const body = await response.text()
    expect(response.status).toBe(200)
    expect(response.headers.get('content-digest')).toBe(`blake2b-256=:${hashGenericBase64(body)}:`)
    expect(
      await verifyHttpMessage(
        {
          kind: 'response',
          status: 200,
          fields: [...response.headers].map(([name, value]) => ({ name, value })),
          request: { kind: 'request', method: 'POST', targetUri: target, fields: [] },
        },
        'a'.repeat(32),
      ),
    ).toMatchObject({ keyId: home.publicKey.toString('hex') })
  })

  it('answers an error with its status, and without signature', async () => {
    userSpy.mockResolvedValue(null as never)
    const response = await app.handle(await sendSealed(sender))
    expect(response.status).toBe(404)
    expect(response.headers.get('signature')).toBeNull()
  })

  it('answers 401 to a signature without nonce', async () => {
    const response = await app.handle(await signedPlain(sender, sender, wire(), false))
    expect(response.status).toBe(401)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('reaches the client as a success', async () => {
    const client = new ApiClient(`${baseUrl}/`, new Ed25519KeyPair(home.publicKey))
    client.publicEncryptionKey = new X25519KeyPair(home.publicEncryptionKey)
    // client and server share this process, each of them is its own home community while it works
    fetchSpy.mockImplementation((async (request: Request) => {
      AppContext.getInstance().setHomeCommunity(home)
      const response = await app.handle(request)
      AppContext.getInstance().setHomeCommunity(sender)
      return response
    }) as never)
    AppContext.getInstance().setHomeCommunity(sender)
    const { error, status } = await client.emailTransactionReceived(tx)
    expect(error).toBeNull()
    expect(status).toBe(200)
    expect(sendEmail).toHaveBeenCalledTimes(1)
  })

  it('sends no mail to a user who switched it off, and answers OK', async () => {
    userSpy.mockResolvedValue({ id: 1, emailId: 5, transfersInChat: false } as never)
    const response = await app.handle(await sendSealed(sender))
    expect(response.status).toBe(200)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('answers 404 for a recipient that does not exist', async () => {
    userSpy.mockResolvedValue(null as never)
    const response = await app.handle(await sendSealed(sender))
    expect(response.status).toBe(404)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('answers 404 for a recipient without contact', async () => {
    userContactSpy.mockResolvedValue(null as never)
    const response = await app.handle(await sendSealed(sender))
    expect(response.status).toBe(404)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  // the keyid of a request is what its sender claims, it proves nothing until a known key signed
  it('answers 401 to a body encrypted and signed with a key of its own', async () => {
    const response = await app.handle(await sendSealed(stranger))
    expect(response.status).toBe(401)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('answers 401 to a signature that claims the key of a known community', async () => {
    const response = await app.handle(await signedPlain(stranger, sender))
    expect(response.status).toBe(401)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('answers 415 to a known community that does not encrypt', async () => {
    const response = await app.handle(await signedPlain(sender))
    expect(response.status).toBe(415)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('answers 401 to a body the signature does not cover', async () => {
    const signed = await sendSealed(sender)
    const other = await sendSealed(sender, wire({ ...tx, memo: 'Danke für alles andere' }))
    const response = await app.handle(
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
    const response = await app.handle(await sendSealed(otherKnown))
    expect(response.status).toBe(401)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('answers 401 to a community that is not authenticated', async () => {
    const response = await app.handle(await sendSealed(notAuthenticated))
    expect(response.status).toBe(401)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('answers 400 to a body altered on the way', async () => {
    const request = await sendSealed(sender)
    const box = new Uint8Array(await request.arrayBuffer())
    box[box.length - 1] ^= 1
    const response = await app.handle(
      new Request(url, { method: 'POST', headers: request.headers, body: box }),
    )
    expect(response.status).toBe(400)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('answers 400 to a sealed body that is no JSON', async () => {
    const response = await app.handle(await sendSealed(sender, 'no json'))
    expect(response.status).toBe(400)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('refuses a sealed body that is no transaction', async () => {
    const response = await app.handle(await sendSealed(sender, '{"memo":"Danke"}'))
    expect(response.status).toBe(422)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('answers 401 to a request that is not signed', async () => {
    const response = await app.handle(
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
    const signatureInput = `sig1=("@method" "@path");keyid="${sender.publicKey.toString('hex')}";alg="ed25519";created=${Math.floor(Date.now() / 1000)};nonce="n"`
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
      const response = await app.handle(new Request(url, { method: 'POST', headers, body }))
      expect(response.status).toBe(401)
    }
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('refuses a transaction for another community', async () => {
    const forOther = {
      ...tx,
      recipient: { ...tx.recipient, communityUuid: otherKnown.communityUuid },
    }
    const response = await app.handle(await sendSealed(sender, wire(forOther)))
    expect(response.status).toBe(401)
    expect(sendEmail).not.toHaveBeenCalled()
  })
})

describe('POST peer-api/v1/prepareSendCoins', () => {
  const prepareUrl = `${baseUrl}/peer-api/v1/prepareSendCoins`
  const recipient = {
    id: 1,
    alias: 'peter',
    gradidoId: '8e2b5c1d-3f4a-4b6c-9d7e-0a1b2c3d4e5f',
    communityUuid: home.communityUuid,
  }
  const avatarUpdatedAt = '2026-09-15T06:00:00.000Z'
  // the pending transaction is written, the balance and the picture date are read elsewhere
  beforeEach(() => {
    userSpy.mockResolvedValue(recipient as never)
    spies.push(
      spyOn(database, 'countOpenPendingTransactions').mockResolvedValue(0),
      spyOn(logic, 'calculateRecipientBalance').mockResolvedValue({
        balance: tx.amount,
        lastTransactionId: null,
        decay: { decay: GradidoUnit.fromGradidoCent(0n), start: null },
      } as never),
      spyOn(apis, 'memberAvatarDateForTransfer').mockResolvedValue(avatarUpdatedAt),
      spyOn(database, 'dbInsertPendingTransaction').mockResolvedValue({ success: true, value: 1 }),
    )
  })

  it("answers the recipient's public info sealed for the sender, and nothing else of the row", async () => {
    const response = await app.handle(await sendSealed(sender, wire(), prepareUrl))
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/octet-stream')
    expect(response.headers.get('signature')).not.toBeNull()
    const box = new Uint8Array(await response.arrayBuffer())
    expect(Buffer.from(box).includes(recipient.alias)).toBe(false)
    // opened as the sender opens it: with its own key and the recipient community's public key
    AppContext.getInstance().setHomeCommunity(sender)
    const opened = AppContext.getInstance()
      .getHomeCommunity()
      .decryptAndHash(box, new X25519KeyPair(home.publicEncryptionKey))
    expect(opened.success).toBe(true)
    if (opened.success) {
      expect(JSON.parse(opened.value.payload)).toEqual({
        alias: recipient.alias,
        gradidoId: recipient.gradidoId,
        communityUuid: recipient.communityUuid,
        avatarUpdatedAt,
      })
    }
  })

  it('reaches the client as the public info of the recipient', async () => {
    const client = new ApiClient(
      `${baseUrl}/`,
      new Ed25519KeyPair(home.publicKey),
      new X25519KeyPair(home.publicEncryptionKey),
    )
    // client and server share this process, each of them is its own home community while it works
    fetchSpy.mockImplementation((async (request: Request) => {
      AppContext.getInstance().setHomeCommunity(home)
      const response = await app.handle(request)
      AppContext.getInstance().setHomeCommunity(sender)
      return response
    }) as never)
    AppContext.getInstance().setHomeCommunity(sender)
    const { data, error } = await client.prepareSendCoins(tx)
    expect(error).toBeNull()
    expect(data).toMatchObject({
      alias: recipient.alias,
      gradidoId: recipient.gradidoId,
      communityUuid: recipient.communityUuid,
    })
    // Eden reads an ISO date string as Date
    expect(new Date(data?.avatarUpdatedAt ?? 0).toISOString()).toBe(avatarUpdatedAt)
  })

  it('answers an error with its status, unsealed and unsigned', async () => {
    userSpy.mockResolvedValue(null as never)
    const response = await app.handle(await sendSealed(sender, wire(), prepareUrl))
    expect(response.status).toBe(404)
    expect(response.headers.get('signature')).toBeNull()
  })

  // The whole way back: the 404 reaches the sender's wallet as the sentence the backend says for
  // a member of its own community, not as anything of this community's words.
  it("tells the sender's wallet that nobody has the recipient, in the backend's words", async () => {
    userSpy.mockResolvedValue(null as never)
    const enabled = CONFIG.FEDERATION_XCOM_SENDCOINS_ENABLED
    CONFIG.FEDERATION_XCOM_SENDCOINS_ENABLED = true
    spies.push(
      { mockRestore: () => (CONFIG.FEDERATION_XCOM_SENDCOINS_ENABLED = enabled) },
      spyOn(database, 'dbFindAuthenticatedForeignCommunityByIdentifier').mockResolvedValue({
        ...homeRow,
        url: `${baseUrl}/api/`,
      } as never),
      spyOn(logic, 'calculateSenderBalance').mockResolvedValue({
        success: true,
        value: {
          balance: tx.amount,
          lastTransactionId: null,
          decay: { decay: GradidoUnit.fromGradidoCent(0n), start: null },
        },
      } as never),
    )
    // client and server share this process, each of them is its own home community while it works
    fetchSpy.mockImplementation((async (request: Request) => {
      AppContext.getInstance().setHomeCommunity(home)
      const response = await app.handle(request)
      AppContext.getInstance().setHomeCommunity(sender)
      return response
    }) as never)
    AppContext.getInstance().setHomeCommunity(sender)
    const senderUser = { id: 7, ...tx.sender, emailContact: { email: 'bibi@example.org' } }

    await expect(
      processXComCompleteTransaction(
        senderUser as never,
        home.communityUuid,
        tx.recipient.identifier,
        tx.amount,
        tx.memo,
      ),
    ).rejects.toThrow(`${RECIPIENT_NOT_FOUND}: ${tx.recipient.identifier}`)
  })
})

describe('POST peer-api/v1/disburseTransactionLink', () => {
  const link = { id: 3, code: 'a1f9c2d41b7e19981fa0d001', amount: tx.amount, memo: tx.memo }
  const creator = { id: 7, gradidoId: tx.sender.gradidoId }

  it('pays a link of this community out to the member the calling community names', async () => {
    const complete = spyOn(senderSide, 'processXComCompleteTransaction').mockResolvedValue(true)
    spies.push(
      complete,
      spyOn(database, 'dbFindOpenTransactionLinkWithCreatorByCode').mockResolvedValue({
        link,
        creator,
      } as never),
    )
    const client = new ApiClient(
      `${baseUrl}/`,
      new Ed25519KeyPair(home.publicKey),
      new X25519KeyPair(home.publicEncryptionKey),
    )
    // client and server share this process, each of them is its own home community while it works
    fetchSpy.mockImplementation((async (request: Request) => {
      AppContext.getInstance().setHomeCommunity(home)
      const response = await app.handle(request)
      AppContext.getInstance().setHomeCommunity(sender)
      return response
    }) as never)
    AppContext.getInstance().setHomeCommunity(sender)

    const { data, error } = await client.disburseTransactionLink({
      link: { code: link.code, communityUuid: home.communityUuid },
      recipient: { communityUuid: sender.communityUuid, identifier: 'peter' },
    })
    expect(error).toBeNull()
    expect(data).toBe(true)
    expect(complete).toHaveBeenCalledTimes(1)
    expect(complete.mock.calls[0].slice(0, 3)).toEqual([creator, sender.communityUuid, 'peter'])
  })
})

describe('the member picture routes', () => {
  const ANNA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  const updatedAt = new Date('2026-09-14T10:00:00.000Z')
  const client = () =>
    new ApiClient(
      `${baseUrl}/`,
      new Ed25519KeyPair(home.publicKey),
      new X25519KeyPair(home.publicEncryptionKey),
    )

  beforeEach(() => {
    // client and server share this process, each of them is its own home community while it works
    fetchSpy.mockImplementation((async (request: Request) => {
      AppContext.getInstance().setHomeCommunity(home)
      const response = await app.handle(request)
      AppContext.getInstance().setHomeCommunity(sender)
      return response
    }) as never)
    AppContext.getInstance().setHomeCommunity(sender)
  })

  it('answers the small pictures of the members asked about, sealed for the community asking', async () => {
    const rows = spyOn(database, 'dbFindMemberAvatarsSmall').mockResolvedValue([
      {
        gradidoId: ANNA,
        communityUuid: home.communityUuid,
        avatarSmall: Buffer.from('face'),
        updatedAt,
      },
    ])
    spies.push(rows)

    const { data, error } = await client().memberAvatarsSmall({ gradidoIds: [ANNA] })

    expect(error).toBeNull()
    expect(rows).toHaveBeenCalledWith([ANNA])
    expect(data).toEqual([
      // Eden reads an ISO date string as Date
      {
        gradidoId: ANNA,
        avatarUpdatedAt: updatedAt,
        avatar: Buffer.from('face').toString('base64'),
      } as never,
    ])
  })

  it('answers the full picture by the pair with this community, and null for none', async () => {
    const full = spyOn(database, 'dbFindMemberAvatarFull').mockResolvedValue(Buffer.from('zoom'))
    spies.push(full)

    expect((await client().memberAvatarFull({ gradidoId: ANNA })).data).toBe(
      Buffer.from('zoom').toString('base64'),
    )
    expect(full).toHaveBeenCalledWith(ANNA, home.communityUuid)

    full.mockResolvedValue(null)
    const none = await client().memberAvatarFull({ gradidoId: ANNA })
    expect(none.error).toBeNull()
    expect(none.data).toBeNull()
  })

  it('answers only the dates', async () => {
    spies.push(
      spyOn(database, 'dbFindMemberAvatarTimestampsByGradidoIds').mockResolvedValue(
        new Map([[ANNA, updatedAt]]),
      ),
    )
    const { data } = await client().memberAvatarDates({ gradidoIds: [ANNA] })
    expect(data).toEqual([{ gradidoId: ANNA, avatarUpdatedAt: updatedAt } as never])
  })

  it('refuses a question about more members than one list shows', async () => {
    const tooMany = Array.from({ length: 101 }, () => ANNA)
    const response = await app.handle(
      await sendSealed(
        sender,
        JSON.stringify({ gradidoIds: tooMany }),
        `${baseUrl}/peer-api/v1/memberAvatarsSmall`,
      ),
    )
    expect(response.status).toBe(422)
  })
})

describe('POST peer-api/v1/transactionLink', () => {
  const CODE = 'a1f9c2d41b7e19981fa0d001'
  const MAKER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  const client = () =>
    new ApiClient(
      `${baseUrl}/`,
      new Ed25519KeyPair(home.publicKey),
      new X25519KeyPair(home.publicEncryptionKey),
    )

  beforeEach(() => {
    fetchSpy.mockImplementation((async (request: Request) => {
      AppContext.getInstance().setHomeCommunity(home)
      const response = await app.handle(request)
      AppContext.getInstance().setHomeCommunity(sender)
      return response
    }) as never)
    AppContext.getInstance().setHomeCommunity(sender)
  })

  it('answers the link for whoever holds its code, sealed for the community asking', async () => {
    const validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000)
    spies.push(
      spyOn(database, 'dbFindTransactionLinkForCodeHolder').mockResolvedValue({
        link: {
          code: CODE,
          amount: GradidoUnit.fromString('20'),
          memo: 'Danke',
          createdAt: new Date('2026-11-01T10:00:00.000Z'),
          validUntil,
          redeemedAt: null,
          redeemedBy: null,
          deletedAt: null,
        },
        maker: { gradidoId: MAKER, communityUuid: home.communityUuid, alias: 'bibi' },
        greeting: null,
      } as never),
      spyOn(database, 'dbFindMemberAvatarsSmall').mockResolvedValue([]),
    )

    const { data, error } = await client().transactionLink({ code: CODE })

    expect(error).toBeNull()
    expect(data).toMatchObject({
      amount: '20',
      memo: 'Danke',
      sender: { gradidoId: MAKER, alias: 'bibi' },
      greeting: null,
      senderAvatar: null,
    })
  })

  it('answers 404 for an unknown code', async () => {
    spies.push(spyOn(database, 'dbFindTransactionLinkForCodeHolder').mockResolvedValue(null))
    expect((await client().transactionLink({ code: CODE })).error?.status).toBe(404)
  })
})

describe('the chat message routes', () => {
  const ANNA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  const BEN = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  const MESSAGE_UUID = '10000000-0000-4000-8000-000000000001'
  const writer = { communityUuid: sender.communityUuid, gradidoId: ANNA }
  const client = () =>
    new ApiClient(
      `${baseUrl}/`,
      new Ed25519KeyPair(home.publicKey),
      new X25519KeyPair(home.publicEncryptionKey),
    )

  beforeEach(() => {
    // client and server share this process, each of them is its own home community while it works
    fetchSpy.mockImplementation((async (request: Request) => {
      AppContext.getInstance().setHomeCommunity(home)
      const response = await app.handle(request)
      AppContext.getInstance().setHomeCommunity(sender)
      return response
    }) as never)
    AppContext.getInstance().setHomeCommunity(sender)
  })

  it('files a message of a member of the calling community and answers what became of the mail', async () => {
    const store = spyOn(chatMessageLogic, 'storeChatMessage').mockResolvedValue({
      conversationId: 3,
    } as never)
    spies.push(
      store,
      spyOn(database, 'findUserByUuids').mockImplementation((async (
        _c: string,
        gradidoId: string,
      ) =>
        gradidoId === ANNA
          ? { gradidoID: ANNA, communityUuid: sender.communityUuid, alias: 'anna' }
          : { gradidoID: BEN, communityUuid: home.communityUuid, emailContact: {} }) as never),
      spyOn(chatMessageLogic, 'readChatMemberMutedAt').mockResolvedValue(null),
      spyOn(mails, 'sendCustomEmail').mockResolvedValue(true as never),
    )

    const { data, error } = await client().chatMessage({
      sender: { ...writer, alias: 'anna' },
      recipient: { communityUuid: home.communityUuid, gradidoId: BEN },
      messageUuid: MESSAGE_UUID,
      subject: null,
      body: 'Shall we meet at ten?',
      notify: database.ChatMessageNotify.EMAIL,
    })
    expect(error).toBeNull()
    expect(data).toEqual({ mailState: database.ChatMessageMailState.MAILED })
    expect(store).toHaveBeenCalledTimes(1)
  })

  it('files the new text of a message and answers true', async () => {
    const update = spyOn(database, 'dbUpdateChatMessageBody').mockResolvedValue({
      success: true,
    } as never)
    spies.push(update, spyOn(database, 'dbSelectChatMessageImageInfos').mockResolvedValue([]))

    const { data, error } = await client().editChatMessage({
      writer,
      messageUuid: MESSAGE_UUID,
      body: 'Ab 10 Uhr.',
    })
    expect(error).toBeNull()
    expect(data).toBe(true)
    expect(update).toHaveBeenCalledWith(MESSAGE_UUID, writer, 'Ab 10 Uhr.')
  })

  it('hands a refusal to the client with its status and reason', async () => {
    const { error } = await client().editChatMessage({
      writer: { ...writer, communityUuid: home.communityUuid },
      messageUuid: MESSAGE_UUID,
      body: 'Ab 10 Uhr.',
    })
    expect(error?.status).toBe(401)
    expect(String(error?.value)).toBe('CHAT_MESSAGE_NOT_EDITED: NOT_THE_WRITERS_COMMUNITY')
  })
})

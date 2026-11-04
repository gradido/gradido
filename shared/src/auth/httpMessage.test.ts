// AI-GENERATED — not an architecture reference
import { afterEach, beforeAll, describe, expect, it, setSystemTime } from 'bun:test'
import { appendSignature, component, createSignature, MessageDescriptor } from 'http-message-sig'
import { Ed25519KeyPair, X25519KeyPair } from 'shared-native'
import { AppContext } from '../AppContext'
import { InvalidResponseSignatureError } from './errorTypes'
import { signHttpMessage, verifyHttpMessage } from './httpMessage'

const signKeys = Ed25519KeyPair.generate().toBuffer()
const encryptionKeys = X25519KeyPair.generate().toBuffer()
const keyId = signKeys.publicKey.toString('hex')
const nonce = 'a'.repeat(32)
const fieldsWithBody = [
  { name: 'content-type', value: 'application/octet-stream' },
  { name: 'content-digest', value: 'blake2b-256=:AAAA:' },
]
const targetUri = 'https://gradido.example/peer-api/v1/route?a=1'
const request: MessageDescriptor = {
  kind: 'request',
  method: 'POST',
  targetUri,
  fields: fieldsWithBody,
}
const response: MessageDescriptor = {
  kind: 'response',
  status: 200,
  fields: fieldsWithBody,
  request: { kind: 'request', method: 'POST', targetUri, fields: [] },
}

beforeAll(() => {
  AppContext.getInstance().setHomeCommunity({
    publicKey: signKeys.publicKey,
    privateKey: Buffer.concat([signKeys.privateKey as Buffer, signKeys.publicKey]),
    publicEncryptionKey: encryptionKeys.publicKey,
    privateEncryptionKey: encryptionKeys.privateKey,
    communityUuid: '7a2e4c90-1b5d-4f3a-8c6e-0d9b3f2a1e47',
  })
})
afterEach(() => {
  setSystemTime()
})

// the message as it arrives: with the two signature headers among its fields
const signed = async <T extends MessageDescriptor>(message: T, withNonce = nonce): Promise<T> => {
  const headers = appendSignature(new Headers(), await signHttpMessage(message, withNonce))
  return {
    ...message,
    fields: [...message.fields, ...[...headers].map(([name, value]) => ({ name, value }))],
  }
}

describe('verifyHttpMessage', () => {
  it('hands out the key of a request as it was signed', async () => {
    expect(await verifyHttpMessage(await signed(request))).toEqual({ keyId, nonce })
  })

  it('hands out the key of a response as it was signed', async () => {
    expect(await verifyHttpMessage(await signed(response), nonce)).toEqual({ keyId, nonce })
  })

  it('signs a request without body', async () => {
    const get: MessageDescriptor = { kind: 'request', method: 'GET', targetUri, fields: [] }
    expect(await verifyHttpMessage(await signed(get))).toEqual({ keyId, nonce })
  })

  it('refuses another nonce', async () => {
    const result = verifyHttpMessage(await signed(response), 'b'.repeat(32))
    await expect(result).rejects.toBeInstanceOf(InvalidResponseSignatureError)
    await expect(result).rejects.toThrow('nonce is not the one of the request')
  })

  it('refuses another digest', async () => {
    const message = await signed(request)
    const fields = message.fields.map((field) =>
      field.name === 'content-digest' ? { ...field, value: 'blake2b-256=:BBBB:' } : field,
    )
    await expect(verifyHttpMessage({ ...message, fields })).rejects.toMatchObject({
      code: 'VerificationFailed',
    })
  })

  it('refuses another path', async () => {
    const message = await signed(request)
    await expect(
      verifyHttpMessage({ ...message, targetUri: targetUri.replace('route', 'other') }),
    ).rejects.toMatchObject({ code: 'VerificationFailed' })
  })

  it('refuses a response to another request', async () => {
    const message = await signed(response)
    await expect(
      verifyHttpMessage(
        {
          ...message,
          request: {
            kind: 'request',
            method: 'POST',
            targetUri: targetUri.replace('route', 'other'),
            fields: [],
          },
        },
        nonce,
      ),
    ).rejects.toMatchObject({ code: 'VerificationFailed' })
  })

  it('refuses a body whose digest the signature leaves out', async () => {
    const signer = { algorithm: 'ed25519', sign: () => new Uint8Array(64) }
    const signature = await createSignature(request, {
      components: ['@method', '@path', 'content-type'],
      parameters: {
        keyid: keyId,
        alg: 'ed25519',
        created: Math.floor(Date.now() / 1000),
      },
      signer,
    })
    const headers = appendSignature(new Headers(), signature)
    await expect(
      verifyHttpMessage({
        ...request,
        fields: [...fieldsWithBody, ...[...headers].map(([name, value]) => ({ name, value }))],
      }),
    ).rejects.toMatchObject({ code: 'PolicyViolation' })
  })

  it('refuses a response that leaves out the request it answers', async () => {
    const signer = { algorithm: 'ed25519', sign: () => new Uint8Array(64) }
    const signature = await createSignature(response, {
      components: ['@status', 'content-type', 'content-digest', component('@path', { req: true })],
      parameters: {
        keyid: keyId,
        alg: 'ed25519',
        created: Math.floor(Date.now() / 1000),
        nonce,
      },
      signer,
    })
    const headers = appendSignature(new Headers(), signature)
    await expect(
      verifyHttpMessage(
        {
          ...response,
          fields: [...fieldsWithBody, ...[...headers].map(([name, value]) => ({ name, value }))],
        },
        nonce,
      ),
    ).rejects.toMatchObject({ code: 'PolicyViolation' })
  })

  it('refuses a signature of another key than the one it names', async () => {
    const other = Ed25519KeyPair.generate()
    const signature = await createSignature(request, {
      components: ['@method', '@path', 'content-digest', 'content-type'],
      parameters: {
        keyid: keyId,
        alg: 'ed25519',
        created: Math.floor(Date.now() / 1000),
      },
      signer: { algorithm: 'ed25519', sign: (data) => other.sign(data) },
    })
    const headers = appendSignature(new Headers(), signature)
    await expect(
      verifyHttpMessage({
        ...request,
        fields: [...fieldsWithBody, ...[...headers].map(([name, value]) => ({ name, value }))],
      }),
    ).rejects.toMatchObject({ code: 'VerificationFailed' })
  })

  it('refuses a keyid that is no public key', async () => {
    const signature = await createSignature(request, {
      components: ['@method', '@path', 'content-digest', 'content-type'],
      parameters: { keyid: 'abc', alg: 'ed25519', created: Math.floor(Date.now() / 1000) },
      signer: { algorithm: 'ed25519', sign: () => new Uint8Array(64) },
    })
    const headers = appendSignature(new Headers(), signature)
    await expect(
      verifyHttpMessage({
        ...request,
        fields: [...fieldsWithBody, ...[...headers].map(([name, value]) => ({ name, value }))],
      }),
    ).rejects.toMatchObject({ code: 'VerificationFailed' })
  })

  it('refuses a message without signature', async () => {
    await expect(verifyHttpMessage(request)).rejects.toMatchObject({ code: 'MissingField' })
  })

  it('refuses a signature made too long ago', async () => {
    setSystemTime(new Date(Date.now() - 10 * 1000))
    const message = await signed(request)
    setSystemTime()
    await expect(verifyHttpMessage(message)).rejects.toMatchObject({ code: 'PolicyViolation' })
  })
})

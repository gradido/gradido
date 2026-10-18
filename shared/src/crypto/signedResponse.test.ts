// AI-GENERATED — not an architecture reference
import { beforeAll, describe, expect, it } from 'bun:test'
import { Ed25519KeyPair, X25519KeyPair } from 'shared-native'
import * as v from 'valibot'
import { AppContext } from '../AppContext'
import { signatureNonceSchema } from '../schema/federation.schema'
import {
  contentDigest,
  createSignatureNonce,
  InvalidResponseSignatureError,
  signedJsonResponse,
  verifySignedResponse,
} from './signedResponse'

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
const nonce = createSignatureNonce()
// the request as the community behind its proxy sees it, and as the peer sent it
const answered = {
  method: 'GET',
  url: `http://127.0.0.1:5010/peer-api/v1/communityInfos?nonce=${nonce}`,
}
const sent = {
  method: 'GET',
  url: `https://community.example/peer-api/v1/communityInfos?nonce=${nonce}`,
}

const signedInfo = async () => {
  const response = await signedJsonResponse({ name: 'Gradido Akademie' }, 200, nonce, answered)
  return { status: response.status, headers: response.headers, body: await response.text() }
}

// the signature parameters of a response, rewritten; the signature itself stays as it was
const withSignatureInput = (
  response: Awaited<ReturnType<typeof signedInfo>>,
  rewrite: (signatureInput: string) => string,
) => {
  const headers = new Headers(response.headers)
  headers.set('signature-input', rewrite(headers.get('signature-input') ?? ''))
  return { ...response, headers }
}

describe('createSignatureNonce', () => {
  it('passes the nonce schema, and the schema hands it back as it was', () => {
    const created = createSignatureNonce()
    expect(v.parse(signatureNonceSchema, created)).toBe(created)
    expect(createSignatureNonce()).not.toBe(created)
  })
})

describe('signedJsonResponse', () => {
  it('signs the JSON with the community key and the nonce, the peer verifies it', async () => {
    const response = await signedInfo()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/json')
    expect(JSON.parse(response.body)).toEqual({ name: 'Gradido Akademie' })
    expect(response.headers.get('content-digest')).toBe(contentDigest(response.body))
    const signatureInput = response.headers.get('signature-input')
    expect(signatureInput).toContain(`keyid="${communityPublicKey.toString('hex')}"`)
    expect(signatureInput).toContain(`nonce="${nonce}"`)
    expect(signatureInput).toContain('"@method";req "@path";req')
    // the nonce makes it fresh, no clock is consulted
    expect(signatureInput).not.toContain('created=')
    expect(signatureInput).not.toContain('expires=')
    // scheme, host and port differ behind the proxy, the path does not
    await expect(
      verifySignedResponse(response, communityKeyPair, nonce, sent),
    ).resolves.toBeUndefined()
  })
})

describe('verifySignedResponse refuses', () => {
  const expectRefused = async (
    response: Awaited<ReturnType<typeof signedInfo>>,
    reason: string,
    keyPair = communityKeyPair,
    expectedNonce = nonce,
    request = sent,
  ) => {
    await expect(verifySignedResponse(response, keyPair, expectedNonce, request)).rejects.toThrow(
      reason,
    )
  }

  it('a signature by another community', async () => {
    const otherKey = new Ed25519KeyPair(Ed25519KeyPair.generate().publicKeyToBuffer())
    await expect(
      verifySignedResponse(await signedInfo(), otherKey, nonce, sent),
    ).rejects.toBeInstanceOf(InvalidResponseSignatureError)
    await expectRefused(await signedInfo(), 'no signature by key', otherKey)
  })

  it('the answer to another request', async () => {
    await expectRefused(
      await signedInfo(),
      'nonce is not the one of the request',
      communityKeyPair,
      createSignatureNonce(),
    )
  })

  it('the nonce of this request written over the one that was signed', async () => {
    const otherNonce = createSignatureNonce()
    const response = withSignatureInput(await signedInfo(), (input) =>
      input.replace(nonce, otherNonce),
    )
    await expectRefused(response, 'Signature verification failed', communityKeyPair, otherNonce)
  })

  it('a signature without nonce', async () => {
    const response = withSignatureInput(await signedInfo(), (input) =>
      input.replace(`;nonce="${nonce}"`, ''),
    )
    await expectRefused(response, 'Required parameter nonce is absent')
  })

  // the nonce passed on to another signed route of the same community
  it('the answer of another route', async () => {
    await expectRefused(
      await signedInfo(),
      'Signature verification failed',
      communityKeyPair,
      nonce,
      {
        ...sent,
        url: `https://community.example/peer-api/v1/otherRoute?nonce=${nonce}`,
      },
    )
  })

  it('the answer to another method', async () => {
    await expectRefused(
      await signedInfo(),
      'Signature verification failed',
      communityKeyPair,
      nonce,
      {
        ...sent,
        method: 'POST',
      },
    )
  })

  it('a signature that leaves out the request path', async () => {
    const response = withSignatureInput(await signedInfo(), (input) =>
      input.replace(' "@path";req', ''),
    )
    await expectRefused(response, 'Required component "@path";req is absent')
  })

  it('another body under the signed digest', async () => {
    const response = await signedInfo()
    await expectRefused(
      { ...response, body: JSON.stringify({ name: 'Fälschung' }) },
      'content-digest does not match',
    )
  })

  it('another digest with its body', async () => {
    const response = await signedInfo()
    const body = JSON.stringify({ name: 'Fälschung' })
    const headers = new Headers(response.headers)
    headers.set('content-digest', contentDigest(body))
    await expectRefused({ ...response, headers, body }, 'Signature verification failed')
  })

  // what the other community sent comes in here, a wrong size is not a bug of ours
  it('a signature of another size', async () => {
    const response = await signedInfo()
    const headers = new Headers(response.headers)
    const shortened = `:${Buffer.alloc(63).toString('base64')}:`
    headers.set('signature', (headers.get('signature') ?? '').replace(/:[^:]+:/, shortened))
    await expectRefused({ ...response, headers }, 'Signature verification failed')
  })

  it('another status', async () => {
    await expectRefused({ ...(await signedInfo()), status: 201 }, 'Signature verification failed')
  })

  it('a signature that leaves out the body digest', async () => {
    const response = withSignatureInput(await signedInfo(), (input) =>
      input.replace(' "content-digest"', ''),
    )
    await expectRefused(response, 'Required component "content-digest" is absent')
  })

  it('a second signature beside the valid one', async () => {
    const response = await signedInfo()
    const headers = new Headers(response.headers)
    headers.set(
      'signature',
      `${headers.get('signature')}, ${headers.get('signature')?.replace('sig1=', 'sig2=')}`,
    )
    headers.set(
      'signature-input',
      `${headers.get('signature-input')}, ${headers.get('signature-input')?.replace('sig1=', 'sig2=')}`,
    )
    await expectRefused({ ...response, headers }, 'explicit label is required')
  })

  it('a response without signature', async () => {
    const response = await signedInfo()
    const headers = new Headers(response.headers)
    headers.delete('signature')
    headers.delete('signature-input')
    await expectRefused({ ...response, headers }, 'response is not signed')
  })
})

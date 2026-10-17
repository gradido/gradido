// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { generateKeyPairSync } from 'node:crypto'
import * as v from 'valibot'
import { signatureNonceSchema } from '../schema/federation.schema'
import {
  contentDigest,
  createSignatureNonce,
  InvalidResponseSignatureError,
  SigningCommunity,
  signedJsonResponse,
  verifySignedResponse,
} from './signedResponse'

// a key pair as the dht-node stores it: libsodium, privateKey = seed || publicKey
const libsodiumKeyPair = (): SigningCommunity & { privateKey: Buffer } => {
  const keyPair = generateKeyPairSync('ed25519')
  // the raw 32 bytes close both DER encodings
  const seed = keyPair.privateKey.export({ format: 'der', type: 'pkcs8' }).subarray(-32)
  const publicKey = keyPair.publicKey.export({ format: 'der', type: 'spki' }).subarray(-32)
  return { publicKey, privateKey: Buffer.concat([seed, publicKey]) }
}

const community = libsodiumKeyPair()
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
  const response = await signedJsonResponse(
    { name: 'Gradido Akademie' },
    200,
    community,
    nonce,
    answered,
  )
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
    expect(signatureInput).toContain(`keyid="${community.publicKey.toString('hex')}"`)
    expect(signatureInput).toContain(`nonce="${nonce}"`)
    expect(signatureInput).toContain('"@method";req "@path";req')
    // the nonce makes it fresh, no clock is consulted
    expect(signatureInput).not.toContain('created=')
    expect(signatureInput).not.toContain('expires=')
    // scheme, host and port differ behind the proxy, the path does not
    await expect(
      verifySignedResponse(response, community.publicKey, nonce, sent),
    ).resolves.toBeUndefined()
  })

  it('throws for a community without private key', async () => {
    await expect(
      signedJsonResponse(
        {},
        200,
        { publicKey: community.publicKey, privateKey: null },
        nonce,
        answered,
      ),
    ).rejects.toThrow('no private key')
  })
})

describe('verifySignedResponse refuses', () => {
  const expectRefused = async (
    response: Awaited<ReturnType<typeof signedInfo>>,
    reason: string,
    publicKey = community.publicKey,
    expectedNonce = nonce,
    request = sent,
  ) => {
    await expect(verifySignedResponse(response, publicKey, expectedNonce, request)).rejects.toThrow(
      reason,
    )
  }

  it('a signature by another community', async () => {
    const otherKey = libsodiumKeyPair().publicKey
    await expect(
      verifySignedResponse(await signedInfo(), otherKey, nonce, sent),
    ).rejects.toBeInstanceOf(InvalidResponseSignatureError)
    await expectRefused(await signedInfo(), 'no signature by key', otherKey)
  })

  it('the answer to another request', async () => {
    await expectRefused(
      await signedInfo(),
      'nonce is not the one of the request',
      community.publicKey,
      createSignatureNonce(),
    )
  })

  it('the nonce of this request written over the one that was signed', async () => {
    const otherNonce = createSignatureNonce()
    const response = withSignatureInput(await signedInfo(), (input) =>
      input.replace(nonce, otherNonce),
    )
    await expectRefused(response, 'Signature verification failed', community.publicKey, otherNonce)
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
      community.publicKey,
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
      community.publicKey,
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

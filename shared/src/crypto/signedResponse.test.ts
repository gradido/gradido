// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { generateKeyPairSync } from 'node:crypto'
import {
  contentDigest,
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

const signedInfo = async () => {
  const response = await signedJsonResponse({ name: 'Gradido Akademie' }, 200, community)
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

describe('signedJsonResponse', () => {
  it('signs the JSON with the community key, the peer verifies it', async () => {
    const response = await signedInfo()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/json')
    expect(JSON.parse(response.body)).toEqual({ name: 'Gradido Akademie' })
    expect(response.headers.get('content-digest')).toBe(contentDigest(response.body))
    expect(response.headers.get('signature-input')).toContain(
      `keyid="${community.publicKey.toString('hex')}"`,
    )
    expect(await verifySignedResponse(response, community.publicKey)).toEqual({ success: true })
  })

  it('throws for a community without private key', async () => {
    await expect(
      signedJsonResponse({}, 200, { publicKey: community.publicKey, privateKey: null }),
    ).rejects.toThrow('no private key')
  })
})

describe('verifySignedResponse refuses', () => {
  const expectRefused = async (
    response: Awaited<ReturnType<typeof signedInfo>>,
    publicKey: Buffer,
    reason: string,
  ) => {
    const result = await verifySignedResponse(response, publicKey)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBeInstanceOf(InvalidResponseSignatureError)
      expect(result.error.reason).toContain(reason)
    }
  }

  it('a signature by another community', async () => {
    await expectRefused(await signedInfo(), libsodiumKeyPair().publicKey, 'no signature by key')
  })

  it('another body under the signed digest', async () => {
    const response = await signedInfo()
    await expectRefused(
      { ...response, body: JSON.stringify({ name: 'Fälschung' }) },
      community.publicKey,
      'content-digest does not match',
    )
  })

  it('another digest with its body', async () => {
    const response = await signedInfo()
    const body = JSON.stringify({ name: 'Fälschung' })
    const headers = new Headers(response.headers)
    headers.set('content-digest', contentDigest(body))
    await expectRefused({ ...response, headers, body }, community.publicKey, 'does not match')
  })

  it('another status', async () => {
    await expectRefused(
      { ...(await signedInfo()), status: 201 },
      community.publicKey,
      'does not match',
    )
  })

  it('a signature that leaves out the body digest', async () => {
    const response = withSignatureInput(await signedInfo(), (input) =>
      input.replace(' "content-digest"', ''),
    )
    await expectRefused(response, community.publicKey, 'Missing required signed fields')
  })

  it('a signature without expiry', async () => {
    const response = withSignatureInput(await signedInfo(), (input) =>
      input.replace(/;expires=\d+/, ''),
    )
    await expectRefused(response, community.publicKey, 'Missing required signature parameters')
  })

  it('a signature older than five minutes', async () => {
    const tenMinutesAgo = Math.floor(Date.now() / 1000) - 600
    const response = withSignatureInput(await signedInfo(), (input) =>
      input.replace(/;created=\d+/, `;created=${tenMinutesAgo}`),
    )
    await expectRefused(response, community.publicKey, 'too old')
  })

  it('a response without signature', async () => {
    const response = await signedInfo()
    const headers = new Headers(response.headers)
    headers.delete('signature')
    headers.delete('signature-input')
    await expectRefused({ ...response, headers }, community.publicKey, 'no signature by key')
  })
})

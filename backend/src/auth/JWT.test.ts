// AI-GENERATED — not an architecture reference
import { createHmac } from 'node:crypto'
import { SignJWT } from 'jose'
import { CONFIG } from '@/config'
import { decode, encode } from './JWT'

const gradidoID = '3d813cbb-47fb-42ba-91df-831e1593ac29'

const payloadOf = (token: string): Record<string, unknown> =>
  JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())

describe('auth/JWT', () => {
  describe('encode', () => {
    it('creates a token for this community', () => {
      expect(payloadOf(encode(gradidoID))).toMatchObject({
        iss: CONFIG.COMMUNITY_URL,
        aud: `${CONFIG.COMMUNITY_URL}/`,
        sub: gradidoID,
      })
    })

    it('signs with CONFIG.JWT_SECRET', () => {
      const [header, payload, signature] = encode(gradidoID).split('.')
      const expected = createHmac('sha256', Buffer.from(CONFIG.JWT_SECRET, 'utf8'))
        .update(`${header}.${payload}`)
        .digest('base64url')
      expect(signature).toBe(expected)
    })

    it('expires in the future', () => {
      const { exp } = payloadOf(encode(gradidoID))
      expect(exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
    })

    it('throws for an id that is neither a uuid v4 nor the dlt-connector', () => {
      expect(() => encode('some-service')).toThrow()
    })
  })

  describe('decode', () => {
    it('returns the gradido id of an encoded token', () => {
      expect(decode(encode(gradidoID))).toBe(gradidoID)
    })

    it('returns null for a token signed with another secret', () => {
      const [header, payload] = encode(gradidoID).split('.')
      const signature = createHmac('sha256', 'another secret')
        .update(`${header}.${payload}`)
        .digest('base64url')
      expect(decode(`${header}.${payload}.${signature}`)).toBeNull()
    })

    it('returns the dlt-connector as it is', () => {
      expect(decode(encode('dlt-connector'))).toBe('dlt-connector')
    })

    // the token dlt-connector/src/client/backend/BackendClient.ts builds with jose
    it('returns "dlt-connector" for the token of the dlt-connector', async () => {
      const token = await new SignJWT({})
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuedAt()
        .setSubject('dlt-connector')
        .setIssuer(CONFIG.COMMUNITY_URL)
        .setAudience(CONFIG.COMMUNITY_URL.replace(/\/*$/, '/'))
        .setExpirationTime('10m')
        .sign(new TextEncoder().encode(CONFIG.JWT_SECRET))
      expect(decode(token)).toBe('dlt-connector')
    })

    it('returns null for an empty token', () => {
      expect(decode('')).toBeNull()
    })

    it('returns null for something that is no token', () => {
      expect(decode('no.jwt.token')).toBeNull()
    })
  })
})

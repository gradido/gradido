// AI-GENERATED — not an architecture reference
import { createHmac } from 'node:crypto'
import { CONFIG } from '@/config'
import {
  mintPresenceCode,
  PRESENCE_CODE_VALID_MINUTES,
  verifyPresenceCode,
} from './PresenceCode.logic'

const ALIAS = 'MeisterBob'
const COMMUNITY = '0b9e5c2e-8d7a-4a8f-9d3f-4c7d2f6a1b01'
const OTHER_COMMUNITY = '6f1c7a5e-2b3d-4e8f-a1b2-c3d4e5f60718'
const NOW = new Date('2026-09-22T10:00:00.000Z')
const minutes = (n: number): Date => new Date(NOW.getTime() + n * 60 * 1000)

describe('PresenceCode.logic', () => {
  describe('mintPresenceCode', () => {
    it('runs out after the valid minutes, to the second', () => {
      const { code, expiresAt } = mintPresenceCode(ALIAS, COMMUNITY, NOW)

      expect(expiresAt).toEqual(minutes(PRESENCE_CODE_VALID_MINUTES))
      expect(code.split('.')[0]).toBe(String(expiresAt.getTime() / 1000))
    })

    // What a device counts down from the moment the answer arrives: the time left at `now`,
    // so the whole ten minutes on a whole second and less by the part of the second gone.
    it('says how much of the validity is left, to the millisecond', () => {
      const validMs = PRESENCE_CODE_VALID_MINUTES * 60 * 1000
      const partway = new Date(NOW.getTime() + 400)

      expect(mintPresenceCode(ALIAS, COMMUNITY, NOW).remainingMs).toBe(validMs)
      expect(mintPresenceCode(ALIAS, COMMUNITY, partway).remainingMs).toBe(validMs - 400)
      const { expiresAt, remainingMs } = mintPresenceCode(ALIAS, COMMUNITY, partway)
      expect(expiresAt.getTime() - partway.getTime()).toBe(remainingMs)
    })

    it('has the shape <unix seconds>.<43 base64url characters>', () => {
      expect(mintPresenceCode(ALIAS, COMMUNITY, NOW).code).toMatch(/^\d{10}\.[A-Za-z0-9_-]{43}$/)
    })

    it('is a new code a second later', () => {
      const later = new Date(NOW.getTime() + 1000)

      expect(mintPresenceCode(ALIAS, COMMUNITY, later).code).not.toBe(
        mintPresenceCode(ALIAS, COMMUNITY, NOW).code,
      )
    })

    // The label gives the seal a key of its own: the session secret never signs a code.
    it('seals with a key of its own, not with the session secret itself', () => {
      const { code } = mintPresenceCode(ALIAS, COMMUNITY, NOW)
      const [exp, sig] = code.split('.')
      const withSessionSecret = createHmac('sha256', CONFIG.JWT_SECRET)
        .update(`${ALIAS}|${COMMUNITY}|${exp}`)
        .digest('base64url')

      expect(sig).not.toBe(withSessionSecret)
    })

    // A code for nobody would be a bug in the caller, not something to hand out.
    it('refuses an empty alias or community', () => {
      expect(() => mintPresenceCode('', COMMUNITY, NOW)).toThrow()
      expect(() => mintPresenceCode(ALIAS, '', NOW)).toThrow()
    })
  })

  describe('verifyPresenceCode', () => {
    const { code } = mintPresenceCode(ALIAS, COMMUNITY, NOW)

    it('accepts a code it minted, for the same alias and community', () => {
      expect(verifyPresenceCode(code, ALIAS, COMMUNITY, NOW)).toBe(true)
    })

    it('accepts it until the last second before it runs out', () => {
      const lastSecond = new Date(minutes(PRESENCE_CODE_VALID_MINUTES).getTime() - 1000)

      expect(verifyPresenceCode(code, ALIAS, COMMUNITY, lastSecond)).toBe(true)
    })

    it('refuses it once it has run out', () => {
      expect(verifyPresenceCode(code, ALIAS, COMMUNITY, minutes(PRESENCE_CODE_VALID_MINUTES))).toBe(
        false,
      )
      expect(verifyPresenceCode(code, ALIAS, COMMUNITY, minutes(60))).toBe(false)
    })

    it('refuses an altered seal', () => {
      const [exp, sig] = code.split('.')
      const altered = `${exp}.${sig[0] === 'A' ? 'B' : 'A'}${sig.slice(1)}`

      expect(verifyPresenceCode(altered, ALIAS, COMMUNITY, NOW)).toBe(false)
    })

    // The expiry is inside the seal: moving it later is not a longer code, it is a broken one.
    it('refuses a code whose expiry was pushed later', () => {
      const [exp, sig] = code.split('.')

      expect(verifyPresenceCode(`${Number(exp) + 3600}.${sig}`, ALIAS, COMMUNITY, NOW)).toBe(false)
    })

    it("refuses somebody else's alias", () => {
      expect(verifyPresenceCode(code, 'BBB', COMMUNITY, NOW)).toBe(false)
    })

    it('refuses another community', () => {
      expect(verifyPresenceCode(code, ALIAS, OTHER_COMMUNITY, NOW)).toBe(false)
    })

    it('refuses an empty alias - a registration without an address to come from', () => {
      expect(verifyPresenceCode(code, '', COMMUNITY, NOW)).toBe(false)
    })

    it('refuses a broken shape', () => {
      for (const broken of ['', 'x', '1.2.3', code.split('.')[0], `${code}x`, `0${code}`]) {
        expect(verifyPresenceCode(broken, ALIAS, COMMUNITY, NOW)).toBe(false)
      }
    })

    // The key is derived from the session secret: a code minted under one secret means
    // nothing to a server that holds another.
    it('refuses a code minted under a different secret', () => {
      const secret = CONFIG.JWT_SECRET
      try {
        CONFIG.JWT_SECRET = 'another secret'
        const foreign = mintPresenceCode(ALIAS, COMMUNITY, NOW).code
        CONFIG.JWT_SECRET = secret

        expect(verifyPresenceCode(foreign, ALIAS, COMMUNITY, NOW)).toBe(false)
      } finally {
        CONFIG.JWT_SECRET = secret
      }
    })
  })
})

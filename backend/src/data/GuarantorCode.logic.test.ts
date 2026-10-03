// AI-GENERATED — not an architecture reference
import { createCipheriv, createHmac } from 'node:crypto'
import { CONFIG } from '@/config'
import { CodeType } from './CodeType.enum'
import {
  GUARANTOR_CODE_VALID_MINUTES,
  mintGuarantorCode,
  verifyGuarantorCode,
} from './GuarantorCode.logic'

const USER_ID = 4711
const COMMUNITY = '0b9e5c2e-8d7a-4a8f-9d3f-4c7d2f6a1b01'
const OTHER_COMMUNITY = '6f1c7a5e-2b3d-4e8f-a1b2-c3d4e5f60718'
const NOW = new Date('2026-09-22T10:00:00.000Z')
const minutes = (n: number): Date => new Date(NOW.getTime() + n * 60 * 1000)
const nowSeconds = NOW.getTime() / 1000

// Seals a block the way the server does, for the cases no minted code can produce: another
// type, an expiry outside the window. Only the check behind the seal is under test here.
const sealedCode = (userId: bigint, type: number, exp: bigint): string => {
  const key = createHmac('sha256', CONFIG.JWT_SECRET).update(`guarantor-code|${COMMUNITY}`).digest()
  const block = Buffer.alloc(16)
  block.writeBigUInt64BE(userId, 0)
  block.writeBigUInt64BE((BigInt(type) << 56n) | (exp & ((1n << 56n) - 1n)), 8)
  const cipher = createCipheriv('aes-256-ecb', key, null)
  cipher.setAutoPadding(false)
  return `${exp}.${Buffer.concat([cipher.update(block), cipher.final()]).toString('base64url')}`
}

describe('GuarantorCode.logic', () => {
  describe('mintGuarantorCode', () => {
    it('runs out after the valid minutes, to the second', () => {
      const { code, expiresAt } = mintGuarantorCode(USER_ID, COMMUNITY, NOW)

      expect(expiresAt).toEqual(minutes(GUARANTOR_CODE_VALID_MINUTES))
      expect(code.split('.')[0]).toBe(String(expiresAt.getTime() / 1000))
    })

    // What a device counts down from the moment the answer arrives: the time left at `now`,
    // so the whole ten minutes on a whole second and less by the part of the second gone.
    it('says how much of the validity is left, to the millisecond', () => {
      const validMs = GUARANTOR_CODE_VALID_MINUTES * 60 * 1000
      const partway = new Date(NOW.getTime() + 400)

      expect(mintGuarantorCode(USER_ID, COMMUNITY, NOW).remainingMs).toBe(validMs)
      expect(mintGuarantorCode(USER_ID, COMMUNITY, partway).remainingMs).toBe(validMs - 400)
      const { expiresAt, remainingMs } = mintGuarantorCode(USER_ID, COMMUNITY, partway)
      expect(expiresAt.getTime() - partway.getTime()).toBe(remainingMs)
    })

    it('has the shape <unix seconds>.<22 base64url characters>', () => {
      expect(mintGuarantorCode(USER_ID, COMMUNITY, NOW).code).toMatch(/^\d{10}\.[A-Za-z0-9_-]{22}$/)
    })

    it('is a new code a second later, and another for another member', () => {
      const later = new Date(NOW.getTime() + 1000)
      const code = mintGuarantorCode(USER_ID, COMMUNITY, NOW).code

      expect(mintGuarantorCode(USER_ID, COMMUNITY, later).code).not.toBe(code)
      expect(mintGuarantorCode(USER_ID + 1, COMMUNITY, NOW).code).not.toBe(code)
    })

    // The block is encrypted: the user id is inside, but nothing outside can read it.
    it('does not show the user id', () => {
      const block = Buffer.from(
        mintGuarantorCode(USER_ID, COMMUNITY, NOW).code.split('.')[1],
        'base64url',
      )

      expect(block.readBigUInt64BE(0)).not.toBe(BigInt(USER_ID))
    })

    // A code for nobody would be a bug in the caller, not something to hand out.
    it('refuses a missing user id or community', () => {
      expect(() => mintGuarantorCode(0, COMMUNITY, NOW)).toThrow()
      expect(() => mintGuarantorCode(-1, COMMUNITY, NOW)).toThrow()
      expect(() => mintGuarantorCode(1.5, COMMUNITY, NOW)).toThrow()
      expect(() => mintGuarantorCode(USER_ID, '', NOW)).toThrow()
    })
  })

  describe('verifyGuarantorCode', () => {
    const { code } = mintGuarantorCode(USER_ID, COMMUNITY, NOW)

    it('names the member the code was minted for', () => {
      expect(verifyGuarantorCode(code, COMMUNITY, NOW)).toBe(USER_ID)
    })

    it('carries the largest user id JavaScript holds exactly', () => {
      const largest = mintGuarantorCode(Number.MAX_SAFE_INTEGER, COMMUNITY, NOW).code

      expect(verifyGuarantorCode(largest, COMMUNITY, NOW)).toBe(Number.MAX_SAFE_INTEGER)
    })

    it('accepts it until the last second before it runs out', () => {
      const lastSecond = new Date(minutes(GUARANTOR_CODE_VALID_MINUTES).getTime() - 1000)

      expect(verifyGuarantorCode(code, COMMUNITY, lastSecond)).toBe(USER_ID)
    })

    it('refuses it once it has run out', () => {
      expect(verifyGuarantorCode(code, COMMUNITY, minutes(GUARANTOR_CODE_VALID_MINUTES))).toBeNull()
      expect(verifyGuarantorCode(code, COMMUNITY, minutes(60))).toBeNull()
    })

    // A server whose clock runs a little behind the one that minted still takes the code.
    it('accepts a fresh code from a server whose clock runs up to a minute ahead', () => {
      expect(verifyGuarantorCode(code, COMMUNITY, new Date(NOW.getTime() - 60 * 1000))).toBe(
        USER_ID,
      )
      expect(verifyGuarantorCode(code, COMMUNITY, new Date(NOW.getTime() - 61 * 1000))).toBeNull()
    })

    it('refuses an altered block', () => {
      const [exp, block] = code.split('.')
      const altered = `${exp}.${block[0] === 'A' ? 'B' : 'A'}${block.slice(1)}`

      expect(verifyGuarantorCode(altered, COMMUNITY, NOW)).toBeNull()
    })

    // The low 7 bytes of the expiry are inside the block: moving it is a broken code.
    it('refuses a code whose expiry was pushed later or earlier', () => {
      const [exp, block] = code.split('.')

      expect(verifyGuarantorCode(`${Number(exp) + 30}.${block}`, COMMUNITY, NOW)).toBeNull()
      expect(verifyGuarantorCode(`${Number(exp) - 30}.${block}`, COMMUNITY, NOW)).toBeNull()
    })

    // The byte the block leaves out: the most significant one of the expiry. Setting it would
    // keep the check inside the block intact - the bound is what refuses it.
    it('refuses a code whose expiry was pushed by its most significant byte', () => {
      const [exp, block] = code.split('.')
      const pushed = BigInt(exp) + (1n << 56n)

      expect(verifyGuarantorCode(`${pushed}.${block}`, COMMUNITY, NOW)).toBeNull()
    })

    it('refuses a sealed code whose expiry lies further ahead than a code is ever valid', () => {
      const tooLate = BigInt(nowSeconds + GUARANTOR_CODE_VALID_MINUTES * 60 + 61)

      expect(
        verifyGuarantorCode(
          sealedCode(BigInt(USER_ID), CodeType.GUARANTOR, tooLate),
          COMMUNITY,
          NOW,
        ),
      ).toBeNull()
    })

    it('refuses a sealed block of another type', () => {
      const exp = BigInt(nowSeconds + 60)

      expect(
        verifyGuarantorCode(sealedCode(BigInt(USER_ID), CodeType.GUARANTOR, exp), COMMUNITY, NOW),
      ).toBe(USER_ID)
      expect(verifyGuarantorCode(sealedCode(BigInt(USER_ID), 0, exp), COMMUNITY, NOW)).toBeNull()
      expect(
        verifyGuarantorCode(
          sealedCode(BigInt(USER_ID), CodeType.GUARANTOR + 1, exp),
          COMMUNITY,
          NOW,
        ),
      ).toBeNull()
    })

    it('refuses a sealed block for user id 0 or one beyond what JavaScript holds exactly', () => {
      const exp = BigInt(nowSeconds + 60)

      expect(
        verifyGuarantorCode(sealedCode(0n, CodeType.GUARANTOR, exp), COMMUNITY, NOW),
      ).toBeNull()
      expect(
        verifyGuarantorCode(
          sealedCode(BigInt(Number.MAX_SAFE_INTEGER) + 1n, CodeType.GUARANTOR, exp),
          COMMUNITY,
          NOW,
        ),
      ).toBeNull()
    })

    it('refuses another community', () => {
      expect(verifyGuarantorCode(code, OTHER_COMMUNITY, NOW)).toBeNull()
    })

    // 22 characters hold 132 bits for 128: the last one has spellings the server never writes.
    it('takes only the spelling the server writes', () => {
      const [exp, block] = code.split('.')
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
      const last = alphabet.indexOf(block[21])
      const sameBytes = `${block.slice(0, 21)}${alphabet[last ^ 1]}`

      expect(Buffer.from(sameBytes, 'base64url')).toEqual(Buffer.from(block, 'base64url'))
      expect(verifyGuarantorCode(`${exp}.${sameBytes}`, COMMUNITY, NOW)).toBeNull()
      expect(verifyGuarantorCode(`0${code}`, COMMUNITY, NOW)).toBeNull()
    })

    it('refuses a broken shape', () => {
      for (const broken of [
        '',
        'x',
        '1.2.3',
        code.split('.')[0],
        `${code}x`,
        `${code.slice(0, -1)}`,
      ]) {
        expect(verifyGuarantorCode(broken, COMMUNITY, NOW)).toBeNull()
      }
    })

    // The key is derived from the session secret: a code minted under one secret means
    // nothing to a server that holds another.
    it('refuses a code minted under a different secret', () => {
      const secret = CONFIG.JWT_SECRET
      try {
        CONFIG.JWT_SECRET = 'another secret'
        const foreign = mintGuarantorCode(USER_ID, COMMUNITY, NOW).code
        CONFIG.JWT_SECRET = secret

        expect(verifyGuarantorCode(foreign, COMMUNITY, NOW)).toBeNull()
      } finally {
        CONFIG.JWT_SECRET = secret
      }
    })
  })
})

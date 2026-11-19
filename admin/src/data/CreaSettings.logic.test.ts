// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import {
  fastModeNoteKey,
  maySign,
  refusedSignerCode,
  signerName,
  signerReasonKey,
} from './CreaSettings.logic'

const signer = (firstName: string | null, lastName: string | null, alias: string | null) => ({
  userId: 7,
  firstName,
  lastName,
  alias,
  role: 'ADMIN',
  eligible: true,
  reason: 'OK',
})

describe('signerReasonKey', () => {
  it('words a known code', () => {
    expect(signerReasonKey('SCOPED')).toBe('crea.settings.signerReason.SCOPED')
  })

  it('has no words for a code it does not know', () => {
    expect(signerReasonKey('NEW_CODE')).toBeNull()
  })
})

describe('refusedSignerCode', () => {
  it('reads the code out of a refusal', () => {
    expect(refusedSignerCode('FIRST_CREATION_SIGNER_UNAVAILABLE: IS_MEMBER')).toBe('IS_MEMBER')
  })

  it('is null for any other failure', () => {
    expect(refusedSignerCode('no database')).toBeNull()
  })
})

describe('signerName', () => {
  it('is the name, of what there is of it', () => {
    expect(signerName(signer('Sig', null, 'sig'))).toBe('Sig')
  })

  it('is the alias without a name, and the number without either', () => {
    expect(signerName(signer(null, null, 'sig'))).toBe('sig')
    expect(signerName(signer(null, null, null))).toBe('#7')
  })
})

describe('maySign', () => {
  it('offers administrators and moderators', () => {
    expect(['ADMIN', 'MODERATOR', 'MODERATOR_AI'].every(maySign)).toBe(true)
  })

  it('offers no member', () => {
    expect(maySign('USER')).toBe(false)
    expect(maySign(null)).toBe(false)
  })
})

describe('fastModeNoteKey', () => {
  it('tells a busy fast mode apart from a refused one', () => {
    expect(fastModeNoteKey('rate_limited')).toBe('crea.settings.fastModeBusy')
    expect(fastModeNoteKey('refused')).toBe('crea.settings.fastModeRefused')
  })

  it('adds nothing where the fast mode was not asked for', () => {
    expect(fastModeNoteKey('off')).toBeNull()
  })
})

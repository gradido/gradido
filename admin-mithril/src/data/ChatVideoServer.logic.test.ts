// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { checkReasonKey, refusalWords, serverInput } from './ChatVideoServer.logic'

describe('checkReasonKey', () => {
  it('names a known reason, and nothing for an unknown one', () => {
    expect(checkReasonKey('NO_BOSH')).toBe('chatAdmin.reason.NO_BOSH')
    expect(checkReasonKey('SOMETHING_NEW')).toBeNull()
  })
})

describe('refusalWords', () => {
  it('reads why an entry is invalid, an unknown reason included', () => {
    expect(refusalWords('CHAT_VIDEO_SERVER_INVALID: NOT_HTTPS')).toEqual([
      'chatAdmin.errors.invalid.NOT_HTTPS',
    ])
    expect(refusalWords('x CHAT_VIDEO_SERVER_INVALID: ODD_THING')).toEqual([
      'chatAdmin.errors.invalid.other',
      { reason: 'ODD_THING' },
    ])
  })

  it('reads a duplicate and a vanished entry', () => {
    expect(refusalWords('CHAT_VIDEO_SERVER_DUPLICATE')).toEqual(['chatAdmin.errors.duplicate'])
    expect(refusalWords('CHAT_VIDEO_SERVER_NOT_FOUND')).toEqual(['chatAdmin.errors.notFound'])
  })

  it('leaves any other message to be shown as it came', () => {
    expect(refusalWords('no database')).toBeNull()
  })
})

describe('serverInput', () => {
  it('trims, and takes an empty field for none', () => {
    expect(
      serverInput({ baseUrl: ' https://a.org ', operator: ' Op ', roomPrefix: '  ', note: '' }),
    ).toEqual({ baseUrl: 'https://a.org', operator: 'Op', roomPrefix: null, note: null })
  })
})

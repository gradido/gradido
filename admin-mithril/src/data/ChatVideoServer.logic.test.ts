// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { checkedAgo, checkReasonKey, refusalWords, serverInput } from './ChatVideoServer.logic'

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

describe('checkedAgo', () => {
  const now = new Date('2026-11-09T12:00:00Z')
  const before = (seconds: number) => new Date(now.getTime() - seconds * 1000)

  it('takes the largest unit that fits', () => {
    expect(checkedAgo(before(59), now)).toEqual([-59, 'second'])
    expect(checkedAgo(before(60), now)).toEqual([-1, 'minute'])
    expect(checkedAgo(before(3599), now)).toEqual([-60, 'minute'])
    expect(checkedAgo(before(3600), now)).toEqual([-1, 'hour'])
    expect(checkedAgo(before(86399), now)).toEqual([-24, 'hour'])
    expect(checkedAgo(before(86400), now)).toEqual([-1, 'day'])
  })

  it('says at least a second, where the server clock runs ahead', () => {
    expect(checkedAgo(now, now)).toEqual([-1, 'second'])
    expect(checkedAgo(before(-30), now)).toEqual([-1, 'second'])
  })
})

describe('serverInput', () => {
  it('trims, and takes an empty field for none', () => {
    expect(
      serverInput({ baseUrl: ' https://a.org ', operator: ' Op ', roomPrefix: '  ', note: '' }),
    ).toEqual({ baseUrl: 'https://a.org', operator: 'Op', roomPrefix: null, note: null })
  })
})

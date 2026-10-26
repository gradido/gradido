// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'vitest'
import {
  THANKS_NUDGE_AFTER_CALL_MS,
  THANKS_NUDGE_HOLDS_MS,
  callNudgeState,
  passOnNudgeState,
} from './thanksNudge'

const MINUTE = 60 * 1000
const DAY = 24 * 60 * MINUTE

/** When the call began, in these tests: written and started at the same moment. */
const BEGAN = '2026-10-26T15:00:00.000Z'
const began = new Date(BEGAN).getTime()

/** A video invitation as `readChatVideoInvite` reads one: a call now, or one planned. */
const callNow = { room: 'https://meet.example/abc', topic: 'Videoanruf', when: null }
const planned = (start) => ({
  ...callNow,
  when: { start: new Date(start), end: new Date(new Date(start).getTime() + 60 * MINUTE) },
})

const ownMessage = (extra = {}) => ({
  mine: true,
  createdAt: BEGAN,
  deliveryState: 'DELIVERED',
  ...extra,
})

const call = (extra = {}) =>
  callNudgeState({
    invitation: callNow,
    message: ownMessage(),
    now: began + THANKS_NUDGE_AFTER_CALL_MS,
    transfers: [],
    seen: false,
    ...extra,
  })

const transfer = (typeId, balanceDate) => ({ typeId, balanceDate })

describe('the windows', () => {
  it('are half an hour and seven days', () => {
    expect(THANKS_NUDGE_AFTER_CALL_MS).toBe(30 * MINUTE)
    expect(THANKS_NUDGE_HOLDS_MS).toBe(7 * DAY)
  })
})

describe('the line after a video call', () => {
  describe('when it stands', () => {
    it('half an hour after the call began, to the millisecond', () => {
      expect(call({ now: began + 30 * MINUTE })).toBe('show')
    })

    it('not a moment before', () => {
      expect(call({ now: began + 30 * MINUTE - 1 })).toBe('hidden')
      expect(call({ now: began + 29 * MINUTE })).toBe('hidden')
      expect(call({ now: began })).toBe('hidden')
    })

    it('until seven days after the call began, to the millisecond', () => {
      expect(call({ now: began + 7 * DAY })).toBe('show')
      expect(call({ now: began + 7 * DAY + 1 })).toBe('hidden')
      expect(call({ now: began + 7 * DAY + MINUTE })).toBe('hidden')
    })

    // A time nobody can read is no occasion: no line at all, rather than one for ever.
    it('not where the beginning cannot be read', () => {
      expect(call({ message: ownMessage({ createdAt: 'not a time' }) })).toBe('hidden')
    })
  })

  describe('when the call began', () => {
    // A planned call began at the time it names, not when its invitation was written.
    it('at the planned time, for a call planned', () => {
      const start = began + 3 * DAY
      const invitation = planned(start)
      expect(call({ invitation, now: start + 29 * MINUTE })).toBe('hidden')
      expect(call({ invitation, now: start + 30 * MINUTE })).toBe('show')
      expect(call({ invitation, now: start + 7 * DAY })).toBe('show')
      expect(call({ invitation, now: start + 7 * DAY + 1 })).toBe('hidden')
    })

    // Written two hours ago, planned for tomorrow: half an hour after it was WRITTEN is nothing.
    it('not yet, for a call planned in the future', () => {
      const invitation = planned(began + DAY)
      expect(call({ invitation, now: began + 2 * 60 * MINUTE })).toBe('hidden')
    })

    // E-060: a changed invitation keeps its first start in its address (`revision`) for the
    // calendars, but the call is the one it shows now.
    it('at the time a changed invitation shows now, not the one it had first', () => {
      const first = began
      const moved = began + 2 * DAY
      const invitation = {
        ...planned(moved),
        revision: { first: new Date(first), sequence: 1 },
      }
      expect(call({ invitation, now: first + 30 * MINUTE })).toBe('hidden')
      expect(call({ invitation, now: moved + 30 * MINUTE })).toBe('show')
    })
  })

  describe('whom it is for', () => {
    // The one who invited is asked, never the one invited: nobody is pressed to thank for being
    // asked into a call (Bernd: "taktvoll").
    it('not under somebody else’s invitation', () => {
      expect(call({ message: ownMessage({ mine: false }) })).toBe('hidden')
    })

    it('not under a message that is no invitation the wallet reads as its own', () => {
      expect(call({ invitation: null })).toBe('hidden')
    })

    // E-059: the copy stands on the forwarder's side, but its words -- and the call -- are
    // somebody else's.
    it('not under an invitation forwarded from another conversation', () => {
      expect(call({ message: ownMessage({ forwarded: true }) })).toBe('hidden')
      expect(call({ message: ownMessage({ forwarded: false }) })).toBe('show')
    })

    // The window opens no room nobody else knows: an invitation that did not reach the other side
    // was no call. One whose fate is not known yet was opened, and counts.
    it('not under an invitation that did not reach the other side', () => {
      expect(call({ message: ownMessage({ deliveryState: 'FAILED' }) })).toBe('hidden')
      expect(call({ message: ownMessage({ deliveryState: 'PENDING' }) })).toBe('show')
      expect(call({ message: ownMessage({ deliveryState: null }) })).toBe('show')
    })

    it('not where it was answered on this device', () => {
      expect(call({ seen: true })).toBe('hidden')
    })
  })

  describe('a thank-you since', () => {
    it('not while the transfers between the two are not known', () => {
      expect(call({ transfers: null })).toBe('hidden')
    })

    it('ends the occasion: one sent to the person since the call began', () => {
      expect(call({ transfers: [transfer('SEND', BEGAN)] })).toBe('hidden')
      const later = new Date(began + 10 * MINUTE).toISOString()
      expect(call({ transfers: [transfer('SEND', later)] })).toBe('hidden')
    })

    it('does not end it: one sent before the call began', () => {
      const before = new Date(began - 1).toISOString()
      expect(call({ transfers: [transfer('SEND', before)] })).toBe('show')
    })

    // What the other one sent is their thank-you, not the member's.
    it('does not end it: one received from the person', () => {
      const later = new Date(began + 10 * MINUTE).toISOString()
      expect(call({ transfers: [transfer('RECEIVE', later)] })).toBe('show')
    })

    // A planned call: what was sent between writing the invitation and the call is no thanks for
    // the call.
    it('counts from the planned beginning, not from when the invitation was written', () => {
      const start = began + DAY
      const between = new Date(began + 60 * MINUTE).toISOString()
      expect(
        call({
          invitation: planned(start),
          now: start + 30 * MINUTE,
          transfers: [transfer('SEND', between)],
        }),
      ).toBe('show')
    })
  })
})

describe('the line in a thank-you received', () => {
  const RECEIVED = '2026-10-26T15:00:00.000Z'
  const received = new Date(RECEIVED).getTime()
  const booking = (extra = {}) => ({
    id: 7,
    typeId: 'RECEIVE',
    balanceDate: RECEIVED,
    linkedUser: { gradidoID: 'lena-id', alias: 'Lena' },
    ...extra,
  })
  const passOn = (extra = {}) =>
    passOnNudgeState({ transaction: booking(), now: received + MINUTE, seen: false, ...extra })

  it('stands for a thank-you received from a person', () => {
    expect(passOn()).toBe('show')
    expect(passOn({ now: received })).toBe('show')
  })

  it('until seven days after it came, to the millisecond', () => {
    expect(passOn({ now: received + 7 * DAY })).toBe('show')
    expect(passOn({ now: received + 7 * DAY + 1 })).toBe('hidden')
  })

  // The device's clock a little behind the server's: the thank-you has just come.
  it('also where the booking’s time lies a little ahead of the clock', () => {
    expect(passOn({ now: received - 2 * MINUTE })).toBe('show')
  })

  it('not in a booking of one’s own sending, nor in a creation', () => {
    expect(passOn({ transaction: booking({ typeId: 'SEND' }) })).toBe('hidden')
    expect(passOn({ transaction: booking({ typeId: 'CREATION' }) })).toBe('hidden')
    expect(passOn({ transaction: booking({ typeId: 'DECAY' }) })).toBe('hidden')
  })

  // The row's own condition for a counterparty (GddTransaction, `hasCounterparty`).
  it('not where nobody is named on the other side', () => {
    expect(passOn({ transaction: booking({ linkedUser: null }) })).toBe('hidden')
    expect(passOn({ transaction: booking({ linkedUser: { alias: 'Lena' } }) })).toBe('hidden')
  })

  it('not where it was answered on this device', () => {
    expect(passOn({ seen: true })).toBe('hidden')
  })

  it('not where the time cannot be read', () => {
    expect(passOn({ transaction: booking({ balanceDate: 'not a time' }) })).toBe('hidden')
  })
})

// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'vitest'
import {
  THANKS_ARRIVAL_MOST,
  THANKS_NUDGE_AFTER_CALL_MS,
  THANKS_NUDGE_HOLDS_MS,
  arrivalItems,
  callNudgeStart,
  callNudgeState,
  membersToThank,
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

/** Somebody else's invitation, written when `BEGAN` says: a message from the other side. */
const theirMessage = (extra = {}) => ({
  mine: false,
  createdAt: BEGAN,
  deliveryState: null,
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

/** The member's own community, for a booking that names none (KF-004). */
const HOME = 'home-uuid'
const pairOf = (gradidoID) => ({ communityUuid: HOME, gradidoID })
const ANNA = pairOf('anna-id')
const CARLA = pairOf('carla-id')
const EMMA = pairOf('emma-id')

/** The members of a group as the thread makes them for the choice: `{ key, label, avatar, user }`. */
const memberEntry = (pair, label) => ({
  key: `${pair.communityUuid}/${pair.gradidoID}`,
  label,
  avatar: { initials: label.slice(0, 2) },
  user: { ...pair, alias: label },
})
const GROUP_MEMBERS = [
  memberEntry(ANNA, 'Anna-Sonne'),
  memberEntry(CARLA, 'Carla-Sonne'),
  memberEntry(EMMA, 'Oma-Emma'),
]

/** One of the member's own bookings, as the booking list names its other side. */
const sentTo = (person, balanceDate) => ({ typeId: 'SEND', balanceDate, linkedUser: { ...person } })
const receivedFrom = (person, balanceDate) => ({
  typeId: 'RECEIVE',
  balanceDate,
  linkedUser: { ...person },
})

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
    // E-043 C: whoever went into the call from this wallet. Without the click the device knows,
    // somebody else's invitation gets no line -- the link may have reached the member another way,
    // or another device (Bernd, 26.10.2026: "ein Test-Klick zu anderer Zeit" is the price of the
    // click; no click is no line).
    it('not under somebody else’s invitation the member did not go into from this wallet', () => {
      expect(call({ message: theirMessage() })).toBe('hidden')
      expect(call({ message: theirMessage(), videoJoinedAt: null })).toBe('hidden')
      expect(call({ message: theirMessage(), videoJoinedAt: undefined })).toBe('hidden')
    })

    it('under somebody else’s invitation the member went into from this wallet', () => {
      expect(call({ message: theirMessage(), videoJoinedAt: began })).toBe('show')
    })

    it('not under a message that is no invitation the wallet reads as its own', () => {
      expect(call({ invitation: null })).toBe('hidden')
      expect(call({ invitation: null, message: theirMessage(), videoJoinedAt: began })).toBe(
        'hidden',
      )
    })

    // E-059, W10: the copy stands on the forwarder's side, but its words -- and the call -- are
    // somebody else's. With a click as without.
    it('not under an invitation forwarded from another conversation', () => {
      expect(call({ message: ownMessage({ forwarded: true }) })).toBe('hidden')
      expect(call({ message: ownMessage({ forwarded: false }) })).toBe('show')
      expect(call({ message: ownMessage({ forwarded: true }), videoJoinedAt: began })).toBe(
        'hidden',
      )
      expect(call({ message: theirMessage({ forwarded: true }), videoJoinedAt: began })).toBe(
        'hidden',
      )
      expect(call({ message: theirMessage({ forwarded: false }), videoJoinedAt: began })).toBe(
        'show',
      )
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
      expect(call({ message: theirMessage(), videoJoinedAt: began, seen: true })).toBe('hidden')
    })
  })

  // For the one invited the call begins with their click (E-043 C, W9): whoever comes in later
  // than the one who invited would otherwise have the line at once.
  describe('for the one invited, from their click', () => {
    const theirs = (extra = {}) => call({ message: theirMessage(), ...extra })

    it('half an hour after the click, not after the invitation was written', () => {
      const now = began + 45 * MINUTE
      expect(theirs({ now, videoJoinedAt: now - 20 * MINUTE })).toBe('hidden')
      expect(theirs({ now, videoJoinedAt: now - 30 * MINUTE + 1 })).toBe('hidden')
      expect(theirs({ now, videoJoinedAt: now - 30 * MINUTE })).toBe('show')
    })

    it('until seven days after the click, to the millisecond', () => {
      const clicked = began + 2 * DAY
      expect(theirs({ videoJoinedAt: clicked, now: clicked + 7 * DAY })).toBe('show')
      expect(theirs({ videoJoinedAt: clicked, now: clicked + 7 * DAY + 1 })).toBe('hidden')
    })

    // Festlegung 3: a click days before the meeting is no conversation.
    it('for a call planned, from the later of the click and the planned time', () => {
      const start = began + DAY
      const invitation = planned(start)
      // Clicked a day ahead, to try the link: the call begins at its time.
      expect(theirs({ invitation, videoJoinedAt: began, now: start + 29 * MINUTE })).toBe('hidden')
      expect(theirs({ invitation, videoJoinedAt: began, now: start + 30 * MINUTE })).toBe('show')
      // Clicked ten minutes into it: from the click.
      const late = start + 10 * MINUTE
      expect(theirs({ invitation, videoJoinedAt: late, now: late + 29 * MINUTE })).toBe('hidden')
      expect(theirs({ invitation, videoJoinedAt: late, now: late + 30 * MINUTE })).toBe('show')
    })

    it('not where the click cannot be read', () => {
      expect(theirs({ videoJoinedAt: Number.NaN })).toBe('hidden')
    })

    // Falle 11: for the one who invited nothing changes -- a click of theirs moves nothing.
    it('leaves one’s own invitation as it was, with a click as without', () => {
      const clicked = began + 20 * MINUTE
      expect(call({ videoJoinedAt: clicked, now: began + 30 * MINUTE })).toBe('show')
      expect(call({ videoJoinedAt: began - DAY, now: began + 29 * MINUTE })).toBe('hidden')
      expect(call({ videoJoinedAt: clicked, now: began + 7 * DAY + 1 })).toBe('hidden')
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

    // Under somebody else's invitation, from the member's click: what they sent the one who
    // invited before going into the room is no thanks for this call.
    it('counts from the click, under somebody else’s invitation', () => {
      const clicked = began + 15 * MINUTE
      const theirs = (sentAt) =>
        call({
          message: theirMessage(),
          videoJoinedAt: clicked,
          now: clicked + 30 * MINUTE,
          transfers: [transfer('SEND', new Date(sentAt).toISOString())],
        })
      expect(theirs(clicked - 1)).toBe('show')
      expect(theirs(clicked)).toBe('hidden')
      expect(theirs(clicked + 10 * MINUTE)).toBe('hidden')
    })
  })

  // Whom to thank is the member's choice among the members (Bernd, 28.10.2026), and what was
  // thanked is what was booked, as with one person (E-043 B, 05.11.2026): a member thanked since
  // the call began is not offered again, and once all are thanked, the line goes.
  describe('in a group', () => {
    const inGroup = { group: true, members: GROUP_MEMBERS, ownCommunityUuid: HOME, transfers: [] }
    const later = new Date(began + 10 * MINUTE).toISOString()

    it('stands where nobody in it was thanked since the call began', () => {
      expect(call(inGroup)).toBe('show')
    })

    // As with one person: before the member's own transfers are in, a thank-you on its way would
    // stand under a line for a moment -- and where they could not be asked, none is known.
    it('not while the member’s own transfers are not known', () => {
      expect(call({ ...inGroup, transfers: null })).toBe('hidden')
    })

    it('keeps the half hour and the seven days, to the millisecond', () => {
      const at = (now) => call({ ...inGroup, now })
      expect(at(began + THANKS_NUDGE_AFTER_CALL_MS - 1)).toBe('hidden')
      expect(at(began + THANKS_NUDGE_AFTER_CALL_MS)).toBe('show')
      expect(at(began + THANKS_NUDGE_HOLDS_MS)).toBe('show')
      expect(at(began + THANKS_NUDGE_HOLDS_MS + 1)).toBe('hidden')
    })

    // A call planned in the group, the invitation duplicated from last week's.
    it('counts from the planned beginning there too', () => {
      const start = began + 7 * DAY
      const occasion = { ...inGroup, invitation: planned(start) }
      expect(call({ ...occasion, now: start + 29 * MINUTE })).toBe('hidden')
      expect(call({ ...occasion, now: start + 30 * MINUTE })).toBe('show')
      // A thank-you to everybody between writing the invitation and the call is none for the call.
      const between = new Date(began + 60 * MINUTE).toISOString()
      const all = [ANNA, CARLA, EMMA].map((person) => sentTo(person, between))
      expect(call({ ...occasion, transfers: all, now: start + 30 * MINUTE })).toBe('show')
    })

    it('ends for a member thanked since the call began, stays for the others, and ends when all are thanked', () => {
      expect(call({ ...inGroup, transfers: [sentTo(CARLA, later)] })).toBe('show')
      expect(call({ ...inGroup, transfers: [sentTo(CARLA, later), sentTo(ANNA, later)] })).toBe(
        'show',
      )
      const all = [ANNA, CARLA, EMMA].map((person) => sentTo(person, later))
      expect(call({ ...inGroup, transfers: all })).toBe('hidden')
      // To the millisecond of the beginning, as with one person.
      const atBeginning = [ANNA, CARLA, EMMA].map((person) => sentTo(person, BEGAN))
      expect(call({ ...inGroup, transfers: atBeginning })).toBe('hidden')
    })

    it('stands on where what was booked is no thank-you of the member’s for the call', () => {
      const before = new Date(began - 1).toISOString()
      const sentBefore = [ANNA, CARLA, EMMA].map((person) => sentTo(person, before))
      expect(call({ ...inGroup, transfers: sentBefore })).toBe('show')
      const cameIn = [ANNA, CARLA, EMMA].map((person) => receivedFrom(person, later))
      expect(call({ ...inGroup, transfers: cameIn })).toBe('show')
    })

    // Nobody to choose: before the window has the members, or where the member is alone in it.
    it('not where there is nobody to choose', () => {
      expect(call({ ...inGroup, members: [] })).toBe('hidden')
      expect(call({ ...inGroup, members: undefined })).toBe('hidden')
    })

    it('not where it was answered on this device', () => {
      expect(call({ ...inGroup, seen: true })).toBe('hidden')
    })

    it('not under somebody else’s invitation without a click, a forwarded copy, or one that did not arrive', () => {
      expect(call({ ...inGroup, message: theirMessage() })).toBe('hidden')
      expect(call({ ...inGroup, message: ownMessage({ forwarded: true }) })).toBe('hidden')
      expect(
        call({ ...inGroup, message: theirMessage({ forwarded: true }), videoJoinedAt: began }),
      ).toBe('hidden')
      expect(call({ ...inGroup, message: ownMessage({ deliveryState: 'FAILED' }) })).toBe('hidden')
    })

    // E-043 C: Anna invited the group, the member clicked her link -- half an hour after that click
    // the line stands, and a member thanked since the CLICK is no longer among those to thank.
    describe('under somebody else’s invitation the member went into', () => {
      const clicked = began + 20 * MINUTE
      const theirs = (extra = {}) =>
        call({
          ...inGroup,
          message: theirMessage(),
          videoJoinedAt: clicked,
          now: clicked + 30 * MINUTE,
          ...extra,
        })

      it('stands half an hour after the click, and not a moment before', () => {
        expect(theirs()).toBe('show')
        expect(theirs({ now: clicked + 30 * MINUTE - 1 })).toBe('hidden')
      })

      it('ends when all are thanked since the click, not since the invitation', () => {
        const sinceClick = new Date(clicked + MINUTE).toISOString()
        const beforeClick = new Date(clicked - MINUTE).toISOString()
        const all = (at) => [ANNA, CARLA, EMMA].map((person) => sentTo(person, at))
        expect(theirs({ transfers: all(sinceClick) })).toBe('hidden')
        expect(theirs({ transfers: all(beforeClick) })).toBe('show')
      })
    })
  })
})

describe('the beginning a line after a call counts from', () => {
  const start = (extra = {}) =>
    callNudgeStart({
      invitation: callNow,
      message: ownMessage(),
      now: began + THANKS_NUDGE_AFTER_CALL_MS,
      seen: false,
      ...extra,
    })

  it('is when the invitation was written, for a call now', () => {
    expect(start()).toBe(began)
  })

  it('is the planned time, for a call planned', () => {
    const planned3 = began + 3 * DAY
    expect(start({ invitation: planned(planned3), now: planned3 + 45 * MINUTE })).toBe(planned3)
  })

  // What the group's thread asks the member's own transfers back to, and what a thank-you counts
  // from (membersToThank): under somebody else's invitation, the click.
  it('is the member’s click, under somebody else’s invitation', () => {
    const clicked = began + 25 * MINUTE
    expect(
      start({ message: theirMessage(), videoJoinedAt: clicked, now: clicked + 45 * MINUTE }),
    ).toBe(clicked)
  })

  it('is the later of the click and the planned time, under somebody else’s call planned', () => {
    const planned3 = began + 3 * DAY
    const invitation = planned(planned3)
    const message = theirMessage()
    const now = planned3 + 45 * MINUTE
    expect(start({ invitation, message, videoJoinedAt: began, now })).toBe(planned3)
    expect(start({ invitation, message, videoJoinedAt: planned3 + 5 * MINUTE, now })).toBe(
      planned3 + 5 * MINUTE,
    )
  })

  it('is one’s own invitation’s, whatever was clicked', () => {
    expect(start({ videoJoinedAt: began + 10 * MINUTE, now: began + 45 * MINUTE })).toBe(began)
  })

  // The thread asks the transfers only where a line is due by its time: nothing before.
  it('is none where the line is not due by its time, or not the member’s to have', () => {
    expect(start({ now: began + THANKS_NUDGE_AFTER_CALL_MS - 1 })).toBeNull()
    expect(start({ now: began + THANKS_NUDGE_HOLDS_MS + 1 })).toBeNull()
    expect(start({ message: theirMessage() })).toBeNull()
    expect(start({ message: ownMessage({ forwarded: true }) })).toBeNull()
    expect(start({ message: ownMessage({ deliveryState: 'FAILED' }) })).toBeNull()
    expect(start({ message: ownMessage({ createdAt: 'not a time' }) })).toBeNull()
    expect(start({ invitation: null })).toBeNull()
    expect(start({ seen: true })).toBeNull()
    const clicked = { message: theirMessage(), videoJoinedAt: began }
    expect(start({ ...clicked, now: began + THANKS_NUDGE_AFTER_CALL_MS - 1 })).toBeNull()
    expect(start({ ...clicked, now: began + THANKS_NUDGE_HOLDS_MS + 1 })).toBeNull()
    expect(start({ ...clicked, message: theirMessage({ forwarded: true }) })).toBeNull()
    expect(start({ ...clicked, seen: true })).toBeNull()
  })
})

describe('whom a line after a call in a group leaves to thank', () => {
  const later = new Date(began + 10 * MINUTE).toISOString()
  const left = (transfers, extra = {}) =>
    membersToThank({
      members: GROUP_MEMBERS,
      transfers,
      start: began,
      ownCommunityUuid: HOME,
      ...extra,
    }).map((member) => member.label)

  it('everybody, where nothing was booked since the call began', () => {
    expect(left([])).toEqual(['Anna-Sonne', 'Carla-Sonne', 'Oma-Emma'])
  })

  // W8: the thanked are not marked, they are simply not there -- and the others keep their places.
  it('all but those the member sent a transfer to since the call began, in their order', () => {
    expect(left([sentTo(CARLA, later)])).toEqual(['Anna-Sonne', 'Oma-Emma'])
    expect(left([sentTo(ANNA, later), sentTo(EMMA, later)])).toEqual(['Carla-Sonne'])
    expect(left([sentTo(ANNA, later), sentTo(CARLA, later), sentTo(EMMA, later)])).toEqual([])
  })

  it('counts a transfer from the very millisecond the call began', () => {
    expect(left([sentTo(CARLA, BEGAN)])).toEqual(['Anna-Sonne', 'Oma-Emma'])
    expect(left([sentTo(CARLA, new Date(began - 1).toISOString())])).toEqual([
      'Anna-Sonne',
      'Carla-Sonne',
      'Oma-Emma',
    ])
  })

  // What came in is the other one's thank-you, not the member's.
  it('not what came in from a member', () => {
    expect(left([receivedFrom(CARLA, later)])).toEqual(['Anna-Sonne', 'Carla-Sonne', 'Oma-Emma'])
  })

  it('not a transfer to somebody outside the group', () => {
    const lena = { communityUuid: HOME, gradidoID: 'lena-id' }
    expect(left([sentTo(lena, later)])).toEqual(['Anna-Sonne', 'Carla-Sonne', 'Oma-Emma'])
  })

  // The same person in another community is another person (KF-004).
  it('not a transfer to the same Gradido ID in another community', () => {
    const elsewhere = { ...CARLA, communityUuid: 'other-uuid' }
    expect(left([sentTo(elsewhere, later)])).toEqual(['Anna-Sonne', 'Carla-Sonne', 'Oma-Emma'])
  })

  // A booking that names nobody on the other side thanked nobody here.
  it('not a booking that names nobody', () => {
    const nobody = { typeId: 'SEND', balanceDate: later, linkedUser: null }
    const noId = { typeId: 'SEND', balanceDate: later, linkedUser: { communityUuid: HOME } }
    expect(left([nobody, noId])).toEqual(['Anna-Sonne', 'Carla-Sonne', 'Oma-Emma'])
  })

  it('not a booking whose time cannot be read', () => {
    expect(left([sentTo(CARLA, 'not a time')])).toEqual(['Anna-Sonne', 'Carla-Sonne', 'Oma-Emma'])
  })

  // The server compares uuids without regard to case, and so does the chat (chatMemberKey).
  it('without regard to case in the pair', () => {
    const shouted = { communityUuid: 'HOME-UUID', gradidoID: 'CARLA-ID' }
    expect(left([sentTo(shouted, later)])).toEqual(['Anna-Sonne', 'Oma-Emma'])
  })

  // KF-004: a booking with a member of this community may name no community -- it is this one.
  it('reads a booking that names no community as one in the member’s own', () => {
    const plain = { communityUuid: null, gradidoID: 'carla-id' }
    expect(left([sentTo(plain, later)])).toEqual(['Anna-Sonne', 'Oma-Emma'])
    // A member of another community is not met by a booking without one.
    const emma = GROUP_MEMBERS[2]
    const visitor = { ...emma, user: { ...emma.user, communityUuid: 'other-uuid' } }
    const members = [GROUP_MEMBERS[0], visitor]
    const plainEmma = { communityUuid: null, gradidoID: 'emma-id' }
    expect(left([sentTo(plainEmma, later)], { members })).toEqual(['Anna-Sonne', 'Oma-Emma'])
  })

  it('everybody, where the transfers are not known', () => {
    expect(left(null)).toEqual(['Anna-Sonne', 'Carla-Sonne', 'Oma-Emma'])
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

describe('the thank-yous the tile on the overview shows', () => {
  const NOW = new Date('2026-10-27T05:00:00.000Z').getTime()
  /** A moment `ago` milliseconds before NOW, as the server sends it. */
  const before = (ago) => new Date(NOW - ago).toISOString()
  const thanks = (id, extra = {}) => ({
    id,
    typeId: 'RECEIVE',
    balanceDate: before(id * MINUTE),
    canReact: true,
    reaction: null,
    linkedUser: { gradidoID: `giver-${id}`, alias: `giver${id}` },
    ...extra,
  })
  const nothingSeen = () => false
  const shown = (transactions, extra = {}) =>
    arrivalItems({ transactions, now: NOW, seen: nothingSeen, ...extra }).map(
      (booking) => booking.id,
    )

  it('shows at most three', () => {
    expect(THANKS_ARRIVAL_MOST).toBe(3)
  })

  it('shows a thank-you received from a person who may be answered, with no reaction yet', () => {
    expect(shown([thanks(1)])).toEqual([1])
  })

  it('hands back the bookings themselves, as they came', () => {
    const booking = thanks(1)
    expect(arrivalItems({ transactions: [booking], now: NOW, seen: nothingSeen })[0]).toBe(booking)
  })

  // The guard of the whole moment: a thank-you answered already is no longer news.
  it('leaves out a thank-you that has a reaction', () => {
    expect(shown([thanks(1, { reaction: '❤️' }), thanks(2)])).toEqual([2])
  })

  // Bernd (08.11.2026): a message to the giver after it, or Gradido sent back, is an answer as
  // well -- whatever the way. The server says it with the booking; the device decides nothing.
  it('leaves out what the member answered since, the server’s word', () => {
    expect(shown([thanks(1, { answered: true }), thanks(2, { answered: false })])).toEqual([2])
    // A server that does not say it yet: the tile shows the thank-you as before.
    expect(shown([thanks(3)])).toEqual([3])
  })

  it('leaves out what the member may not react to', () => {
    expect(shown([thanks(1, { canReact: false }), thanks(2)])).toEqual([2])
    // A server that does not say so: no.
    expect(shown([thanks(1, { canReact: undefined })])).toEqual([])
  })

  it('leaves out one’s own sending, a creation, and the decay', () => {
    expect(
      shown([
        thanks(1, { typeId: 'SEND' }),
        thanks(2, { typeId: 'CREATION' }),
        thanks(3, { typeId: 'DECAY' }),
        thanks(4),
      ]),
    ).toEqual([4])
  })

  // The row's own condition for a counterparty (GddTransaction, `hasCounterparty`).
  it('leaves out a booking where nobody is named on the other side', () => {
    expect(
      shown([thanks(1, { linkedUser: null }), thanks(2, { linkedUser: { alias: 'x' } })]),
    ).toEqual([])
  })

  it('until seven days after it came, to the millisecond', () => {
    expect(shown([thanks(1, { balanceDate: before(7 * DAY) })])).toEqual([1])
    expect(shown([thanks(1, { balanceDate: before(7 * DAY + 1) })])).toEqual([])
  })

  // The device's clock a little behind the server's: the thank-you has just come.
  it('also where the booking’s time lies a little ahead of the clock', () => {
    expect(shown([thanks(1, { balanceDate: before(-2 * MINUTE) })])).toEqual([1])
  })

  it('leaves out a booking whose time cannot be read', () => {
    expect(shown([thanks(1, { balanceDate: 'not a time' }), thanks(2)])).toEqual([2])
  })

  // "Später" is asked by its own name and the booking's id: the line "Dank weitergeben?" in the
  // opened row answered on this device is something else, and puts nothing aside here.
  it('leaves out what was put aside on this device, asked as `arrival` by the booking’s id', () => {
    const asked = []
    const seen = (kind, id) => {
      asked.push([kind, id])
      return kind === 'arrival' && id === 1
    }
    expect(shown([thanks(1), thanks(2)], { seen })).toEqual([2])
    expect(asked).toContainEqual(['arrival', 1])
    expect(asked).toContainEqual(['arrival', 2])
    expect(shown([thanks(1)], { seen: (kind) => kind === 'pass-on' })).toEqual([1])
  })

  it('puts the newest first, whatever order the list came in', () => {
    expect(shown([thanks(3), thanks(1), thanks(2)])).toEqual([1, 2, 3])
  })

  it('puts the later id first where two came at the same moment', () => {
    const at = before(MINUTE)
    expect(shown([thanks(4, { balanceDate: at }), thanks(9, { balanceDate: at })])).toEqual([9, 4])
  })

  it('keeps the three newest of more', () => {
    expect(shown([thanks(4), thanks(2), thanks(5), thanks(1), thanks(3)])).toEqual([1, 2, 3])
  })

  it('counts only what it shows towards the three', () => {
    expect(
      shown([thanks(1, { reaction: '👍' }), thanks(2), thanks(3), thanks(4), thanks(5)]),
    ).toEqual([2, 3, 4])
  })

  it('shows nothing for a list without a thank-you to show, or for no list', () => {
    expect(shown([thanks(1, { typeId: 'SEND' }), thanks(2, { reaction: '🙏' })])).toEqual([])
    expect(shown([])).toEqual([])
    expect(shown(null)).toEqual([])
    expect(shown(undefined)).toEqual([])
  })
})

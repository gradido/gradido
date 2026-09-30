// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  chatVideoCalendarFile,
  chatVideoCalendarFileName,
  chatVideoCalendarUid,
  chatVideoDay,
  chatVideoPlannedCall,
  chatVideoWhen,
  chatVideoZone,
  saveChatVideoCalendarFile,
  chatVideoInvitation,
  chatVideoNextWeek,
} from './chatVideoCalendar'
import { withChatVideoTopic } from './chatVideoTopic'

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

const ROOM = 'https://meet.systemli.org/q2w3e4r5t6y7'
const START = new Date('2026-09-30T13:00:00.000Z')
const END = new Date('2026-09-30T14:00:00.000Z')
const PLANNED = withChatVideoTopic(ROOM, 'Projektbesprechung', { start: START, end: END })
const INVITATION = `📹 Videoanruf: Projektbesprechung\n📅 Mittwoch, 30. September 2026\n🕒 15:00–16:00 Uhr (MESZ)\nDer Raum liegt auf einem Jitsi-Server von Systemli — ein Vorschlag, kein Dienst von Gradido: ${PLANNED}`

/** The file's content lines, folded lines joined again (RFC 5545, 3.1). */
const unfolded = (file) => file.replace(/\r\n /g, '').split('\r\n')

const aFile = (overrides = {}) =>
  chatVideoCalendarFile({
    start: START,
    end: END,
    title: 'Projektbesprechung – Anna-Sonne',
    description: INVITATION,
    url: PLANNED,
    uid: 'q2w3e4r5t6y7-1790773200@gradido',
    now: new Date('2026-09-27T07:30:15.000Z'),
    ...overrides,
  })

// V5b (Bernd, 27.09.2026): "in den gängigen Kalenderformaten, also beim Apple ist es zum Beispiel
// iCal" -- one iCalendar file for Apple's, Google's and Microsoft's calendars alike.
describe('the calendar file of a planned call', () => {
  it('is one event in one calendar, its times in UTC', () => {
    const lines = unfolded(aFile())
    expect(lines).toEqual([
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Gradido//Videoanruf//DE',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:q2w3e4r5t6y7-1790773200@gradido',
      'DTSTAMP:20260927T073015Z',
      'DTSTART:20260930T130000Z',
      'DTEND:20260930T140000Z',
      'SUMMARY:Projektbesprechung – Anna-Sonne',
      `DESCRIPTION:${INVITATION.replace(/,/g, '\\,').replace(/\n/g, '\\n')}`,
      `LOCATION:${PLANNED}`,
      `URL:${PLANNED}`,
      'END:VEVENT',
      'END:VCALENDAR',
      '',
    ])
  })

  it('ends every line on CRLF, the last one too', () => {
    const file = aFile()
    expect(file.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(file.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/)
  })

  it('escapes backslash, semicolon, comma and line breaks in its texts', () => {
    const lines = unfolded(aFile({ title: 'A\\B; C, D', description: 'eins\r\nzwei\ndrei' }))
    expect(lines).toContain('SUMMARY:A\\\\B\\; C\\, D')
    expect(lines).toContain('DESCRIPTION:eins\\nzwei\\ndrei')
  })

  // RFC 5545: no line longer than 75 octets -- and a fold never cuts a character in two.
  it('folds its lines at 75 octets, never inside a character', () => {
    const file = aFile({ title: 'Ümläute ☕ und 🌳 '.repeat(12) })
    for (const line of file.split('\r\n')) {
      expect(new TextEncoder().encode(line).length, line).toBeLessThanOrEqual(75)
    }
    expect(unfolded(file)).toContain(`SUMMARY:${'Ümläute ☕ und 🌳 '.repeat(12)}`)
    expect(file).not.toContain('�')
  })

  it('is named by its room and its start, the same for the same call', () => {
    expect(chatVideoCalendarUid(ROOM, START)).toBe('q2w3e4r5t6y7-1790773200@gradido')
    expect(chatVideoCalendarUid('https://fairmeeting.net/GradidoAkademieab12cd34ef56', START)).toBe(
      'GradidoAkademieab12cd34ef56-1790773200@gradido',
    )
  })

  it('is saved under the topic and the day, with nothing a file system minds', () => {
    const day = new Date(2026, 8, 30, 15, 0)
    expect(chatVideoCalendarFileName('Projektbesprechung', day)).toBe(
      'Projektbesprechung-2026-09-30.ics',
    )
    expect(chatVideoCalendarFileName('Lesekreis: „Momo“ / Teil 2?', day)).toBe(
      'Lesekreis-„Momo“-Teil-2-2026-09-30.ics',
    )
    expect(chatVideoCalendarFileName('***', day)).toBe('video-2026-09-30.ics')
  })

  it('is handed to the browser to save, in a link of its own, as a calendar', () => {
    vi.useFakeTimers()
    // jsdom has no object addresses for blobs: the test lends the two functions.
    const blobs = []
    URL.createObjectURL = (blob) => {
      blobs.push(blob)
      return 'blob:calendar'
    }
    const revoke = vi.fn()
    URL.revokeObjectURL = revoke
    const clicked = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      clicked.push({ href: this.href, download: this.download })
    })

    saveChatVideoCalendarFile('Projektbesprechung-2026-09-30.ics', aFile())

    expect(clicked).toEqual([
      { href: 'blob:calendar', download: 'Projektbesprechung-2026-09-30.ics' },
    ])
    expect(blobs[0].type).toBe('text/calendar;charset=utf-8')
    expect(revoke).not.toHaveBeenCalled()
    vi.advanceTimersByTime(10000)
    expect(revoke).toHaveBeenCalledWith('blob:calendar')
    delete URL.createObjectURL
    delete URL.revokeObjectURL
  })
})

describe('the time of a call from the fields', () => {
  it('is the day and two times of day, on the member’s own clock', () => {
    const when = chatVideoWhen('2026-09-30', '15:00', '16:30')
    expect(when.start).toEqual(new Date(2026, 8, 30, 15, 0))
    expect(when.end).toEqual(new Date(2026, 8, 30, 16, 30))
  })

  it.each([
    ['no day', '', '15:00', '16:00'],
    ['no start', '2026-09-30', '', '16:00'],
    ['no end', '2026-09-30', '15:00', ''],
    ['the end at the start', '2026-09-30', '15:00', '15:00'],
    ['the end before the start', '2026-09-30', '15:00', '14:00'],
    ['a day that is none', '2026-13-45', '15:00', '16:00'],
    // `Date` would take it as the 2nd of March.
    ['a day the month does not have', '2026-02-30', '15:00', '16:00'],
  ])('is none with %s', (_, day, from, to) => {
    expect(chatVideoWhen(day, from, to)).toBeNull()
  })
})

describe('the day and the zone in words', () => {
  it('writes the day in full, in the member’s language', () => {
    const day = new Date(2026, 8, 30, 15, 0)
    expect(chatVideoDay(day, 'de')).toBe('Mittwoch, 30. September 2026')
    expect(chatVideoDay(day, 'en')).toBe('Wednesday, September 30, 2026')
  })

  // The test runs in UTC (TZ=UTC): the short name there, and a name at all.
  it('names the time zone short, in the member’s language', () => {
    expect(chatVideoZone(START, 'de')).toBe('UTC')
    expect(chatVideoZone(START, 'en')).toBe('UTC')
  })
})

// The suite's clock is UTC, where the member's time and UTC are one and the same: on a clock in
// Berlin they are two hours apart in summer and one in winter -- the file, its name and the words
// have to tell them apart.
describe('on a clock in Berlin', () => {
  beforeEach(() => {
    process.env.TZ = 'Europe/Berlin'
  })

  afterEach(() => {
    process.env.TZ = 'UTC'
  })

  it('reads the fields as Berlin’s time, and writes the file in UTC', () => {
    const when = chatVideoWhen('2026-09-30', '15:00', '16:00')
    expect(when.start.toISOString()).toBe('2026-09-30T13:00:00.000Z')
    expect(when.end.toISOString()).toBe('2026-09-30T14:00:00.000Z')

    const lines = unfolded(aFile({ start: when.start, end: when.end }))
    expect(lines).toContain('DTSTART:20260930T130000Z')
    expect(lines).toContain('DTEND:20260930T140000Z')
  })

  it('names the file and the day by Berlin’s calendar, past midnight too', () => {
    const late = chatVideoWhen('2026-10-01', '00:30', '01:30')
    expect(late.start.toISOString()).toBe('2026-09-30T22:30:00.000Z')

    expect(chatVideoCalendarFileName('Lesekreis', late.start)).toBe('Lesekreis-2026-10-01.ics')
    expect(chatVideoDay(late.start, 'de')).toBe('Donnerstag, 1. Oktober 2026')
  })

  // The night summer time begins, the clock goes from 02:00 to 03:00: a call at 02:30 would go out
  // at 03:30. The night it ends, 02:00 to 03:00 comes twice: the first is taken.
  it('takes no time the clock skips, and the first of an hour it shows twice', () => {
    expect(chatVideoWhen('2027-03-28', '02:30', '04:00')).toBeNull()
    expect(chatVideoWhen('2027-03-28', '01:30', '02:30')).toBeNull()

    const spring = chatVideoWhen('2027-03-28', '01:30', '03:30')
    expect(spring.start.toISOString()).toBe('2027-03-28T00:30:00.000Z')
    expect(spring.end.toISOString()).toBe('2027-03-28T01:30:00.000Z')

    const autumn = chatVideoWhen('2026-10-25', '02:30', '03:30')
    expect(autumn.start.toISOString()).toBe('2026-10-25T00:30:00.000Z')
    expect(autumn.end.toISOString()).toBe('2026-10-25T02:30:00.000Z')
  })

  it('names summer time and winter time', () => {
    expect(chatVideoZone(new Date(2026, 8, 30, 15), 'de')).toBe('MESZ')
    expect(chatVideoZone(new Date(2026, 11, 2, 15), 'de')).toBe('MEZ')
    expect(chatVideoZone(new Date(2026, 8, 30, 15), 'en')).toBe('GMT+2')
  })
})

describe('the planned call a message invites to', () => {
  it('is read out of the invitation’s address: the room, the topic, the start and the end', () => {
    expect(chatVideoPlannedCall(INVITATION)).toEqual({
      url: PLANNED,
      room: ROOM,
      topic: 'Projektbesprechung',
      start: START,
      end: END,
    })
  })

  it('is none for a call now, and for every other message', () => {
    for (const text of [
      `📹 Videoanruf. Der Raum liegt …: ${withChatVideoTopic(ROOM, 'Videoanruf')}`,
      `Schau mal: https://gradido.net/de/ und ${ROOM}`,
      'Bis morgen!',
      '',
      undefined,
    ]) {
      expect(chatVideoPlannedCall(text), String(text)).toBeNull()
    }
  })

  it('takes the first planned address, past any other link', () => {
    const text = `Vorher: https://gradido.net/de/ -- ${INVITATION}`
    expect(chatVideoPlannedCall(text)?.url).toBe(PLANNED)
  })
})

// E-058 (Bernd, 30.09.2026): a video invitation duplicated -- what it carries, and, planned, the
// same weekday and time a week on.
describe('the invitation a message carries', () => {
  it('is read out of the first address of our own form: room, topic, and a planned time', () => {
    expect(chatVideoInvitation(INVITATION)).toEqual({
      url: PLANNED,
      room: ROOM,
      topic: 'Projektbesprechung',
      start: START,
      end: END,
    })
    const now = withChatVideoTopic(ROOM, 'Stammtisch')
    expect(chatVideoInvitation(`Komm dazu: ${now}`)).toEqual({
      url: now,
      room: ROOM,
      topic: 'Stammtisch',
      start: null,
      end: null,
    })
  })

  it('is none in a message without one', () => {
    expect(chatVideoInvitation('Schau mal: https://gradido.net/de/faq#konto')).toBeNull()
    expect(chatVideoInvitation(`Hier: ${ROOM}`)).toBeNull()
    expect(chatVideoInvitation('')).toBeNull()
    expect(chatVideoInvitation(null)).toBeNull()
  })
})

describe('a planned call a week on', () => {
  beforeEach(() => {
    process.env.TZ = 'Europe/Berlin'
  })

  afterEach(() => {
    process.env.TZ = 'UTC'
  })

  // A moment on Berlin's clock.
  const at = (day, time) => new Date(`${day}T${time}:00`)
  const when = (day, from, to) => chatVideoWhen(day, from, to)

  it('goes to the same weekday and time next week, as long as it was', () => {
    const now = at('2026-09-30', '11:35')
    expect(chatVideoNextWeek(when('2026-09-30', '15:00', '16:30'), now)).toEqual({
      day: '2026-10-07',
      from: '15:00',
      to: '16:30',
    })
  })

  // An invitation from weeks ago: the first of its weekday and time still to come.
  it('goes to the first such time still to come', () => {
    const now = at('2026-09-30', '13:35')
    expect(chatVideoNextWeek(when('2026-09-02', '15:00', '16:00'), now)).toEqual({
      day: '2026-09-30',
      from: '15:00',
      to: '16:00',
    })
    expect(chatVideoNextWeek(when('2026-09-02', '09:00', '10:00'), now)).toEqual({
      day: '2026-10-07',
      from: '09:00',
      to: '10:00',
    })
  })

  // Summer time ends on 25 October: the call keeps its time on the clock.
  it('keeps the time of day across the change of summer time', () => {
    const now = at('2026-10-21', '18:00')
    expect(chatVideoNextWeek(when('2026-10-21', '15:00', '16:00'), now)).toEqual({
      day: '2026-10-28',
      from: '15:00',
      to: '16:00',
    })
  })

  it('ends a call that ran past midnight at the end of its day', () => {
    const start = at('2026-09-30', '23:30')
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    expect(chatVideoNextWeek({ start, end }, at('2026-09-30', '12:00'))).toEqual({
      day: '2026-10-07',
      from: '23:30',
      to: '23:59',
    })
  })
})

// AI-GENERATED — not an architecture reference
import { chatTextParts } from '@/utils/chatTextParts'
import { readChatVideoAddition } from '@/utils/chatVideoTopic'

/**
 * A planned video call for the member's calendar (V5b, Bernd, 27.09.2026: "runter zu laden, in den
 * gängigen Kalenderformaten, also beim Apple ist es zum Beispiel iCal"): an iCalendar file (.ics,
 * RFC 5545), the one format the calendars of Apple, Google and Microsoft and Thunderbird all read.
 * Its times are written in UTC, so every calendar shows the call in its own member's time zone --
 * the sender's and the recipient's alike.
 */

const pad = (n) => String(n).padStart(2, '0')

/** A time as iCalendar writes one in UTC: `20260930T130000Z`. */
const icsTime = (date) =>
  `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
  `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`

/** A text value: backslash, semicolon, comma and line breaks escaped (RFC 5545, 3.3.11). */
const icsText = (text) =>
  text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

const utf8 = new TextEncoder()

/**
 * A content line folded after 75 octets, each further piece after a line break and one space --
 * and never inside a character: an umlaut or an emoji takes two to four octets (RFC 5545, 3.1).
 */
const fold = (line) => {
  const pieces = []
  let piece = ''
  let octets = 0
  for (const character of line) {
    const size = utf8.encode(character).length
    if (octets + size > 75) {
      pieces.push(piece)
      piece = ` ${character}`
      octets = 1 + size
    } else {
      piece += character
      octets += size
    }
  }
  pieces.push(piece)
  return pieces.join('\r\n')
}

/**
 * The calendar file of a planned call. `uid` names the call, so that a second download of the same
 * call is taken as the same entry, not as a second one.
 *
 * @param {{ start: Date, end: Date, title: string, description: string, url: string, uid: string, now?: Date }} call
 * @returns {string}
 */
export const chatVideoCalendarFile = ({
  start,
  end,
  title,
  description,
  url,
  uid,
  now = new Date(),
}) =>
  [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Gradido//Videoanruf//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${icsTime(now)}`,
    `DTSTART:${icsTime(start)}`,
    `DTEND:${icsTime(end)}`,
    `SUMMARY:${icsText(title)}`,
    `DESCRIPTION:${icsText(description)}`,
    `LOCATION:${icsText(url)}`,
    `URL:${url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .map(fold)
    .join('\r\n') + '\r\n'

/** What names a call in every calendar: its room and its start, `k3v9q2m7x4pd-1790773200@gradido`. */
export const chatVideoCalendarUid = (room, start) =>
  `${room.slice(room.lastIndexOf('/') + 1)}-${Math.floor(start.getTime() / 1000)}@gradido`

/**
 * The file's name: the topic and the member's day of the call, with nothing a file system minds --
 * `Projektbesprechung-2026-09-30.ics`.
 */
export const chatVideoCalendarFileName = (topic, start) => {
  const name =
    topic
      // eslint-disable-next-line no-control-regex
      .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 40) || 'video'
  return `${name}-${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}.ics`
}

/**
 * Hands the file to the browser to save, through a link of its own with `download` -- in the
 * member's click. The file's address lives only for that moment.
 */
export const saveChatVideoCalendarFile = (name, text) => {
  const address = URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = address
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(address), 10000)
}

/**
 * A day and a time of day as the member's own clock reads them -- or null where that clock never
 * shows them: the hour skipped when summer time begins (02:30 on the last Sunday in March, in
 * Berlin), a day the month does not have. `Date` moves such a time on without a word (to 03:30, to
 * the 2nd of March), and the call would go out at another time than the fields show (coderabbit,
 * #3995). Where the clock shows an hour twice, as summer time ends, it is the first.
 */
const onTheClock = (day, time) => {
  // ⛔ A date and a time without an offset are the member's own time (ECMAScript's rule for the
  // date-time form); a date alone would be UTC.
  const date = new Date(`${day}T${time}`)
  const [year, month, dayOfMonth] = day.split('-').map(Number)
  const [hours, minutes] = time.split(':').map(Number)
  return date.getFullYear() === year &&
    date.getMonth() + 1 === month &&
    date.getDate() === dayOfMonth &&
    date.getHours() === hours &&
    date.getMinutes() === minutes
    ? date
    : null
}

/**
 * The time of a call from the question's fields: a day and two times of day, as the member's own
 * clock reads them. null where one is missing or is on no clock (`onTheClock`), or the end is not
 * after the start.
 *
 * @param {string} day `2026-09-30`, as a date field gives it
 * @param {string} from `15:00`, as a time field gives it
 * @param {string} to
 * @returns {{ start: Date, end: Date } | null}
 */
export const chatVideoWhen = (day, from, to) => {
  if (!day || !from || !to) return null
  const start = onTheClock(day, from)
  const end = onTheClock(day, to)
  if (!start || !end || end <= start) return null
  return { start, end }
}

/** The day of a call as the member's language writes it in full: "Mittwoch, 30. September 2026". */
export const chatVideoDay = (date, locale) =>
  new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)

/** The short name of the time zone a time falls in, in the member's language: MESZ, CEST, GMT+2. */
export const chatVideoZone = (date, locale) =>
  new Intl.DateTimeFormat(locale, { timeZoneName: 'short' })
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName')?.value ?? ''

/**
 * The planned call a message invites to (V5b): the first address of Gradido's own form in it that
 * carries a time -- with the room, the topic, the start and the end it carries. null for every
 * other message.
 *
 * @param {string} text
 * @returns {{ url: string, room: string, topic: string, start: Date, end: Date } | null}
 */
export const chatVideoPlannedCall = (text) => {
  for (const part of chatTextParts(text ?? '')) {
    if (part.type !== 'url') continue
    const addition = readChatVideoAddition(part.value)
    if (addition?.start) return { url: part.value, ...addition }
  }
  return null
}

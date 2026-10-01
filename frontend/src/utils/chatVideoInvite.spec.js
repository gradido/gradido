// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import { chatTextParts } from '@/utils/chatTextParts'
import { chatVideoInvitation, chatVideoPlannedCall } from '@/utils/chatVideoCalendar'
import {
  chatVideoInviteBody,
  chatVideoRescheduledBody,
  nextChatVideoRevision,
  readChatVideoInvite,
} from './chatVideoInvite'

/**
 * A video invitation is changed by writing its words anew (E-060). So the wallet has to know an
 * invitation of its own when it sees one -- and only then: `readChatVideoInvite` reads back what
 * `chatVideoInviteBody` wrote, and nothing else. Held here with the wallet's real words, in every
 * language and under two clocks: this is the one place where a translation, a date format or a
 * time zone could make an invitation unreadable -- "Bearbeiten" would then open its raw text in
 * the bar instead of its topic and its time.
 */

const LANGUAGES = ['de', 'el', 'en', 'es', 'fr', 'it', 'nl', 'pt', 'ru', 'tr']

/** The member's language as `useI18n` gives it to the two functions. */
const wordsIn = (lang) => ({
  t: (key, values) => i18n.global.t(key, values ?? {}, { locale: lang }),
  d: (date, format) => i18n.global.d(date, format, lang),
  locale: lang,
})

const ROOM = 'https://meet.ffmuc.net/k7m2x9q4t8wz'
const WHEN = {
  start: new Date('2026-10-05T12:00:00.000Z'),
  end: new Date('2026-10-05T13:00:00.000Z'),
}
// A call in winter time, planned in summer: the zone named is the one of the call's day.
const IN_WINTER = {
  start: new Date('2026-12-07T17:30:00.000Z'),
  end: new Date('2026-12-07T18:15:00.000Z'),
}
const CHANGED = { first: new Date('2026-10-01T08:00:00.000Z'), sequence: 2 }

/** Operators as the server's list writes them (ChatVideoServers.default.ts), and a host. */
const OPERATORS = [
  'Freifunk München (Freie Netze München e. V.)',
  'Weimarnetz e. V.',
  'meerfarbig GmbH & Co. KG',
  'Chaos Computer Club Düsseldorf / Chaosdorf e. V.',
  'meet.ffmuc.net',
]

/** Topics a member may type, each hard in its own way -- and the default, by its key. */
const TOPICS = [
  null,
  'Projektbesprechung',
  'Lesekreis „Momo“',
  "Rock'n'Roll (live)* !",
  'Gespräch über Bäume?',
  'A & B = C #1',
  'Ende mit Punkt.',
  'von {operator} — {url}',
]

const TIMES = [
  ['now', null, null],
  ['planned', WHEN, null],
  ['planned for winter', IN_WINTER, null],
  ['planned and changed', WHEN, CHANGED],
]

let zoneBefore
beforeEach(() => {
  zoneBefore = process.env.TZ
})
afterEach(() => {
  process.env.TZ = zoneBefore
})

describe.each(['Europe/Berlin', 'Asia/Kolkata'])('a video invitation, on a clock in %s', (zone) => {
  beforeEach(() => {
    process.env.TZ = zone
  })

  describe.each(LANGUAGES)('written in %s', (lang) => {
    const words = wordsIn(lang)
    const topics = TOPICS.map((topic) => topic ?? words.t('chatThread.videoTopicDefault'))

    it.each(TIMES)('is read back as what it says (%s)', (_, when, revision) => {
      for (const topic of topics) {
        for (const operator of OPERATORS) {
          const call = { room: ROOM, topic, when, operator, revision }
          const { url, body } = chatVideoInviteBody(words, call)

          expect(readChatVideoInvite(words, body), `${lang}: ${body}`).toEqual(call)
          // And it is still one message with the address whole, as its last piece.
          expect(chatTextParts(body).at(-1)).toEqual({ type: 'url', value: url })
          expect(body.endsWith(` ${url}`), body).toBe(true)
        }
      }
    })

    // The second half: what the reading gives writes the same words again -- a "Save" with
    // nothing changed changes nothing.
    it('writes the same words again from what it read', () => {
      for (const [, when, revision] of TIMES) {
        const { body } = chatVideoInviteBody(words, {
          room: ROOM,
          topic: topics[1],
          when,
          operator: OPERATORS[0],
          revision,
        })
        expect(chatVideoInviteBody(words, readChatVideoInvite(words, body)).body).toBe(body)
      }
    })

    it('is not read where it was written in another language', () => {
      const other = wordsIn(lang === 'de' ? 'en' : 'de')
      for (const [, when, revision] of TIMES) {
        const { body } = chatVideoInviteBody(other, {
          room: ROOM,
          topic: 'Projektbesprechung',
          when,
          operator: OPERATORS[0],
          revision,
        })
        expect(readChatVideoInvite(words, body)).toBeNull()
      }
    })
  })
})

/**
 * ⛔ Why so strict: a changed invitation is written anew, whole. A message that only CONTAINS a
 * room's address would lose the member's own words that way -- it is text, and is changed as text.
 */
describe('what is no invitation of the wallet’s own', () => {
  const words = wordsIn('de')
  const invitation = (call = {}) =>
    chatVideoInviteBody(words, {
      room: ROOM,
      topic: 'Projektbesprechung',
      when: null,
      operator: 'Freifunk München',
      revision: null,
      ...call,
    })

  beforeEach(() => {
    process.env.TZ = 'Europe/Berlin'
  })

  // Gegenprobe: the invitation these are made from is one.
  it('reads the invitation they are made from', () => {
    expect(readChatVideoInvite(words, invitation().body)).not.toBeNull()
    expect(readChatVideoInvite(words, invitation({ when: WHEN }).body)).not.toBeNull()
  })

  it('is a message of one’s own words around a room’s address', () => {
    const { url } = invitation()
    expect(readChatVideoInvite(words, `Hier ist der Link für Samstag: ${url}`)).toBeNull()
    expect(readChatVideoInvite(words, url)).toBeNull()
  })

  it('is an invitation with words added before it, after it, or within', () => {
    const { url, body } = invitation()
    expect(readChatVideoInvite(words, `Hallo Lena!\n${body}`)).toBeNull()
    expect(readChatVideoInvite(words, `${body} Bis dann!`)).toBeNull()
    expect(readChatVideoInvite(words, `${body}\n`)).toBeNull()
    expect(readChatVideoInvite(words, ` ${body}`)).toBeNull()
    expect(
      readChatVideoInvite(words, body.replace('ein Vorschlag', 'nur ein Vorschlag')),
    ).toBeNull()
    // The words say another topic than the address carries.
    expect(body).toContain('Projektbesprechung')
    expect(
      readChatVideoInvite(words, body.replace(': Projektbesprechung', ': Lesekreis')),
    ).toBeNull()
    expect(chatVideoInvitation(body.replace(': Projektbesprechung', ': Lesekreis')).url).toBe(url)
  })

  it('is an invitation whose day or time in words is not the one its address carries', () => {
    const { body } = invitation({ when: WHEN })
    expect(body).toContain('14:00–15:00 Uhr (MESZ)')
    expect(readChatVideoInvite(words, body.replace('14:00–15:00', '16:00–17:00'))).toBeNull()
    expect(readChatVideoInvite(words, body.replace('5. Oktober', '6. Oktober'))).toBeNull()
  })

  // The words name the time on the writer's clock: read on another, they are not the wallet's
  // words for that address there. The call itself is the same -- its address says when.
  it('is an invitation written on another clock', () => {
    const { body } = invitation({ when: WHEN })
    process.env.TZ = 'Asia/Kolkata'

    expect(readChatVideoInvite(words, body)).toBeNull()
    expect(chatVideoPlannedCall(body).start).toEqual(WHEN.start)
  })

  it('is a message with an address that is not of the wallet’s form', () => {
    const { body, url } = invitation()
    expect(readChatVideoInvite(words, body.replace(url, ROOM))).toBeNull()
    expect(
      readChatVideoInvite(words, body.replace(url, `${url}&config.prejoinPageEnabled=false`)),
    ).toBeNull()
  })

  it('is an invitation that names nobody, or somebody over two lines', () => {
    expect(readChatVideoInvite(words, invitation({ operator: '' }).body)).toBeNull()
    expect(readChatVideoInvite(words, invitation({ operator: 'Frei\nfunk' }).body)).toBeNull()
    expect(readChatVideoInvite(words, invitation({ operator: 'Frei\rfunk' }).body)).toBeNull()
  })

  it('is no text at all', () => {
    expect(readChatVideoInvite(words, '')).toBeNull()
    expect(readChatVideoInvite(words, null)).toBeNull()
    expect(readChatVideoInvite(words, undefined)).toBeNull()
  })
})

/**
 * What a changed call carries for the calendars: a calendar knows the call by its room and its
 * FIRST start, and takes a file for the newer one by the count of its changes.
 */
describe('the count of a call’s changes', () => {
  const LATER = { start: new Date('2026-10-06T12:00:00.000Z') }

  it('begins with the start the call was planned for, at one', () => {
    expect(nextChatVideoRevision({ when: WHEN, revision: null }, LATER)).toEqual({
      first: WHEN.start,
      sequence: 1,
    })
  })

  it('keeps the first start and counts on', () => {
    expect(nextChatVideoRevision({ when: WHEN, revision: CHANGED }, LATER)).toEqual({
      first: CHANGED.first,
      sequence: 3,
    })
  })

  // Only the topic changed: the time is the same, and the change is counted all the same -- the
  // calendar's entry gets its new title by it.
  it('counts a change that left the time as it was', () => {
    expect(nextChatVideoRevision({ when: WHEN, revision: null }, WHEN)).toEqual({
      first: WHEN.start,
      sequence: 1,
    })
  })

  // No calendar holds a call that had no time: it is named by the start it gets, as one newly
  // planned -- and a call without a time carries nothing.
  it('is none for a call that gets its first time, and for one without a time', () => {
    expect(nextChatVideoRevision({ when: null, revision: null }, LATER)).toBeNull()
    expect(nextChatVideoRevision({ when: null, revision: null }, null)).toBeNull()
    expect(nextChatVideoRevision({ when: WHEN, revision: CHANGED }, null)).toBeNull()
  })

  it('travels in the address of the invitation, and comes back from it', () => {
    const words = wordsIn('de')
    const revision = nextChatVideoRevision({ when: WHEN, revision: null }, LATER)
    const { url, body } = chatVideoInviteBody(words, {
      room: ROOM,
      topic: 'Projektbesprechung',
      when: IN_WINTER,
      operator: 'Freifunk München',
      revision,
    })

    expect(url.endsWith('&gradido.first=1791201600&gradido.seq=1')).toBe(true)
    expect(chatVideoPlannedCall(body)).toMatchObject({
      start: IN_WINTER.start,
      end: IN_WINTER.end,
      first: WHEN.start,
      sequence: 1,
    })
  })
})

/**
 * B4 (Bernd, 01.10.2026): a changed appointment writes "Termin geändert" by itself -- a short
 * message of its own after the changed invitation, which says what is now.
 */
describe('the message that follows a changed appointment', () => {
  beforeEach(() => {
    process.env.TZ = 'Europe/Berlin'
  })

  it('says the new day and time, with the zone, in German', () => {
    const words = wordsIn('de')

    expect(chatVideoRescheduledBody(words, { topic: 'Videoanruf', when: WHEN })).toBe(
      '📅 Termin geändert: Der Videoanruf ist jetzt am Montag, 5. Oktober 2026, 14:00–15:00 Uhr (MESZ).',
    )
    expect(chatVideoRescheduledBody(words, { topic: 'Projektbesprechung', when: WHEN })).toBe(
      '📅 Termin geändert: „Projektbesprechung“ ist jetzt am Montag, 5. Oktober 2026, 14:00–15:00 Uhr (MESZ).',
    )
  })

  it.each(LANGUAGES)(
    'names the day, the time and the topic in %s, and carries no address',
    (lang) => {
      const words = wordsIn(lang)
      const day = new Intl.DateTimeFormat(lang, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(WHEN.start)
      const plain = chatVideoRescheduledBody(words, {
        topic: words.t('chatThread.videoTopicDefault'),
        when: WHEN,
      })
      const named = chatVideoRescheduledBody(words, { topic: 'Lesekreis „Momo“', when: WHEN })

      for (const text of [plain, named]) {
        expect(text.startsWith('📅 '), text).toBe(true)
        expect(text).toContain(day)
        expect(text).toContain(words.d(WHEN.start, 'time'))
        expect(text).toContain(words.d(WHEN.end, 'time'))
        // Words only: no room in it, so nobody takes it for an invitation -- and nothing left of
        // a placeholder.
        expect(chatTextParts(text).every((part) => part.type !== 'url')).toBe(true)
        expect(chatVideoInvitation(text)).toBeNull()
        expect(text).not.toMatch(/[{}]/)
      }
      expect(named).toContain('Lesekreis „Momo“')
      expect(plain).not.toContain('Lesekreis')
      expect(plain).not.toBe(named)
    },
  )

  // The other half: each language in its own words -- a lookup fallen back to English would pass
  // the test above for every language.
  it('is worded in each language’s own words', () => {
    for (const topic of ['Videoanruf-Thema', null]) {
      const rendered = LANGUAGES.map((lang) => {
        const words = wordsIn(lang)
        return chatVideoRescheduledBody(words, {
          topic: topic ?? words.t('chatThread.videoTopicDefault'),
          when: WHEN,
        })
      })
      expect(new Set(rendered).size).toBe(LANGUAGES.length)
    }
  })
})

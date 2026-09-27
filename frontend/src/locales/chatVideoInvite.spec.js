// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import i18n from '@/i18n'
import { chatTextParts } from '@/utils/chatTextParts'
import { withChatVideoTopic } from '@/utils/chatVideoTopic'

/**
 * The invitation to a video call (V2) is an ordinary chat message, written in the sender's
 * language: `chatThread.videoInvite`, with who runs the server (`{operator}`) and the room's
 * address (`{url}`). Nothing on the way checks what a translation does to it, so this does:
 *
 * - The address stands at the very END, one space before it and nothing after -- the thread's
 *   link finder (`chatTextParts`) takes it whole there. A word or a full stop after it would be
 *   cut into the link or left dangling.
 * - Who runs the server is a name as the server's list writes it, dropped in as it is:
 *   "Weimarnetz e. V.", "meerfarbig GmbH & Co. KG", or a host where the list names nobody. A
 *   construction that ends a sentence with it gives "e. V.." -- it did in Russian, first.
 *
 * Rendered with the wallet's own vue-i18n and its own link finder, not with a pattern held
 * against the source: the source is what the translations are, the rendering is what arrives.
 *
 * ⚠️ `fileURLToPath`, not `new URL(...)`: jsdom brings its own `URL` class, and node turns an
 * instance of it away as coming from another realm.
 */
const here = dirname(fileURLToPath(import.meta.url))
const languages = readdirSync(here)
  .filter((file) => file.endsWith('.json'))
  .map((file) => file.replace('.json', ''))
const chatThreadIn = (lang) =>
  JSON.parse(readFileSync(join(here, `${lang}.json`), 'utf8')).chatThread ?? {}

const KEYS = {
  videoCall: ['{name}'],
  videoAskTitle: ['{name}'],
  videoAskBody: ['{name}'],
  videoAskFirst: ['{name}'],
  videoStart: [],
  videoInvite: ['{operator}', '{url}'],
  videoNoServer: [],
  videoNotSent: [],
  videoOpen: [],
  // V4a: the topic -- the field, its default, the hint, the invitation that names it.
  videoTopic: [],
  videoTopicDefault: [],
  videoTopicHint: [],
  videoInviteTopic: ['{topic}', '{operator}', '{url}'],
  // V4b: the way into the Jitsi app -- the box and its hint, the question before joining, the
  // sentence where the app did not open, the room in the browser, the app's download.
  videoInAppHint: [],
  videoStartInApp: [],
  videoJoinTitle: ['{name}'],
  videoJoin: [],
  videoAppMissed: [],
  videoOpenInBrowser: [],
  videoAppDownload: [],
  // V5: the gear -- its name and its view's title, the topic line, the server's choice and the
  // server chosen, the sentence where it is not to be had, the link for people outside the thread.
  videoSettings: [],
  videoSettingsTitle: ['{name}'],
  videoTopicLine: ['{topic}'],
  videoServer: [],
  videoServerRandom: [],
  videoServerChosen: ['{host}'],
  videoServerGone: [],
  videoCopyLink: [],
  videoLinkCopied: [],
  videoLinkHint: [],
  // V5b: planning -- the time's fields and their hint, the calendar file, "Plan" and who gets the
  // invitation, what is missing, the two invitations with a day and a time, the time in words,
  // and the bubble's button.
  videoWhen: [],
  videoDate: [],
  videoFrom: [],
  videoTo: [],
  videoWhenHint: ['{zone}'],
  videoCalendarFile: [],
  videoPlan: [],
  videoPlanBody: ['{name}'],
  videoPlanFirst: ['{name}'],
  videoPlanIncomplete: [],
  videoInvitePlanned: ['{date}', '{time}', '{operator}', '{url}'],
  videoInvitePlannedTopic: ['{topic}', '{date}', '{time}', '{operator}', '{url}'],
  videoPlannedTime: ['{from}', '{to}', '{zone}'],
  videoAddToCalendar: [],
}

/** Topics a member may type, each hard in its own way for the link finder or for Jitsi. */
const TOPICS = ['Lesekreis „Momo“', "Rock'n'Roll (live)* !", 'Gespräch über Bäume?', 'A & B = C #1']

/** Operators as the server's list writes them (V1, ChatVideoServers.default.ts), and a host. */
const OPERATORS = [
  'Freifunk München (Freie Netze München e. V.)',
  'Weimarnetz e. V.',
  'meerfarbig GmbH & Co. KG',
  'Chaos Computer Club Düsseldorf / Chaosdorf e. V.',
  'meet.ffmuc.net',
]
const URL_OF_A_ROOM = 'https://meet.ffmuc.net/k7m2x9q4t8wz'

describe('the video call in every language', () => {
  it('is read from every language file', () => {
    expect(languages).toHaveLength(10)
  })

  it.each(languages)('has all forty-four texts, each with its placeholders once, in %s', (lang) => {
    const texts = chatThreadIn(lang)
    for (const [key, placeholders] of Object.entries(KEYS)) {
      expect(texts[key], `${lang}: chatThread.${key}`).toBeTruthy()
      const found = texts[key].match(/\{[a-z]+\}/g) ?? []
      expect(found.sort(), `${lang}: chatThread.${key}`).toEqual([...placeholders].sort())
    }
  })

  it.each(languages)('ends the invitation with the address, one space before it, in %s', (lang) => {
    expect(chatThreadIn(lang).videoInvite).toMatch(/\S \{url\}$/)
  })

  it.each(languages)(
    'hands the link finder the address whole, as the last piece, in %s',
    (lang) => {
      for (const operator of OPERATORS) {
        const text = i18n.global.t(
          'chatThread.videoInvite',
          { operator, url: URL_OF_A_ROOM },
          { locale: lang },
        )
        expect(text.endsWith(` ${URL_OF_A_ROOM}`), text).toBe(true)
        expect(text).toContain(operator)
        const parts = chatTextParts(text)
        expect(parts.at(-1)).toEqual({ type: 'url', value: URL_OF_A_ROOM })
        expect(parts.filter((part) => part.type === 'url')).toHaveLength(1)
      }
    },
  )

  it.each(languages)('puts no second full stop after an operator ending in one, in %s', (lang) => {
    const text = i18n.global.t(
      'chatThread.videoInvite',
      { operator: 'Weimarnetz e. V.', url: URL_OF_A_ROOM },
      { locale: lang },
    )
    expect(text).not.toMatch(/\.\s*\./)
  })

  // The other half: the language asked for is the language that came back -- a lookup that fell
  // back to English would pass every test above for every language.
  it('renders each language in its own words', () => {
    for (const key of [
      'videoInvite',
      'videoInviteTopic',
      'videoTopicDefault',
      'videoTopicHint',
      'videoInAppHint',
      'videoStartInApp',
      'videoJoinTitle',
      'videoJoin',
      'videoAppMissed',
      'videoOpenInBrowser',
      'videoAppDownload',
    ]) {
      const rendered = languages.map((lang) =>
        i18n.global.t(
          `chatThread.${key}`,
          { topic: 'T', operator: 'X', url: URL_OF_A_ROOM },
          { locale: lang },
        ),
      )
      expect(new Set(rendered).size, key).toBe(languages.length)
    }
  })

  /**
   * V4a: the default topic is the word the invitation begins with in that language, and the
   * invitation with a topic of one's own is the same invitation -- only the topic after that word,
   * on a line of its own (it may end on "?" or "."). Held word for word, so the two cannot drift.
   */
  it.each(languages)('words the invitation with a topic as the one without, in %s', (lang) => {
    const texts = chatThreadIn(lang)
    const [head, rest, ...more] = texts.videoInviteTopic.split('\n')

    expect(more).toEqual([])
    expect(texts.videoInvite).toBe(`📹 ${texts.videoTopicDefault}. ${rest}`)
    expect(head).toMatch(new RegExp(`^📹 ${texts.videoTopicDefault} ?: \\{topic\\}$`))
  })

  it.each(languages)(
    'hands the link finder the address with its topic whole, as the last piece, in %s',
    (lang) => {
      for (const topic of TOPICS) {
        const address = withChatVideoTopic(URL_OF_A_ROOM, topic)
        const text = i18n.global.t(
          'chatThread.videoInviteTopic',
          { topic, operator: OPERATORS[0], url: address },
          { locale: lang },
        )
        expect(text.split('\n')[0].endsWith(` ${topic}`), text).toBe(true)
        expect(text.endsWith(` ${address}`), text).toBe(true)
        expect(chatTextParts(text).at(-1)).toEqual({ type: 'url', value: address })
      }
    },
  )

  // The hint under the field: the same dash as the invitation, in every language.
  it.each(languages)('writes the dash of the invitation in the hint, in %s', (lang) => {
    expect(chatThreadIn(lang).videoTopicHint).toContain(' — ')
  })

  // V4b: the app is called by its name in every language -- it is what the member looks for on
  // the computer -- and its hint takes the invitation's dash too.
  it.each(languages)('names the Jitsi app by its name, in %s', (lang) => {
    const texts = chatThreadIn(lang)
    for (const key of ['videoInAppHint', 'videoStartInApp', 'videoAppMissed', 'videoAppDownload']) {
      expect(texts[key], `${lang}: chatThread.${key}`).toContain('Jitsi')
    }
    expect(texts.videoInAppHint).toContain(' — ')
  })

  /**
   * V5b: the invitation to a planned call is the invitation with a topic -- or the one without --
   * with two lines between its head and the sentence about the server: the day (📅) and the time
   * (🕒). Held word for word against the call now, so the two cannot drift.
   */
  it.each(languages)(
    'words the planned invitation as the one now, with a day and a time, in %s',
    (lang) => {
      const texts = chatThreadIn(lang)
      const [head, rest] = texts.videoInviteTopic.split('\n')
      const bare = head.replace(/ ?: \{topic\}$/, '')

      expect(texts.videoInvitePlannedTopic).toBe(`${head}\n📅 {date}\n🕒 {time}\n${rest}`)
      expect(texts.videoInvitePlanned).toBe(`${bare}\n📅 {date}\n🕒 {time}\n${rest}`)
      expect(bare).toBe(`📹 ${texts.videoTopicDefault}`)
    },
  )

  // The planned call's address carries its time after the topic, and still ends the invitation
  // as one link, in every language.
  it.each(languages)(
    'hands the link finder the planned address whole, as the last piece, in %s',
    (lang) => {
      const when = {
        start: new Date('2026-09-30T13:00:00.000Z'),
        end: new Date('2026-09-30T14:00:00.000Z'),
      }
      for (const topic of TOPICS) {
        const address = withChatVideoTopic(URL_OF_A_ROOM, topic, when)
        const text = i18n.global.t(
          'chatThread.videoInvitePlannedTopic',
          { topic, date: 'D', time: 'T', operator: OPERATORS[0], url: address },
          { locale: lang },
        )
        expect(text.endsWith(` ${address}`), text).toBe(true)
        expect(chatTextParts(text).at(-1)).toEqual({ type: 'url', value: address })
      }
    },
  )

  // "videoWhen" is left out: Italian and Portuguese both say "Quando".
  it('renders the planning texts in each language’s own words', () => {
    for (const key of [
      'videoWhenHint',
      'videoCalendarFile',
      'videoPlan',
      'videoPlanBody',
      'videoPlanIncomplete',
      'videoAddToCalendar',
    ]) {
      const rendered = languages.map((lang) =>
        i18n.global.t(`chatThread.${key}`, { zone: 'Z', name: 'N' }, { locale: lang }),
      )
      expect(new Set(rendered).size, key).toBe(languages.length)
    }
  })
})

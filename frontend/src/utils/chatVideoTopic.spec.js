// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'vitest'
import {
  CHAT_VIDEO_TOPIC_MAX,
  readChatVideoAddition,
  withChatVideoTopic,
  withoutChatVideoTime,
  withoutChatVideoTopic,
} from './chatVideoTopic'
import { chatTextParts } from './chatTextParts'

/** A room as the server hands it out (V1): a server, the prefix if any, and twelve of chance. */
const ROOM = 'https://meet.ffmuc.net/k7m2x9q4t8wz'

/**
 * Jitsi's own reading of the part after `#`, rebuilt from jitsi/jitsi-meet
 * `react/features/base/util/parseURLParams.ts` (read on 26.09.2026, last changed in commit
 * 9cacffe30f64 of 12.05.2026). The three rewritings are copied word for word:
 *
 *     const paramStr = source === 'search' ? url.search : url.hash;
 *     const paramParts = paramStr?.substr(1).split('&') || [];
 *     …
 *     const param = part.split('=');
 *     …
 *     const decoded = decodeURIComponent(value).replace(/\\&/, '&')
 *         .replace(/[\u2018\u2019]/g, '\'')
 *         .replace(/[\u201C\u201D]/g, '"');
 *
 *     value = decoded === 'undefined' ? undefined : safeJsonParse(decoded);
 *
 * `safeJsonParse` is `parse` from `@hapi/bourne` (jitsi/js-utils, `json.ts`), and that is
 * `JSON.parse` for anything that is not an object -- a string, here. Where it throws, Jitsi
 * reports the error and drops the setting without a word: the meeting shows the room's name.
 * Here the throw stays a throw, so a test sees it. (`slice(1)` for Jitsi's `substr(1)`: the same
 * for a start of 1.)
 */
const jitsiReads = (address) => {
  const params = {}
  for (const part of new URL(address).hash.slice(1).split('&')) {
    const param = part.split('=')
    const decoded = decodeURIComponent(param[1])
      .replace(/\\&/, '&')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
    params[param[0]] = decoded === 'undefined' ? undefined : JSON.parse(decoded)
  }
  return params
}

/** The invitation as the thread and the mail get it, the address at its very end (V2). */
const invitation = (topic, address) =>
  `📹 Videoanruf: ${topic}\nDer Raum liegt auf einem Jitsi-Server von Freifunk München (Freie Netze München e. V.) — ein Vorschlag, kein Dienst von Gradido: ${address}`

/** Topics that have to arrive as they were typed, each for a reason of its own. */
const TOPICS = [
  ['umlauts and spaces', 'Gespräch über Bäume'],
  ['Greek', 'Συνάντηση για τον κήπο'],
  ['Cyrillic', 'Встреча в пятницу'],
  ['an emoji', 'Kaffee ☕ und 🌳'],
  ['straight quotes and a backslash', 'Das "Beste" aus C:\\Gärten'],
  ['German quotes, ending on U+201C', 'Lesekreis „Momo“'],
  ['English quotes', '“Momo”'],
  ['single curly quotes', '‘x’'],
  ['an ampersand, an equals sign, a hash', 'A & B = C #1'],
  ['a backslash before an ampersand', 'Pfad \\& Weg'],
  ["what encodeURIComponent leaves: '()*!", "Rock'n'Roll (live)* !"],
  ['forty curly quotes, the longest escape', '“'.repeat(CHAT_VIDEO_TOPIC_MAX)],
  ['forty three-byte characters', '€'.repeat(CHAT_VIDEO_TOPIC_MAX)],
]

describe('withChatVideoTopic', () => {
  // Bernd's own form, tried on two servers on 26.09.2026 (Notiz §12): the title reads "Videoanruf".
  it('adds the default exactly as it was tried on the servers', () => {
    expect(withChatVideoTopic(ROOM, 'Videoanruf')).toBe(
      'https://meet.ffmuc.net/k7m2x9q4t8wz#config.subject=%22Videoanruf%22',
    )
  })

  it.each(TOPICS)('brings %s to Jitsi as they were typed', (_, topic) => {
    expect(jitsiReads(withChatVideoTopic(ROOM, topic))).toEqual({ 'config.subject': topic })
  })

  // What the rewriting would touch is not there to touch: `&` and the four curly quotes go out
  // as `\u` escapes -- which is also why the plain formula, JSON and encodeURIComponent, is not
  // enough for „Momo“ (the spec above throws without it).
  it('leaves Jitsi nothing to rewrite', () => {
    for (const [, topic] of TOPICS) {
      const decoded = decodeURIComponent(withChatVideoTopic(ROOM, topic).split('#')[1])
      expect(decoded, topic).not.toMatch(/[&\u2018\u2019\u201c\u201d]/)
    }
  })

  it.each(TOPICS)('keeps the whole address one link with %s', (_, topic) => {
    const address = withChatVideoTopic(ROOM, topic)
    const parts = chatTextParts(invitation(topic, address))

    expect(parts.at(-1)).toEqual({ type: 'url', value: address })
  })

  // The link finder stops at `'()*` and lets no link end on `!`: none of them is left in it.
  it("leaves none of !'()* in the address", () => {
    const address = withChatVideoTopic(ROOM, "Rock'n'Roll (live)* !")

    expect(address).not.toMatch(/[!'()*]/)
    expect(address).toContain('%27')
    expect(address).toContain('%28')
    expect(address).toContain('%29')
    expect(address).toContain('%2A')
    expect(address).toContain('%21')
  })

  it('ends the address on the closing quote, which a link may end with', () => {
    for (const [, topic] of TOPICS) {
      expect(withChatVideoTopic(ROOM, topic).endsWith('%22'), topic).toBe(true)
    }
  })

  // Half an emoji -- the field's length can cut one in two when a topic is pasted. JSON writes the
  // lone half as an escape (ES2019), so encodeURIComponent does not throw, and it arrives as it went.
  it('takes a lone surrogate without an error', () => {
    const halved = `Treffen ${'🌳'.slice(0, 1)}`

    expect(() => withChatVideoTopic(ROOM, halved)).not.toThrow()
    expect(jitsiReads(withChatVideoTopic(ROOM, halved))).toEqual({ 'config.subject': halved })
    expect(chatTextParts(invitation(halved, withChatVideoTopic(ROOM, halved))).at(-1)).toEqual({
      type: 'url',
      value: withChatVideoTopic(ROOM, halved),
    })
  })

  it('takes forty characters', () => {
    expect(CHAT_VIDEO_TOPIC_MAX).toBe(40)
  })
})

describe('withoutChatVideoTopic', () => {
  it('shows the address without its own addition', () => {
    for (const [, topic] of [['default', 'Videoanruf'], ...TOPICS]) {
      expect(withoutChatVideoTopic(withChatVideoTopic(ROOM, topic)), topic).toBe(ROOM)
    }
  })

  // Only its own addition, never anything else: a second setting, a fragment of another kind,
  // an earlier `#`, or no `#` at all leave the address whole.
  it('leaves every other address as it is', () => {
    for (const address of [
      `${ROOM}#config.subject=x&foo=1`,
      `${ROOM}#foo`,
      `${ROOM}#a#config.subject=x`,
      `${ROOM}#config.subjectX=x`,
      ROOM,
      'https://gradido.net/de/',
    ]) {
      expect(withoutChatVideoTopic(address)).toBe(address)
    }
  })
})

// V5b: a planned call carries its time after the topic -- two settings of Gradido's own, whole
// seconds since 1970, which Jitsi reads as numbers and uses for nothing.
describe('the time of a planned call', () => {
  const WHEN = {
    start: new Date('2026-09-30T13:00:00.000Z'),
    end: new Date('2026-09-30T14:00:00.000Z'),
  }
  const PLANNED = `${ROOM}#config.subject=%22Lesekreis%22&gradido.start=1790773200&gradido.end=1790776800`

  it('goes after the topic, as whole seconds since 1970', () => {
    expect(withChatVideoTopic(ROOM, 'Lesekreis', WHEN)).toBe(PLANNED)
  })

  it('leaves the address as before without a time', () => {
    expect(withChatVideoTopic(ROOM, 'Lesekreis')).toBe(`${ROOM}#config.subject=%22Lesekreis%22`)
    expect(withChatVideoTopic(ROOM, 'Lesekreis', null)).toBe(
      `${ROOM}#config.subject=%22Lesekreis%22`,
    )
  })

  // What Jitsi does with the address: the title as before, the time two numbers it passes over --
  // no value that is no JSON, so nothing it reports as an error.
  it('is read by Jitsi as two numbers, the topic still its title', () => {
    for (const [, topic] of [['default', 'Videoanruf'], ...TOPICS]) {
      const read = jitsiReads(withChatVideoTopic(ROOM, topic, WHEN))
      expect(read['config.subject'], topic).toBe(topic)
      expect(read['gradido.start']).toBe(1790773200)
      expect(read['gradido.end']).toBe(1790776800)
    }
  })

  it('stays one link at the end of an invitation', () => {
    const address = withChatVideoTopic(ROOM, 'Lesekreis „Momo“', WHEN)
    const links = chatTextParts(invitation('Lesekreis „Momo“', address)).filter(
      (part) => part.type === 'url',
    )
    expect(links.map((part) => part.value)).toEqual([address])
  })

  it('goes with the topic where the thread shortens the address', () => {
    expect(withoutChatVideoTopic(PLANNED)).toBe(ROOM)
  })

  it('is read back: the room, the topic, the start and the end', () => {
    expect(readChatVideoAddition(PLANNED)).toEqual({
      room: ROOM,
      topic: 'Lesekreis',
      start: WHEN.start,
      end: WHEN.end,
    })
    for (const [, topic] of TOPICS) {
      expect(readChatVideoAddition(withChatVideoTopic(ROOM, topic, WHEN))?.topic, topic).toBe(topic)
    }
  })

  it('is none on an address with the topic alone', () => {
    expect(readChatVideoAddition(withChatVideoTopic(ROOM, 'Lesekreis'))).toEqual({
      room: ROOM,
      topic: 'Lesekreis',
      start: null,
      end: null,
    })
  })

  // Somebody else's address, or one no wallet of ours writes: nothing is read out of it.
  it('reads nothing out of an address that is not of our own form', () => {
    for (const address of [
      `${ROOM}#config.subject=%22Lesekreis%22&gradido.start=1790776800&gradido.end=1790773200`,
      `${ROOM}#config.subject=%22Lesekreis%22&gradido.start=1790773200`,
      `${ROOM}#config.subject=%22Lesekreis%22&gradido.start=1790773200&gradido.end=1790776800&x=1`,
      `${ROOM}#config.subject=%22Lesekreis%22&gradido.start=17907x3200&gradido.end=1790776800`,
      // Thirteen digits: seconds past any date a Date can hold (±8.64e15 ms).
      `${ROOM}#config.subject=%22Lesekreis%22&gradido.start=9999999999999&gradido.end=99999999999999`,
      `${ROOM}#config.subject=Lesekreis&gradido.start=1790773200&gradido.end=1790776800`,
      `${ROOM}#config.subject=42`,
      `${ROOM}#foo`,
      ROOM,
    ]) {
      expect(readChatVideoAddition(address), address).toBeNull()
    }
  })
})

// Bernd, 29.09.2026: the copy button behind a video link hands on the room with its topic and
// without a planned call's time -- a link used again for another meeting brings no old date along.
describe('withoutChatVideoTime', () => {
  const WHEN = {
    start: new Date('2026-09-30T13:00:00.000Z'),
    end: new Date('2026-09-30T14:00:00.000Z'),
  }
  const PLANNED = `${ROOM}#config.subject=%22Lesekreis%22&gradido.start=1790773200&gradido.end=1790776800`

  it('leaves out the time of a planned call and keeps the topic as it was written', () => {
    expect(withoutChatVideoTime(PLANNED)).toBe(`${ROOM}#config.subject=%22Lesekreis%22`)
    for (const [, topic] of TOPICS) {
      expect(withoutChatVideoTime(withChatVideoTopic(ROOM, topic, WHEN)), topic).toBe(
        withChatVideoTopic(ROOM, topic),
      )
    }
  })

  it('leaves an address with the topic alone as it is', () => {
    for (const [, topic] of TOPICS) {
      const address = withChatVideoTopic(ROOM, topic)
      expect(withoutChatVideoTime(address), topic).toBe(address)
    }
  })

  it('hands on the topic and no time', () => {
    expect(readChatVideoAddition(withoutChatVideoTime(PLANNED))).toEqual({
      room: ROOM,
      topic: 'Lesekreis',
      start: null,
      end: null,
    })
  })

  // What the thread shows whole it copies whole too: somebody else's address, or one no wallet of
  // ours writes.
  it('leaves every other address as it is', () => {
    for (const address of [
      ROOM,
      'https://gradido.net/de/faq#konto',
      `${ROOM}#config.subject=x&config.startWithAudioMuted=true`,
      `${ROOM}#config.subject=%22Lesekreis%22&gradido.start=1790773200`,
      `${ROOM}#config.subject=%22Lesekreis%22&gradido.start=1790773200&gradido.end=1790776800&x=1`,
    ]) {
      expect(withoutChatVideoTime(address), address).toBe(address)
      expect(withoutChatVideoTopic(address), address).toBe(address)
    }
  })
})

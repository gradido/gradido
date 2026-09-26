// AI-GENERATED — not an architecture reference
import { afterEach, describe, expect, it, vi } from 'vitest'
import { chatVideoAppUrl, offersJitsiApp } from './chatVideoApp'
import { withChatVideoTopic, withoutChatVideoTopic } from './chatVideoTopic'

/** Rooms as the server hands them out (V1): a server, its prefix where it has one, twelve of chance. */
const FFMUC = 'https://meet.ffmuc.net/k7m2x9q4t8wz'
const FAIRMEETING = 'https://fairmeeting.net/GradidoAkademiek7m2x9q4t8wz'

/**
 * Jitsi's page reading the part after `#` of the meeting's address -- the same rebuilding as in
 * chatVideoTopic.spec, from jitsi/jitsi-meet `react/features/base/util/parseURLParams.ts`
 * (commit 9cacffe30f64 of 12.05.2026), the three rewritings word for word:
 *
 *     const decoded = decodeURIComponent(value).replace(/\\&/, '&')
 *         .replace(/[\u2018\u2019]/g, '\'')
 *         .replace(/[\u201C\u201D]/g, '"');
 *
 * `safeJsonParse` is `JSON.parse` for a string. Where it throws, Jitsi drops the setting without a
 * word and the meeting shows the room's name; here the throw stays a throw, so a test sees it.
 */
const jitsiPageReads = (address) => {
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

/**
 * What the Jitsi app for the desktop does with a `jitsi-meet://` link, step by step, rebuilt from
 * jitsi/jitsi-meet-electron (master, commit 71819971c284 of 10.09.2026, read on 26.09.2026):
 *
 * 1. `main.ts:127` and `:381–411` (handleProtocolCall): the scheme goes,
 *        const inputURL = fullProtocolCall.replace(appProtocolSurplus, '');
 *    and `app/features/app/components/MeetingApp.tsx:73–76` (App.tsx the same) cuts a trailing `/`.
 * 2. `app/features/utils/functions.ts:39–68` (createConferenceObjectFromURL): the room is what
 *    follows the LAST `/`, the server what comes before it, with `https://` put in front
 *    (normalizeServerURL, `:10–19`).
 * 3. `app/features/conference/components/Conference.tsx:142–146` (_loadConference):
 *        const url = new URL(this._conference.room, this._conference.serverURL);
 *        const roomName = url.pathname.split('/').pop();
 *        const host = this._conference.serverURL.replace(/https?:\/\//, '');
 *        const hashParameters = parseURLParams(url);
 *    and `:169–177`: each `config.…` of them becomes a setting of the meeting (`configOverwrite`).
 * 4. `app/features/utils/parseURLParams.ts:65–71`, the app's own copy -- decoded, the first `\&`
 *    made `&`, read as JSON (`Bourne.parse`, `JSON.parse` for a string), and no curly quote touched:
 *        const decoded = decodeURIComponent(value).replace(/\\&/, '&');
 * 5. `app/features/conference/external_api.js`, Jitsi's external API as the app bundles it: the
 *    meeting is embedded at `https://${host}/` and the room name, and each setting goes into that
 *    address anew, as `config.` and `${key}=${encodeURIComponent(JSON.stringify(value))}`.
 * 6. Jitsi's page reads that address (`jitsiPageReads`, above).
 *
 * The other settings the app gives the meeting ride along and are left out here; the room and the
 * topic are what is in question.
 */
const appOpens = (appAddress) => {
  expect(appAddress.startsWith('jitsi-meet://')).toBe(true)
  let inputURL = appAddress.replace('jitsi-meet://', '')
  if (inputURL.slice(-1) === '/') inputURL = inputURL.slice(0, -1)

  const lastIndexOfSlash = inputURL.lastIndexOf('/')
  const room = inputURL.substring(lastIndexOfSlash + 1)
  const serverURL = `https://${inputURL.substring(0, lastIndexOfSlash)}`

  const url = new URL(room, serverURL)
  const roomName = url.pathname.split('/').pop()
  const host = serverURL.replace(/https?:\/\//, '')

  const configOverwrite = {}
  for (const part of url.hash.substring(1).split('&')) {
    const param = part.split('=')
    const decoded = decodeURIComponent(param[1]).replace(/\\&/, '&')
    if (param[0].startsWith('config.')) {
      configOverwrite[param[0].substring('config.'.length)] = JSON.parse(decoded)
    }
  }

  const meeting = `https://${host}/${roomName}`
  const embedded = `${meeting}#config.subject=${encodeURIComponent(JSON.stringify(configOverwrite.subject))}`
  return { meeting, title: () => jitsiPageReads(embedded)['config.subject'] }
}

/**
 * Topics of their own, and the title each has in the app: as typed, but for the curly double
 * quotes -- straight, since the app's external API writes the topic anew (chatVideoApp) -- and the
 * curly single ones, which Jitsi's page makes straight itself, in the browser as in the app.
 */
const TOPICS = [
  ['the default', 'Videoanruf', 'Videoanruf'],
  ['umlauts and spaces', 'Gespräch über Bäume', 'Gespräch über Bäume'],
  ['Greek', 'Συνάντηση για τον κήπο', 'Συνάντηση για τον κήπο'],
  ['Cyrillic', 'Встреча в пятницу', 'Встреча в пятницу'],
  ['an emoji', 'Kaffee ☕ und 🌳', 'Kaffee ☕ und 🌳'],
  ['straight quotes and a backslash', 'Das "Beste" aus C:\\Gärten', 'Das "Beste" aus C:\\Gärten'],
  ['German quotes, ending on U+201C', 'Lesekreis „Momo“', 'Lesekreis „Momo"'],
  ['English quotes', '“Momo”', '"Momo"'],
  ['single curly quotes', '‘x’', "'x'"],
  ['an ampersand, an equals sign, a hash', 'A & B = C #1', 'A & B = C #1'],
  ["what encodeURIComponent leaves: '()*!", "Rock'n'Roll (live)* !", "Rock'n'Roll (live)* !"],
  ['forty curly quotes', '“'.repeat(40), '"'.repeat(40)],
  ['forty three-byte characters', '€'.repeat(40), '€'.repeat(40)],
]

describe('chatVideoAppUrl', () => {
  // Bernd's form from the servers (Notiz §12), the scheme the app answers to in front.
  it('turns the default invitation into the address for the app, exactly', () => {
    expect(chatVideoAppUrl(withChatVideoTopic(FFMUC, 'Videoanruf'))).toBe(
      'jitsi-meet://meet.ffmuc.net/k7m2x9q4t8wz#config.subject=%22Videoanruf%22',
    )
  })

  // The prefix is part of the room: fairmeeting knows the academy's licence by it (E-035).
  it("keeps a server's prefix in the room", () => {
    expect(chatVideoAppUrl(withChatVideoTopic(FAIRMEETING, 'Videoanruf'))).toBe(
      'jitsi-meet://fairmeeting.net/GradidoAkademiek7m2x9q4t8wz#config.subject=%22Videoanruf%22',
    )
  })

  it('carries umlauts and Cyrillic as the address for the browser does', () => {
    expect(chatVideoAppUrl(withChatVideoTopic(FFMUC, 'Gespräch über Bäume'))).toBe(
      'jitsi-meet://meet.ffmuc.net/k7m2x9q4t8wz#config.subject=%22Gespr%C3%A4ch%20%C3%BCber%20B%C3%A4ume%22',
    )
    expect(chatVideoAppUrl(withChatVideoTopic(FAIRMEETING, 'Встреча'))).toBe(
      'jitsi-meet://fairmeeting.net/GradidoAkademiek7m2x9q4t8wz#config.subject=%22%D0%92%D1%81%D1%82%D1%80%D0%B5%D1%87%D0%B0%22',
    )
  })

  // „Momo“ ends on U+201C: the browser's address keeps it as an escape, the app's has a straight
  // quote there -- escaped in the JSON, so the JSON holds.
  it('makes the closing quote of „Momo“ straight', () => {
    const browser = withChatVideoTopic(FFMUC, 'Lesekreis „Momo“')

    expect(browser).toBe(
      'https://meet.ffmuc.net/k7m2x9q4t8wz#config.subject=%22Lesekreis%20%E2%80%9EMomo%5Cu201c%22',
    )
    expect(chatVideoAppUrl(browser)).toBe(
      'jitsi-meet://meet.ffmuc.net/k7m2x9q4t8wz#config.subject=%22Lesekreis%20%E2%80%9EMomo%5C%22%22',
    )
  })

  // The same guards as in the browser's address: `&` as an escape (Jitsi makes `\&` into `&`),
  // `'()*!` percent-encoded (the thread's link finder stops at them).
  it("lets & and '()*! through, guarded as in the browser's address", () => {
    expect(chatVideoAppUrl(withChatVideoTopic(FFMUC, 'A & B'))).toBe(
      'jitsi-meet://meet.ffmuc.net/k7m2x9q4t8wz#config.subject=%22A%20%5Cu0026%20B%22',
    )
    expect(chatVideoAppUrl(withChatVideoTopic(FFMUC, "Rock'n'Roll (live)* !"))).toBe(
      'jitsi-meet://meet.ffmuc.net/k7m2x9q4t8wz#config.subject=%22Rock%27n%27Roll%20%28live%29%2A%20%21%22',
    )
  })

  // Nothing but the scheme changes where no curly double quote is in the topic: server, path and
  // room come as the invitation has them.
  it.each(TOPICS.filter(([, topic, title]) => topic === title))(
    'changes nothing but the scheme for %s',
    (_, topic) => {
      for (const room of [FFMUC, FAIRMEETING]) {
        const browser = withChatVideoTopic(room, topic)
        expect(chatVideoAppUrl(browser)).toBe(browser.replace(/^https:/, 'jitsi-meet:'))
      }
    },
  )
})

describe("the app's round trip", () => {
  // ⛔ What the second way promises: the app opens the room the browser opens -- the same server,
  // the same room -- and gives the meeting the topic as its title.
  it.each(TOPICS)('opens the same room on the same server, titled, with %s', (_, topic, title) => {
    for (const room of [FFMUC, FAIRMEETING]) {
      const browser = withChatVideoTopic(room, topic)
      const opened = appOpens(chatVideoAppUrl(browser))

      expect(opened.meeting).toBe(withoutChatVideoTopic(browser))
      expect(opened.meeting).toBe(room)
      expect(opened.title()).toBe(title)
    }
  })

  // ⚠️ The limit: a backslash right before `&`. The app writes the topic anew without V4a's guard,
  // and Jitsi's page makes the first `\&` of the JSON into `&` -- `\&` is no escape JSON knows, and
  // the meeting goes without its title. The room is the same all the same.
  it('opens the same room where a backslash stands before an ampersand', () => {
    for (const room of [FFMUC, FAIRMEETING]) {
      const browser = withChatVideoTopic(room, 'Pfad \\& Weg')

      expect(appOpens(chatVideoAppUrl(browser)).meeting).toBe(room)
    }
  })
})

describe("somebody else's address", () => {
  // The form every case below breaks in one place only.
  it('is taken where it has exactly the form of our own', () => {
    expect(chatVideoAppUrl(`${FFMUC}#config.subject=%22x%22`)).toBe(
      'jitsi-meet://meet.ffmuc.net/k7m2x9q4t8wz#config.subject=%22x%22',
    )
  })

  it.each([
    ['another addition', `${FFMUC}#foo`],
    ['a second setting', `${FFMUC}#config.subject=%22x%22&config.startWithAudioMuted=true`],
    // Jitsi splits at a raw `&`; our value never has one (V4a writes it as an escape).
    ['a raw & inside the value', `${FFMUC}#config.subject=%22a&b%22`],
    ['a # before the addition', `${FFMUC}#a#config.subject=%22x%22`],
    ['a # after the value', `${FFMUC}#config.subject=%22x%22#b`],
    ['a raw # inside the value', `${FFMUC}#config.subject=%22a#b%22`],
    ['a setting of another name', `${FFMUC}#config.subjectX=%22x%22`],
    ['http', 'http://meet.ffmuc.net/k7m2x9q4t8wz#config.subject=%22x%22'],
    ['a query', `${FFMUC}?x=1#config.subject=%22x%22`],
    ['no room after the server', 'https://meet.ffmuc.net#config.subject=%22x%22'],
    ['a path that ends on /', 'https://meet.ffmuc.net/#config.subject=%22x%22'],
    ['no addition at all', FFMUC],
    ['a page of another kind', 'https://gradido.net/de/'],
  ])('gets no address for the app: %s', (_, address) => {
    expect(chatVideoAppUrl(address)).toBeNull()
  })

  it.each([
    ['no JSON', `${FFMUC}#config.subject=x`],
    ['JSON cut off', `${FFMUC}#config.subject=%22x`],
    ['a broken percent-encoding', `${FFMUC}#config.subject=%22%E0%A4%A%22`],
    ['a number', `${FFMUC}#config.subject=42`],
    ['null', `${FFMUC}#config.subject=null`],
    ['a list', `${FFMUC}#config.subject=%5B%22x%22%5D`],
  ])('gets none for a value it cannot read as a topic: %s', (_, address) => {
    expect(chatVideoAppUrl(address)).toBeNull()
  })
})

describe('offersJitsiApp', () => {
  /** The one question the device is asked: a mouse or a touchpad, which can hover. */
  const COMPUTER = '(pointer: fine) and (hover: hover)'

  /**
   * A device as the browser describes it. The stand-in for `matchMedia` answers to that one
   * question only, so a test sees which question is asked.
   */
  const device = ({ userAgent, maxTouchPoints = 0, fine }) => {
    vi.stubGlobal('navigator', { userAgent, maxTouchPoints })
    vi.stubGlobal('matchMedia', (query) => ({ matches: query === COMPUTER && fine }))
  }

  const MAC_CHROME =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
  const IPAD_SAFARI =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15'
  const WINDOWS_CHROME =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
  const ANDROID_CHROME =
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36'
  const IPHONE_SAFARI =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1'
  const OLD_IPAD_SAFARI =
    'Mozilla/5.0 (iPad; CPU OS 12_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1 Mobile/15E148 Safari/604.1'

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('offers the app on a Mac with a mouse', () => {
    device({ userAgent: MAC_CHROME, fine: true })
    expect(offersJitsiApp()).toBe(true)
  })

  it('offers it on a Windows laptop with a touchscreen, whose pointer is fine and hovers', () => {
    device({ userAgent: WINDOWS_CHROME, maxTouchPoints: 10, fine: true })
    expect(offersJitsiApp()).toBe(true)
  })

  it('does not offer it where the pointer is a finger', () => {
    device({ userAgent: WINDOWS_CHROME, maxTouchPoints: 10, fine: false })
    expect(offersJitsiApp()).toBe(false)
  })

  // The safe side: without the question, only the second way is missing.
  it('does not offer it where the browser cannot be asked', () => {
    device({ userAgent: MAC_CHROME, fine: true })
    vi.stubGlobal('matchMedia', undefined)
    expect(offersJitsiApp()).toBe(false)
  })

  // ⛔ Safari on an iPad calls itself a Mac (iPadOS 13 on), and with a trackpad its pointer is
  // fine and hovers: the points to touch give it away.
  it('does not offer it to an iPad that calls itself a Mac, even with a trackpad', () => {
    device({ userAgent: IPAD_SAFARI, maxTouchPoints: 5, fine: true })
    expect(offersJitsiApp()).toBe(false)
  })

  it.each([
    ['an Android phone with a mouse', ANDROID_CHROME],
    ['an iPhone', IPHONE_SAFARI],
    ['an iPad that says so', OLD_IPAD_SAFARI],
  ])('does not offer it to %s, whatever its pointer', (_, userAgent) => {
    device({ userAgent, maxTouchPoints: 5, fine: true })
    expect(offersJitsiApp()).toBe(false)
  })

  // Nothing kept: the next call asks again.
  it('asks anew at every call', () => {
    device({ userAgent: MAC_CHROME, fine: true })
    expect(offersJitsiApp()).toBe(true)

    device({ userAgent: MAC_CHROME, fine: false })
    expect(offersJitsiApp()).toBe(false)
  })
})

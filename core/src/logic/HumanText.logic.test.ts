// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { BOLD_PATTERN, EMAIL_PATTERN, humanTextParts, URL_PATTERN } from './HumanText.logic'

describe('humanTextParts', () => {
  it('leaves a text without addresses as one piece of text', () => {
    expect(humanTextParts('Shall we meet at ten?')).toEqual([
      { type: 'text', value: 'Shall we meet at ten?' },
    ])
  })

  it('cuts out a web address, without the punctuation that ends the sentence', () => {
    expect(humanTextParts('Room: https://virtual.chaosdorf.space/0mw1hppxkzme.')).toEqual([
      { type: 'text', value: 'Room: ' },
      { type: 'url', value: 'https://virtual.chaosdorf.space/0mw1hppxkzme' },
      { type: 'text', value: '.' },
    ])
  })

  it('cuts out an e-mail address', () => {
    expect(humanTextParts('write to a@b.de please')).toEqual([
      { type: 'text', value: 'write to ' },
      { type: 'email', value: 'a@b.de' },
      { type: 'text', value: ' please' },
    ])
  })

  it('does not cut an e-mail address out of a web address', () => {
    expect(humanTextParts('https://x.org/?to=a@b.de')).toEqual([
      { type: 'url', value: 'https://x.org/?to=a@b.de' },
    ])
  })

  it('makes no link of a scheme that is not http, https or ftp', () => {
    expect(humanTextParts('javascript:alert(1)')).toEqual([
      { type: 'text', value: 'javascript:alert(1)' },
    ])
  })

  it('keeps markup as text: it is never read here, the template escapes it', () => {
    expect(humanTextParts('<img src=x onerror=alert(1)> https://x.org')).toEqual([
      { type: 'text', value: '<img src=x onerror=alert(1)> ' },
      { type: 'url', value: 'https://x.org' },
    ])
  })

  it('keeps the line breaks in the text around an address', () => {
    expect(humanTextParts('one\nhttps://x.org\ntwo')).toEqual([
      { type: 'text', value: 'one\n' },
      { type: 'url', value: 'https://x.org' },
      { type: 'text', value: '\ntwo' },
    ])
  })

  it('gives nothing for a text that is missing', () => {
    expect(humanTextParts(undefined)).toEqual([])
    expect(humanTextParts(null)).toEqual([])
    expect(humanTextParts('')).toEqual([])
  })
})

/**
 * A video invitation from the wallet: the room's address, after its `#` the topic (V4a) and, for
 * a planned call, its start and end (V5b). The mail shows the room, as the wallet's thread does;
 * the link keeps the whole address.
 */
describe('humanTextParts with a video invitation', () => {
  const ROOM = 'https://meet.weimarnetz.de/idpdd16o81l0'
  const PLANNED = `${ROOM}#config.subject=%22Videoanruf%22&gradido.start=1790686800&gradido.end=1790690400`
  const NOW = `${ROOM}#config.subject=%22Lesekreis%22`

  it('shows the room of a planned call, the whole address its link', () => {
    expect(humanTextParts(`Der Raum: ${PLANNED}`)).toEqual([
      { type: 'text', value: 'Der Raum: ' },
      { type: 'url', value: PLANNED, shown: ROOM },
    ])
  })

  it('shows the room of a call now, with its topic alone', () => {
    expect(humanTextParts(NOW)).toEqual([{ type: 'url', value: NOW, shown: ROOM }])
  })

  // Somebody else's address, or one no wallet of ours writes: it shows whole.
  it('shows every other address whole, a `#` of somebody else’s too', () => {
    for (const address of [
      'https://x.org/a#section',
      `${ROOM}#config.subject=%22x%22&config.startWithAudioMuted=true`,
      `${ROOM}#config.subject=%22x%22&gradido.start=1790686800`,
      `${ROOM}#config.subject=%22x%22&gradido.start=9999999999999&gradido.end=99999999999999`,
      `${ROOM}#a#config.subject=%22x%22`,
      ROOM,
    ]) {
      expect(humanTextParts(address)).toEqual([{ type: 'url', value: address }])
    }
  })
})

describe('humanTextParts with bold', () => {
  it('makes a run between two pairs of stars bold, and drops the stars', () => {
    expect(humanTextParts('We meet **at ten**, ok?', { bold: true })).toEqual([
      { type: 'text', value: 'We meet ' },
      { type: 'bold', value: 'at ten' },
      { type: 'text', value: ', ok?' },
    ])
  })

  it('takes the shortest run, across line breaks', () => {
    expect(humanTextParts('**one\ntwo** and **three**', { bold: true })).toEqual([
      { type: 'bold', value: 'one\ntwo' },
      { type: 'text', value: ' and ' },
      { type: 'bold', value: 'three' },
    ])
  })

  it('never reaches across a link, and leaves a star without its partner', () => {
    expect(humanTextParts('**https://x.org** *half', { bold: true })).toEqual([
      { type: 'text', value: '**' },
      { type: 'url', value: 'https://x.org' },
      { type: 'text', value: '** *half' },
    ])
  })

  it('leaves the stars where bold is not asked for - a memo keeps them, as in the wallet', () => {
    expect(humanTextParts('**at ten**')).toEqual([{ type: 'text', value: '**at ten**' }])
  })
})

/**
 * The mail finds an address exactly where the wallet does, so a message reads the same in both.
 * Neither package can import the other, so the wallet's source is read here: when its patterns
 * change, this fails until the mail's follow.
 */
describe('the patterns are the wallet’s', () => {
  const wallet = readFileSync(
    path.join(__dirname, '../../../frontend/src/utils/memoParts.js'),
    'utf8',
  )
  const walletPattern = (name: string): string | undefined =>
    wallet.match(new RegExp(`^const ${name} = (/.+/[a-z]*)\\r?$`, 'm'))?.[1]

  it('for web addresses', () => {
    expect(walletPattern('URL_PATTERN')).toBe(URL_PATTERN.toString())
  })

  it('for e-mail addresses', () => {
    expect(walletPattern('EMAIL_PATTERN')).toBe(EMAIL_PATTERN.toString())
  })

  // The wallet builds this rule from two pieces (`SCHEDULE`, `OWN_ADDITION`), so it is held by
  // what it does rather than by its text: the wallet's module has no imports of its own and is
  // loaded here as it is. The same addresses in, the same text out.
  it('for the addition of a video invitation', async () => {
    const { withoutChatVideoTopic } = await import(
      path.join(__dirname, '../../../frontend/src/utils/chatVideoTopic.js')
    )
    const room = 'https://meet.weimarnetz.de/idpdd16o81l0'
    for (const address of [
      `${room}#config.subject=%22Videoanruf%22&gradido.start=1790686800&gradido.end=1790690400`,
      `${room}#config.subject=%22Lesekreis%22`,
      `${room}#config.subject=`,
      `${room}#config.subject=%22x%22&config.startWithAudioMuted=true`,
      `${room}#config.subject=%22x%22&gradido.start=1790686800`,
      `${room}#config.subject=%22x%22&gradido.start=soon&gradido.end=1790690400`,
      `${room}#config.subject=%22x%22&gradido.start=9999999999999&gradido.end=99999999999999`,
      `${room}#a#config.subject=%22x%22`,
      'https://x.org/a#section',
      room,
    ]) {
      const [part] = humanTextParts(address)
      expect(part.shown ?? part.value).toBe(withoutChatVideoTopic(address))
    }
  })

  it('for bold', () => {
    const chat = readFileSync(
      path.join(__dirname, '../../../frontend/src/utils/chatTextParts.js'),
      'utf8',
    )
    expect(chat.match(/^const BOLD_PATTERN = (\/.+\/[a-z]*)\r?$/m)?.[1]).toBe(
      BOLD_PATTERN.toString(),
    )
  })
})

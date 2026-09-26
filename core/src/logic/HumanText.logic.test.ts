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

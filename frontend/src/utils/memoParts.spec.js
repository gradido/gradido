// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { memoParts } from './memoParts'

describe('memoParts', () => {
  it('leaves a memo without addresses as one piece of text', () => {
    expect(memoParts('Danke für den Kaffee')).toEqual([
      { type: 'text', value: 'Danke für den Kaffee' },
    ])
  })

  // ⛔ The reason this file exists: markup in a memo is text like any other -- the sender
  // wrote it, and nothing here may turn it into an element.
  it('keeps markup as text, character for character', () => {
    const memo = 'hi <b>there</b> <img src="x" data-probe>'
    expect(memoParts(memo)).toEqual([{ type: 'text', value: memo }])
  })

  it('cuts out a web address, with the text around it intact', () => {
    expect(memoParts('see https://gradido.net/de/ for more')).toEqual([
      { type: 'text', value: 'see ' },
      { type: 'url', value: 'https://gradido.net/de/' },
      { type: 'text', value: ' for more' },
    ])
  })

  it('cuts out an e-mail address', () => {
    expect(memoParts('write to info@gradido.net please')).toEqual([
      { type: 'text', value: 'write to ' },
      { type: 'email', value: 'info@gradido.net' },
      { type: 'text', value: ' please' },
    ])
  })

  // The old code ran its e-mail pattern over the links it had just built, and cut an
  // address out of the middle of one.
  it('does not cut an address out of a web address that contains one', () => {
    expect(memoParts('https://example.org/?to=info@gradido.net')).toEqual([
      { type: 'url', value: 'https://example.org/?to=info@gradido.net' },
    ])
  })

  it('makes no link of anything but http, https and ftp', () => {
    expect(memoParts('javascript://alert')).toEqual([{ type: 'text', value: 'javascript://alert' }])
  })

  it('has nothing to show for no memo', () => {
    expect(memoParts('')).toEqual([])
    expect(memoParts(undefined)).toEqual([])
  })
})

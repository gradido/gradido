// AI-GENERATED — not an architecture reference

import { describe, it, expect } from 'vitest'
import { safeWalletPath, SAFE_WALLET_PATH_MAX } from './safeWalletPath'

/**
 * What the hand-over `/authenticate?token=…&redirect=…` follows (routes/guards.js): an address
 * that came with a link from outside, and may name a page of this wallet and nothing else.
 */
describe('safeWalletPath', () => {
  // The address the admin's pin leads to: the map, on the member named by the pair.
  const MAP =
    '/matching/karte?with=1b2c3d4e-5f60-4a7b-8c9d-0e1f2a3b4c5d&community=9f8e7d6c-5b4a-4c3d-9e2f-1a0b9c8d7e6f'

  describe('an address inside the wallet', () => {
    it.each([
      ['a page', '/overview'],
      ['the start', '/'],
      ['a page with its query', MAP],
      ['a page with a hash', '/contributions/own-contributions/1#contributionListItem-12'],
      ['a page with a colon further in', '/redeem/CL-abc?note=a:b'],
    ])('is given back as it came: %s', (_name, address) => {
      expect(safeWalletPath(address)).toBe(address)
    })
  })

  describe('anything else', () => {
    it.each([
      ['nothing', undefined],
      ['null', null],
      ['a number', 42],
      // What vue-router hands over for `?redirect=/a&redirect=/b`.
      ['a list of addresses', ['/overview', '/send']],
      // And for `?redirect=/&redirect=overview`: a list whose first entry is a slash looks
      // like a path to everything but the question what it is.
      ['a list that begins like a path', ['/', 'overview']],
      ['an object', { path: '/overview' }],
    ])('is refused where it is no string: %s', (_name, value) => {
      expect(safeWalletPath(value)).toBeNull()
    })

    it.each([
      ['an empty address', ''],
      ['an address with a protocol', 'https://example.org/overview'],
      ['an address with a protocol and no slashes', 'javascript:alert(1)'],
      ['a mail address', 'mailto:somebody@example.org'],
      ['another host, as a browser spells it', '//example.org/overview'],
      ['three slashes', '///example.org'],
      ['a path that does not start at the root', 'matching/karte'],
      ['a dot path', './overview'],
    ])('is refused where it does not begin with exactly one slash: %s', (_name, address) => {
      expect(safeWalletPath(address)).toBeNull()
    })

    // A browser reads a backslash as a slash: `/\host` is `//host`.
    it.each([
      ['right behind the slash', '/\\example.org'],
      ['further in', '/overview\\..\\x'],
    ])('is refused with a backslash %s', (_name, address) => {
      expect(safeWalletPath(address)).toBeNull()
    })

    // A browser drops tabs and line breaks from an address before it reads it.
    it.each([
      ['a tab between two slashes', '/\t/example.org'],
      ['a line feed', '/\n/example.org'],
      ['a carriage return', '/\r/example.org'],
      ['a space', '/over view'],
      ['a space at the end', '/overview '],
      ['a NUL', `/overview${String.fromCharCode(0)}`],
      ['a DEL', `/overview${String.fromCharCode(0x7f)}`],
    ])('is refused with %s in it', (_name, address) => {
      expect(safeWalletPath(address)).toBeNull()
    })
  })

  describe('the length', () => {
    const ofLength = (length) => '/' + 'a'.repeat(length - 1)

    it('takes an address of 512 characters', () => {
      expect(SAFE_WALLET_PATH_MAX).toBe(512)
      const address = ofLength(512)
      expect(address).toHaveLength(512)
      expect(safeWalletPath(address)).toBe(address)
    })

    it('refuses one character more', () => {
      expect(safeWalletPath(ofLength(513))).toBeNull()
    })
  })
})

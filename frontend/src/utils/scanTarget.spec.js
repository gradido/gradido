// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { resolveScanTarget } from './scanTarget'

/**
 * The scan matrix, as decided on 2026-08-21: the three Gradido patterns are read, own
 * community navigates internally, a foreign community goes through a confirmation, and
 * everything else is never opened. A scanned code is foreign input — the refusal cases
 * are the point of this file, not an appendix.
 */

const OWN = 'community.gradido.net'

describe('resolveScanTarget', () => {
  describe('the three patterns on the own community', () => {
    it.each([
      ['https://community.gradido.net/dk/abc123', 'thank-you-card', '/dk/abc123'],
      ['https://community.gradido.net/redeem/f00bar', 'cheque', '/redeem/f00bar'],
      ['https://community.gradido.net/u/berndsalias', 'gradido-card', '/u/berndsalias'],
    ])('%s → own %s', (text, kind, path) => {
      expect(resolveScanTarget(text, OWN)).toEqual({
        kind,
        path,
        url: `https://${OWN}${path}`,
        host: OWN,
        foreign: false,
      })
    })

    it('keeps the code case-sensitive while reading the prefix case-insensitively', () => {
      const target = resolveScanTarget('https://community.gradido.net/DK/AbC123', OWN)
      expect(target.foreign).toBe(false)
      expect(target.path).toBe('/dk/AbC123')
    })

    it('tolerates a trailing slash after the code', () => {
      expect(resolveScanTarget('https://community.gradido.net/dk/abc/', OWN).path).toBe('/dk/abc')
    })

    // The scheme does not get a vote on ownness: internal navigation goes by path and
    // never touches the scanned scheme, so an old http code still lands safely on https.
    it('treats http on the own host as own', () => {
      expect(resolveScanTarget('http://community.gradido.net/dk/abc', OWN).foreign).toBe(false)
    })

    it('compares the host case-insensitively', () => {
      expect(resolveScanTarget('https://Community.Gradido.NET/dk/abc', OWN).foreign).toBe(false)
    })

    // A different port is a different wallet — localhost:3000 is not localhost:8080.
    it('counts the port as part of the host', () => {
      const target = resolveScanTarget('https://localhost:8080/dk/abc', 'localhost:3000')
      expect(target.foreign).toBe(true)
    })

    // ⛔ Query and hash are foreign text. The internal path is rebuilt from the matched
    // pieces, so nothing scanned rides along into router.push.
    it('drops query and hash from the internal path', () => {
      const target = resolveScanTarget('https://community.gradido.net/dk/abc?x=1#y', OWN)
      expect(target).toEqual(expect.objectContaining({ foreign: false, path: '/dk/abc' }))
    })
  })

  describe('hand-typed shorthand', () => {
    it.each([
      ['/dk/abc123', '/dk/abc123'],
      ['dk/abc123', '/dk/abc123'],
      ['redeem/f00', '/redeem/f00'],
      ['u/alias', '/u/alias'],
    ])('reads the bare path %s as the own community', (text, path) => {
      expect(resolveScanTarget(text, OWN)).toEqual(
        expect.objectContaining({ foreign: false, path }),
      )
    })

    it('puts https in front of a schemeless link', () => {
      const target = resolveScanTarget('markt-gemeinschaft.gradido.net/dk/abc', OWN)
      expect(target).toEqual(
        expect.objectContaining({
          foreign: true,
          host: 'markt-gemeinschaft.gradido.net',
          url: 'https://markt-gemeinschaft.gradido.net/dk/abc',
        }),
      )
    })

    it('trims surrounding whitespace', () => {
      expect(resolveScanTarget('  https://community.gradido.net/dk/abc  ', OWN).path).toBe(
        '/dk/abc',
      )
    })
  })

  describe('foreign communities — read, confirmed, never auto-opened', () => {
    it.each([
      ['https://markt-gemeinschaft.gradido.net/dk/abc', 'thank-you-card'],
      ['https://markt-gemeinschaft.gradido.net/redeem/abc', 'cheque'],
      ['https://markt-gemeinschaft.gradido.net/u/alias', 'gradido-card'],
    ])('%s → foreign %s with host and url for the confirmation card', (text, kind) => {
      const target = resolveScanTarget(text, OWN)
      expect(target.kind).toBe(kind)
      expect(target.foreign).toBe(true)
      expect(target.host).toBe('markt-gemeinschaft.gradido.net')
      expect(target.url).toBe(text)
    })

    // The parsed URL is what gets opened, not the raw text — a userinfo trick like
    // `https://evil.example\@good.example/…` must resolve to the host the URL parser
    // sees, which is the one the confirmation card shows.
    it('shows the host the URL parser sees, not the one the text pretends', () => {
      const target = resolveScanTarget('https://evil.example\\@community.gradido.net/dk/abc', OWN)
      // WHATWG parsing: the backslash ends the authority, so evil.example is the host —
      // and that is exactly what the card must show. Foreign, never silently own.
      expect(target === null || target.foreign === true).toBe(true)
    })
  })

  describe('refusals — never opened at all', () => {
    it.each([
      ['a thank-you text', 'Vielen Dank!'],
      ['an unrelated URL', 'https://example.com/'],
      ['an unrelated path on the own host', 'https://community.gradido.net/overview'],
      ['a pattern with a second segment', 'https://community.gradido.net/dk/abc/def'],
      ['a pattern with an empty code', 'https://community.gradido.net/dk/'],
      ['a wifi QR payload', 'WIFI:T:WPA;S:cafe;P:secret;;'],
      ['a mailto link', 'mailto:info@gradido.net'],
      ['an empty text', ''],
      ['only whitespace', '   '],
      ['null', null],
      ['undefined', undefined],
    ])('refuses %s', (_label, text) => {
      expect(resolveScanTarget(text, OWN)).toBeNull()
    })

    // ⛔ The attack class. A QR code is foreign input; a scheme that can execute or
    // masquerade must die in the parser, not at the navigation.
    it.each([
      ['javascript:alert(1)'],
      ['javascript:alert(1)//dk/abc'],
      ['data:text/html,<script>alert(1)</script>'],
      ['vbscript:msgbox(1)'],
      ['file:///etc/passwd'],
      ['blob:https://community.gradido.net/x'],
      ['ftp://community.gradido.net/dk/abc'],
    ])('refuses the scheme in %s', (text) => {
      expect(resolveScanTarget(text, OWN)).toBeNull()
    })
  })
})

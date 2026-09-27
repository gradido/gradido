// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'vitest'
import { SWISSTRANSFER_URL, isSwissTransferLink, swissTransferLabel } from './chatFileLink'
import { chatTextParts } from './chatTextParts'

/**
 * Links as SwissTransfer shares them (27.09.2026): its website from `www.swisstransfer.com`, its
 * app from `swisstransfer.infomaniak.com`, both with `/dl/` and the transfer's uuid. `/d/` is the
 * older form, which SwissTransfer's apps still open (`ApiUrlMatcher.kt`: V1 and V2).
 */
const LINK = 'https://www.swisstransfer.com/d/7f3a9c2e-5b1d-4e8a-9c3f-2d6b8a1e4f70'
const WEB_LINK = 'https://www.swisstransfer.com/dl/018f6c2a-3b4d-7e5f-9a1b-2c3d4e5f6a7b'
const APP_LINK = 'https://swisstransfer.infomaniak.com/dl/018f6c2b-9c8d-7e6f-8a5b-4c3d2e1f0a9b'

describe('SWISSTRANSFER_URL', () => {
  // The page picks its language from the browser's; `/tr` would be a 404.
  it('is the front page, without a language in the path', () => {
    expect(SWISSTRANSFER_URL).toBe('https://www.swisstransfer.com/')
  })
})

describe('isSwissTransferLink', () => {
  it.each([
    ['a link with www.', LINK],
    ['a link without www.', 'https://swisstransfer.com/d/7f3a9c2e-5b1d-4e8a-9c3f-2d6b8a1e4f70'],
    ['a link of the website, /dl/', WEB_LINK],
    ["a link of the app, from SwissTransfer's second host", APP_LINK],
    ["the app's host with /d/", 'https://swisstransfer.infomaniak.com/d/7f3a9c2e'],
    ['a link with a language', 'https://www.swisstransfer.com/de/d/7f3a9c2e'],
    ['a link on another subdomain', 'https://files.swisstransfer.com/d/7f3a9c2e'],
    // A browser reads the host in small letters, and so does the card.
    ['a host in capitals', 'https://WWW.SwissTransfer.COM/d/7f3a9c2e'],
    ["the app's host in capitals", 'https://SwissTransfer.Infomaniak.COM/dl/7f3a9c2e'],
    ['a scheme in capitals', 'HTTPS://www.swisstransfer.com/d/7f3a9c2e'],
  ])('takes %s', (_, url) => {
    expect(isSwissTransferLink(url)).toBe(true)
  })

  /**
   * ⛔ The card vouches for the destination, so everything that is not plainly a link to files on
   * SwissTransfer's own host stays an ordinary link, whole: the host is what counts.
   */
  it.each([
    ['plain http', 'http://www.swisstransfer.com/d/7f3a9c2e'],
    [
      'a query (a password in the address)',
      'https://www.swisstransfer.com/d/7f3a9c2e?password=123',
    ],
    ['a # after the id', 'https://www.swisstransfer.com/d/7f3a9c2e#anything'],
    ['/d/ without an id', 'https://www.swisstransfer.com/d/'],
    ['a path past the id', 'https://www.swisstransfer.com/d/x/y'],
    ['a host that only begins with it', 'https://swisstransfer.com.example.org/d/x'],
    ['a host that only ends with it', 'https://evil-swisstransfer.com/d/x'],
    ['another top-level domain', 'https://swisstransfer.co/d/x'],
    // Of infomaniak.com only SwissTransfer's own host: Infomaniak runs other services there.
    ["plain http on the app's host", 'http://swisstransfer.infomaniak.com/dl/x'],
    ['another service of Infomaniak', 'https://kdrive.infomaniak.com/dl/x'],
    ['Infomaniak itself', 'https://infomaniak.com/dl/x'],
    ["a subdomain of the app's host", 'https://files.swisstransfer.infomaniak.com/dl/x'],
    [
      "a host that only begins with the app's",
      'https://swisstransfer.infomaniak.com.example.org/dl/x',
    ],
    ["a host that only ends with the app's", 'https://evil-swisstransfer.infomaniak.com/dl/x'],
    ['a dash in place of its dot', 'https://swisstransfer-infomaniak.com/dl/x'],
    ['a name before an @', 'https://www.swisstransfer.com@example.org/d/x'],
    ['a port', 'https://www.swisstransfer.com:8443/d/x'],
    ['the front page', 'https://www.swisstransfer.com/'],
    ['a page that is not a download', 'https://www.swisstransfer.com/de/faq'],
    // The path as SwissTransfer's own recognition reads it: `/d/` and `/dl/` in small letters.
    ['/D/ in capitals', 'https://www.swisstransfer.com/D/7f3a9c2e'],
    ['a language of three letters', 'https://www.swisstransfer.com/deu/d/7f3a9c2e'],
    ['another service', 'https://wetransfer.com/downloads/7f3a9c2e/abc'],
    ['another address', 'https://gradido.net/de/'],
    ['no address at all', 'swisstransfer.com/d/7f3a9c2e'],
  ])('does not take %s', (_, url) => {
    expect(isSwissTransferLink(url)).toBe(false)
  })

  it('takes nothing that is not text', () => {
    expect(isSwissTransferLink(undefined)).toBe(false)
    expect(isSwissTransferLink(null)).toBe(false)
  })

  /**
   * The card replaces what the thread found as an address (chatTextParts), so a link has to reach
   * it whole: its characters are among those an address may carry, and a full stop after it in a
   * sentence stays out.
   */
  it.each([LINK, WEB_LINK, APP_LINK, 'https://www.swisstransfer.com/de/d/7f3a9c2e'])(
    'is found whole in a message: %s',
    (url) => {
      const parts = chatTextParts(`Hier ist die Datei: ${url}. Danke!`)
      expect(parts.filter((part) => part.type === 'url')).toEqual([{ type: 'url', value: url }])
      expect(isSwissTransferLink(parts[1].value)).toBe(true)
    },
  )
})

describe('swissTransferLabel', () => {
  it.each([
    [LINK, 'swisstransfer.com/d/7f3a9c2e-5b1d-4e8a-9c3f-2d6b8a1e4f70'],
    ['https://swisstransfer.com/d/7f3a9c2e', 'swisstransfer.com/d/7f3a9c2e'],
    [WEB_LINK, 'swisstransfer.com/dl/018f6c2a-3b4d-7e5f-9a1b-2c3d4e5f6a7b'],
    // The app's host stays whole: the card names where the link leads.
    [APP_LINK, 'swisstransfer.infomaniak.com/dl/018f6c2b-9c8d-7e6f-8a5b-4c3d2e1f0a9b'],
    ['https://www.swisstransfer.com/de/d/7f3a9c2e', 'swisstransfer.com/de/d/7f3a9c2e'],
    ['https://files.swisstransfer.com/d/7f3a9c2e', 'files.swisstransfer.com/d/7f3a9c2e'],
    // The host as a browser shows it; the id keeps its letters.
    ['HTTPS://WWW.SwissTransfer.COM/dl/Ab3dE5fG', 'swisstransfer.com/dl/Ab3dE5fG'],
  ])('shows %s as %s', (url, label) => {
    expect(swissTransferLabel(url)).toBe(label)
  })
})

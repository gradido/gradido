// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'vitest'
import {
  SWISSTRANSFER_URL,
  fileLinkLabel,
  fileLinkService,
  isSwissTransferLink,
} from './chatFileLink'
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

describe('fileLinkLabel', () => {
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
    expect(fileLinkLabel(url)).toBe(label)
  })
})

/**
 * The big four (Bernd, 27.09.2026), each by the addresses its own code or links name: the shapes
 * follow the links found in public code and in the tests of yt-dlp and transferwee; the ids are
 * invented, so no test points at somebody's files.
 */
const DROPBOX =
  'https://www.dropbox.com/scl/fi/k7m2x9q4t8wzp3n6r1v5c/Bericht.pdf?rlkey=q2w3e4r5t6y7u8i9o0p1a2s3d&dl=0'
const DRIVE =
  'https://drive.google.com/file/d/1QwErTyUiOpAsDfGhJkLzXcVbNm123456/view?usp=drive_link'
const ONEDRIVE =
  'https://1drv.ms/u/c/1a2b3c4d5e6f7a8b/EQwErTyUiOpAsDfGhJkLzXcBQwErTyUiOpAsDfGhJkLzXc?e=AbC123'
const WETRANSFER = 'https://we.tl/t-Qw3Er5Ty7U'

describe('fileLinkService', () => {
  it.each([
    ['SwissTransfer', LINK],
    ['SwissTransfer', APP_LINK],
    // Dropbox: today's file and folder links (with `rlkey`), the older ones, Dropbox Transfer.
    ['Dropbox', DROPBOX],
    [
      'Dropbox',
      'https://www.dropbox.com/scl/fo/k7m2x9q4t8wzp3n6r1v5c/AQwErTyUiOpAsDfGhJkLzXc?rlkey=q2w3e4r5t6y7u8i9o0p1a2s3d&dl=0',
    ],
    ['Dropbox', 'https://www.dropbox.com/s/k7m2x9q4t8wzp3n/Bericht%202026.pdf?dl=0'],
    ['Dropbox', 'https://www.dropbox.com/sh/k7m2x9q4t8wzp3n/AABQwErTyUiOpAsDfGhJkLzX?dl=0'],
    ['Dropbox', 'https://www.dropbox.com/t/Qw3Er5Ty7Ui9Op1A'],
    ['Dropbox', 'https://dropbox.com/s/k7m2x9q4t8wzp3n'],
    // Google Drive: a file, a folder (also under an account), the older `open` and `uc`, Docs.
    ['Google Drive', DRIVE],
    ['Google Drive', 'https://drive.google.com/file/d/0BqWeRtYuIoPaSdFgHjKlZxCv/edit?pli=1'],
    [
      'Google Drive',
      'https://drive.google.com/drive/folders/1QwErTyUiOpAsDfGhJkLzXcVbNm123456?usp=sharing',
    ],
    [
      'Google Drive',
      'https://drive.google.com/drive/u/0/folders/1QwErTyUiOpAsDfGhJkLzXcVbNm123456',
    ],
    ['Google Drive', 'https://drive.google.com/open?id=0BqWeRtYuIoPaSdFgHjKlZxCv'],
    ['Google Drive', 'https://drive.google.com/uc?export=download&id=0BqWeRtYuIoPaSdFgHjKlZxCv'],
    [
      'Google Drive',
      'https://docs.google.com/document/d/1QwErTyUiOpAsDfGhJkLzXcVbNm123456/edit?usp=sharing',
    ],
    [
      'Google Drive',
      'https://docs.google.com/spreadsheets/d/1QwErTyUiOpAsDfGhJkLzXcVbNm123456/edit#gid=0',
    ],
    [
      'Google Drive',
      'https://docs.google.com/presentation/d/1QwErTyUiOpAsDfGhJkLzXcVbNm123456/edit',
    ],
    // OneDrive: the share dialog's links since 2024 and before, file and folder; the long ones.
    ['OneDrive', ONEDRIVE],
    [
      'OneDrive',
      'https://1drv.ms/f/c/1a2b3c4d5e6f7a8b/EgQwErTyUiOpAsDfGhJkLzXcBQwErTyUiOpAsDfGhJkLzX?e=AbC123',
    ],
    [
      'OneDrive',
      'https://1drv.ms/u/c/1A2B3C4D5E6F7A8B/IQBQwErTyUiOpAsDfGhJkLzXcBQwErTyUiOpAsDfGhJkLz',
    ],
    ['OneDrive', 'https://1drv.ms/u/s!AqWeRtYuIoPaSdFgHjKlZxCv?e=AbC123'],
    [
      'OneDrive',
      'https://onedrive.live.com/?cid=1a2b3c4d5e6f7a8b&id=1A2B3C4D5E6F7A8B%21109&authkey=!AAQwErTyUiOp',
    ],
    [
      'OneDrive',
      'https://onedrive.live.com/redir?resid=1A2B3C4D5E6F7A8B%21768235&authkey=!AQwErTyUiOp',
    ],
    [
      'OneDrive',
      'https://onedrive.live.com/embed?cid=1A2B3C4D5E6F7A8B&resid=1A2B3C4D5E6F7A8B%21768235',
    ],
    // WeTransfer: the short link, the long one with and without recipient, a company's subdomain.
    ['WeTransfer', WETRANSFER],
    [
      'WeTransfer',
      'https://wetransfer.com/downloads/4f1b2c3d4e5f60718293a4b5c6d7e8f920260927120000/6a7b8c',
    ],
    [
      'WeTransfer',
      'https://wetransfer.com/downloads/4f1b2c3d4e5f60718293a4b5c6d7e8f920260927120000/9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b20260927120000/6a7b8c',
    ],
    [
      'WeTransfer',
      'https://acme.wetransfer.com/downloads/4f1b2c3d4e5f60718293a4b5c6d7e8f920260927120000/6a7b8c',
    ],
    // A browser reads scheme and host in small letters, and so does the card.
    ['Dropbox', 'HTTPS://WWW.Dropbox.COM/t/Qw3Er5Ty7Ui9Op1A'],
  ])('names %s for %s', (name, url) => {
    expect(fileLinkService(url)).toBe(name)
  })

  /**
   * ⛔ The card vouches for its destination, so only the service's own hosts count, and only its
   * share links: everything else stays an ordinary link, which shows its whole address.
   */
  it.each([
    ['plain http', 'http://www.dropbox.com/t/Qw3Er5Ty7Ui9Op1A'],
    ['a host that only begins with it', 'https://dropbox.com.example.org/s/k7m2x9q4t8wzp3n'],
    ['a host that only ends with it', 'https://evil-dropbox.com/s/k7m2x9q4t8wzp3n'],
    ['another top-level domain', 'https://dropbox.co/s/k7m2x9q4t8wzp3n'],
    ['a name before an @', 'https://www.dropbox.com@example.org/s/k7m2x9q4t8wzp3n'],
    ['a port', 'https://www.dropbox.com:8443/s/k7m2x9q4t8wzp3n'],
    ["Dropbox's front page", 'https://www.dropbox.com/'],
    ['a page of Dropbox that is no share', 'https://www.dropbox.com/home/Bericht.pdf'],
    ["a picture on Dropbox's picture host", 'https://photos-2.dropbox.com/t/2/AAQwErTyUiOp/12/png'],
    ["Drive's own list", 'https://drive.google.com/drive/my-drive'],
    ['a Google form', 'https://docs.google.com/forms/d/1QwErTyUiOpAsDfGhJkLzXcVbNm123456/viewform'],
    ['`open` without an id', 'https://drive.google.com/open?usp=sharing'],
    [
      'a detour through Google',
      'https://www.google.com/url?q=https://drive.google.com/file/d/0BqWeRtYuIoPaSdFgHjKlZxCv',
    ],
    ["OneDrive's front page", 'https://onedrive.live.com/'],
    ['a page of OneDrive without an item', 'https://onedrive.live.com/about/de-de/'],
    ['1drv.ms without a code', 'https://1drv.ms/'],
    // OneDrive for work lives on each company's own subdomain of SharePoint: not among the four.
    ['SharePoint', 'https://contoso-my.sharepoint.com/:w:/g/personal/anna_contoso_com/EQwErTyUiOp'],
    ["WeTransfer's front page", 'https://wetransfer.com/'],
    ['we.tl without a code', 'https://we.tl/'],
    [
      'a host that only begins with WeTransfer',
      'https://wetransfer.com.example.org/downloads/4f1b2c/6a7b8c',
    ],
    // Nextcloud runs on any address, and only `/s/<token>` gives it away (Bernd: an ordinary link).
    ['a Nextcloud share', 'https://cloud.example.org/s/aBcDeFgHiJkLmNo'],
    [
      'a Nextcloud share without its short address',
      'https://cloud.example.org/index.php/s/aBcDeFgHiJkLmNo',
    ],
    ['another service', 'https://www.filemail.com/d/qwertyuiopasdfg'],
    ['no address at all', 'dropbox.com/s/k7m2x9q4t8wzp3n'],
  ])('names nothing for %s', (_, url) => {
    expect(fileLinkService(url)).toBeNull()
  })

  it('names nothing for what is not text', () => {
    expect(fileLinkService(undefined)).toBeNull()
    expect(fileLinkService(null)).toBeNull()
  })

  // The card replaces what the thread found as an address, so the link, key and all, reaches it
  // whole, and a full stop after it stays out.
  it.each([
    DROPBOX,
    DRIVE,
    ONEDRIVE,
    WETRANSFER,
    'https://1drv.ms/u/s!AqWeRtYuIoPaSdFgHjKlZxCv?e=AbC123',
  ])('is found whole in a message: %s', (url) => {
    const parts = chatTextParts(`Hier ist die Datei: ${url}. Danke!`)
    expect(parts.filter((part) => part.type === 'url')).toEqual([{ type: 'url', value: url }])
    expect(fileLinkService(parts[1].value)).not.toBeNull()
  })
})

describe('fileLinkLabel of the four', () => {
  // Host and path; the query and the `#` part carry the link's key and stay in the target only.
  it.each([
    [DROPBOX, 'dropbox.com/scl/fi/k7m2x9q4t8wzp3n6r1v5c/Bericht.pdf'],
    [DRIVE, 'drive.google.com/file/d/1QwErTyUiOpAsDfGhJkLzXcVbNm123456/view'],
    [
      'https://docs.google.com/spreadsheets/d/1QwErTyUiOpAsDfGhJkLzXcVbNm123456/edit#gid=0',
      'docs.google.com/spreadsheets/d/1QwErTyUiOpAsDfGhJkLzXcVbNm123456/edit',
    ],
    [ONEDRIVE, '1drv.ms/u/c/1a2b3c4d5e6f7a8b/EQwErTyUiOpAsDfGhJkLzXcBQwErTyUiOpAsDfGhJkLzXc'],
    ['https://onedrive.live.com/?cid=1a2b&id=1A2B%21109', 'onedrive.live.com/'],
    [WETRANSFER, 'we.tl/t-Qw3Er5Ty7U'],
  ])('shows %s as %s', (url, label) => {
    expect(fileLinkLabel(url)).toBe(label)
  })
})

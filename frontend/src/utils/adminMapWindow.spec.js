// AI-GENERATED — not an architecture reference

import { describe, it, expect } from 'vitest'
import { ADMIN_MAP_WINDOW_NAME, isMapWindowOfAdmin } from './adminMapWindow'

/**
 * The window the admin interface opens for a look at the map (the pin behind a member's name),
 * seen from the wallet that runs in it: is this that window, and is the admin interface still
 * there behind it? The wallet's menu entry "Admin" goes by the answer (DashboardLayout).
 */
describe('adminMapWindow', () => {
  const ADMIN = 'https://gradido.example/admin/authenticate?token='
  /** The admin interface on an origin of its own: at its root, and under a directory. */
  const ADMIN_ELSEWHERE = 'https://admin.example/authenticate?token='
  const ADMIN_ELSEWHERE_DEEPER = 'https://admin.example/admin/authenticate?token='

  /**
   * A window as the pin opens it: named, on the wallet. Spread, not defaulted: a name that is
   * handed in as undefined has to stay undefined.
   */
  const mapWindow = (changed = {}) => ({
    name: ADMIN_MAP_WINDOW_NAME,
    opener: undefined,
    location: {
      href: 'https://gradido.example/matching/karte',
      origin: 'https://gradido.example',
    },
    ...changed,
  })
  /** The window behind it: where it stands, and whether it is still open. */
  const behind = (
    pathname = '/admin/user',
    { origin = 'https://gradido.example', closed = false } = {},
  ) => ({
    closed,
    location: { origin, pathname },
  })
  /** One on another origin: open or closed can be asked, where it stands cannot. */
  const behindElsewhere = ({ closed = false } = {}) => ({
    closed,
    get location() {
      throw new DOMException(
        'Blocked a frame with origin from accessing a cross-origin frame.',
        'SecurityError',
      )
    },
  })

  // ⛔ The admin interface names the window by this word (admin/src/utils/mapWindow.ts). The two
  // apps share no code: a name changed on one side alone is a way back that leads nowhere.
  it('knows the window by the name the admin interface gives it', () => {
    expect(ADMIN_MAP_WINDOW_NAME).toBe('gradido-wallet-map')
  })

  describe('the window a pin opened, with the admin interface behind it', () => {
    it.each([
      ['the member search', '/admin/user'],
      ['the start of the admin interface', '/admin/'],
      ['the start, written without its slash', '/admin'],
      ['a page deeper in', '/admin/creation-confirm'],
    ])('is told where the window behind shows %s', (_name, pathname) => {
      expect(isMapWindowOfAdmin(mapWindow({ opener: behind(pathname) }), ADMIN)).toBe(true)
    })

    it('is told by an address of the admin interface that names no host', () => {
      expect(
        isMapWindowOfAdmin(
          mapWindow({ opener: behind('/admin/user') }),
          '/admin/authenticate?token=',
        ),
      ).toBe(true)
    })
  })

  describe('any other window', () => {
    it.each([
      ['a window without a name', ''],
      ['a window of another name', 'gradido-wallet'],
      ['a window whose name is not known', undefined],
    ])('is not taken for it: %s', (_name, name) => {
      expect(isMapWindowOfAdmin(mapWindow({ name, opener: behind() }), ADMIN)).toBe(false)
    })

    // A window keeps its name when it is opened again from the history, or by hand.
    it.each([
      ['nothing opened it', null],
      ['nothing is known of what opened it', undefined],
    ])('is not taken for it where %s', (_name, opener) => {
      expect(isMapWindowOfAdmin(mapWindow({ opener }), ADMIN)).toBe(false)
    })
  })

  describe('where the admin interface is not there behind it any more', () => {
    it('is not taken for it where the window behind was closed', () => {
      expect(
        isMapWindowOfAdmin(mapWindow({ opener: behind('/admin/user', { closed: true }) }), ADMIN),
      ).toBe(false)
    })

    // A sign-in that ran out leads the admin interface's window to the wallet's sign-in page.
    it.each([
      ["the wallet's sign-in page", '/login'],
      ['the overview', '/overview'],
      ['the start of the wallet', '/'],
      ['a page whose address only begins like the admin interface', '/administration'],
    ])('is not taken for it where the window behind shows %s', (_name, pathname) => {
      expect(isMapWindowOfAdmin(mapWindow({ opener: behind(pathname) }), ADMIN)).toBe(false)
    })
  })

  // ⛔ A window closed on a guess leaves the moderator without the admin interface: "Admin"
  // closed the window, and what is behind it is something else.
  describe('where it cannot be told what the window behind shows', () => {
    // It left for another site, or the admin interface lives on an origin of its own: what a
    // window of another origin shows cannot be read, the one as little as the other.
    it.each([
      ['on this origin', ADMIN],
      ['on this origin, its address without a host', '/admin/authenticate?token='],
      ['on another origin', ADMIN_ELSEWHERE],
      ['on another origin, under a directory', ADMIN_ELSEWHERE_DEEPER],
    ])(
      'is not taken for it where the window behind cannot be read, the admin interface %s',
      (_name, adminAuthUrl) => {
        expect(isMapWindowOfAdmin(mapWindow({ opener: behindElsewhere() }), adminAuthUrl)).toBe(
          false,
        )
      },
    )

    // The window behind can be read, so it stands on the wallet's origin: no admin interface
    // of another origin is there, whatever its path looks like.
    it('is not taken for it where the admin interface lives on another origin than the window behind', () => {
      expect(
        isMapWindowOfAdmin(mapWindow({ opener: behind('/admin/user') }), ADMIN_ELSEWHERE_DEEPER),
      ).toBe(false)
    })

    // Every path begins with '/': an address that names no directory tells no page of the
    // admin interface from one of the wallet.
    describe.each([
      ['a page at the root of this origin', 'https://gradido.example/authenticate?token='],
      ['the same, without a host', '/authenticate?token='],
      ['a path without its directory', '/admin?token='],
      ['this origin and nothing else', 'https://gradido.example'],
    ])('the address of the admin interface names no directory: %s', (_name, adminAuthUrl) => {
      it.each([
        ["the wallet's sign-in page", '/login'],
        ['the overview', '/overview'],
        ['the member search of an admin interface', '/admin/user'],
      ])('is not taken for it where the window behind shows %s', (_page, pathname) => {
        expect(isMapWindowOfAdmin(mapWindow({ opener: behind(pathname) }), adminAuthUrl)).toBe(
          false,
        )
      })
    })
  })

  describe('where the wallet does not know its admin interface', () => {
    // Without an address nothing says which pages are the admin interface -- not the page next
    // to this one either, which an address read as "here" would name.
    it.each([
      ['no address', undefined],
      ['an empty address', ''],
      ['something that is no address', 42],
      ['an address that cannot be read', 'http://'],
    ])('takes no window for it: %s', (_name, adminAuthUrl) => {
      expect(isMapWindowOfAdmin(mapWindow({ opener: behind() }), adminAuthUrl)).toBe(false)
      expect(
        isMapWindowOfAdmin(mapWindow({ opener: behind('/matching/position') }), adminAuthUrl),
      ).toBe(false)
    })
  })
})

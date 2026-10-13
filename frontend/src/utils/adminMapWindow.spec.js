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
  /** The admin interface on an origin of its own. */
  const ADMIN_ELSEWHERE = 'https://admin.example/authenticate?token='

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

  // ⛔ The admin interface names the window by this word (admin/src/utils/mapWindow.js). The two
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

    // What the window behind shows cannot be read there. It is the window that opened this
    // one under this name, and only the admin interface does that.
    it('is told where the admin interface lives on another origin and the window behind cannot be read', () => {
      expect(isMapWindowOfAdmin(mapWindow({ opener: behindElsewhere() }), ADMIN_ELSEWHERE)).toBe(
        true,
      )
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
      // Nor where the admin interface lives on another origin, and its window could not be
      // read if there was one.
      expect(isMapWindowOfAdmin(mapWindow({ opener }), ADMIN_ELSEWHERE)).toBe(false)
    })
  })

  describe('where the admin interface is not there behind it any more', () => {
    it('is not taken for it where the window behind was closed', () => {
      expect(
        isMapWindowOfAdmin(mapWindow({ opener: behind('/admin/user', { closed: true }) }), ADMIN),
      ).toBe(false)
      expect(
        isMapWindowOfAdmin(
          mapWindow({ opener: behindElsewhere({ closed: true }) }),
          ADMIN_ELSEWHERE,
        ),
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

    // Where the admin interface lives on the wallet's origin, it can be read. A window behind
    // that cannot has gone to another site.
    it.each([
      ['an address with its host', ADMIN],
      ['an address that names no host', '/admin/authenticate?token='],
    ])(
      'is not taken for it where the window behind cannot be read and the admin interface lives on this origin: %s',
      (_name, adminAuthUrl) => {
        expect(isMapWindowOfAdmin(mapWindow({ opener: behindElsewhere() }), adminAuthUrl)).toBe(
          false,
        )
      },
    )

    it('is not taken for it where the window behind shows another origin than the admin interface', () => {
      const opener = behind('/admin/user', { origin: 'https://gradido.example' })
      expect(isMapWindowOfAdmin(mapWindow({ opener }), ADMIN_ELSEWHERE)).toBe(false)
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

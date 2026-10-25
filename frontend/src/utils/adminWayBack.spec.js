// AI-GENERATED — not an architecture reference
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  adminAddress,
  adminPath,
  forgetWayBack,
  goBackToAdmin,
  rememberWayBack,
  wayBackFor,
} from './adminWayBack'

describe('the way back to the admin interface', () => {
  afterEach(() => forgetWayBack())

  describe('a page of the admin interface', () => {
    it('is a path of its router, with its own query', () => {
      expect(adminPath('/creation-confirm')).toBe('/creation-confirm')
      expect(adminPath('/user?query=bibi')).toBe('/user?query=bibi')
    })

    // To a browser `//host` and `/\host` are another site, as an address of its own is.
    it.each([
      ['another site', '//evil.example/admin'],
      ['another site, the other way round', '/\\evil.example'],
      ['an address of its own', 'https://evil.example/'],
      ['no path', 'creation-confirm'],
      ['nothing', ''],
      ['no text', null],
      ['more than one', ['/user', '/creation-confirm']],
    ])('is never %s', (_, value) => {
      expect(adminPath(value)).toBeNull()
    })
  })

  describe('what is kept', () => {
    it('keeps the page for the member it came with', () => {
      expect(rememberWayBack('/creation-confirm', 'g-anna')).toBe(true)
      expect(wayBackFor('g-anna')).toBe('/creation-confirm')
    })

    // A member signed in later in the same tab is offered no way into an admin interface that
    // was never theirs.
    it('offers it to nobody else', () => {
      rememberWayBack('/creation-confirm', 'g-anna')
      expect(wayBackFor('g-ben')).toBeNull()
      expect(wayBackFor(null)).toBeNull()
    })

    it('keeps nothing without a page of the admin interface or without a member', () => {
      expect(rememberWayBack(undefined, 'g-anna')).toBe(false)
      expect(rememberWayBack('//evil.example', 'g-anna')).toBe(false)
      expect(rememberWayBack('/user', null)).toBe(false)
      expect(wayBackFor('g-anna')).toBeNull()
    })

    it('forgets it', () => {
      rememberWayBack('/user', 'g-anna')
      forgetWayBack()
      expect(wayBackFor('g-anna')).toBeNull()
    })
  })

  describe('the address of the admin interface', () => {
    const here = `${window.location.origin}/admin/authenticate?token=`

    // On one origin the address names no token: both apps keep the one (utils/authToken).
    it('names the page after the sign-in, on one origin', () => {
      expect(adminAddress(here, 'tok', '/user?query=bibi')).toBe(
        `${here}&redirect=%2Fuser%3Fquery%3Dbibi`,
      )
    })

    // On another origin (development) the token ends the address: the page goes behind it.
    it('names it behind the token, on another origin', () => {
      expect(
        adminAddress('http://admin.elsewhere.example/authenticate?token=', 'a b', '/user'),
      ).toBe('http://admin.elsewhere.example/authenticate?token=a%20b&redirect=%2Fuser')
    })

    it('is the sign-in alone without a page', () => {
      expect(adminAddress(here, 'tok', null)).toBe(here)
    })
  })

  describe('going back', () => {
    const adminAuthUrl = 'https://wallet.example/admin/authenticate?token='
    const windowOf = ({ name = '', opener = null } = {}) => ({
      name,
      opener,
      close: vi.fn(),
      location: {
        href: 'https://wallet.example/matching/karte',
        origin: 'https://wallet.example',
        assign: vi.fn(),
      },
      sessionStorage: window.sessionStorage,
    })

    it('closes the window the admin interface opened beside itself, with it still behind', () => {
      const win = windowOf({
        name: 'gradido-wallet-map',
        opener: {
          closed: false,
          location: { origin: 'https://wallet.example', pathname: '/admin/creation-confirm' },
        },
      })
      const signOut = vi.fn()

      expect(
        goBackToAdmin({ adminAuthUrl, token: 'tok', back: '/creation-confirm', signOut, win }),
      ).toBe('closed')
      expect(win.close).toHaveBeenCalledTimes(1)
      expect(win.location.assign).not.toHaveBeenCalled()
      expect(signOut).not.toHaveBeenCalled()
    })

    // In the app on a phone: the only window, nothing behind it to close back to.
    it('goes to the page the moderator came from anywhere else, and signs nobody out', () => {
      const win = windowOf()
      const signOut = vi.fn()
      rememberWayBack('/creation-confirm', 'g-anna', win)

      expect(
        goBackToAdmin({ adminAuthUrl, token: 'tok', back: '/creation-confirm', signOut, win }),
      ).toBe('went')
      expect(win.close).not.toHaveBeenCalled()
      expect(win.location.assign).toHaveBeenCalledWith(
        `${adminAuthUrl}&redirect=%2Fcreation-confirm`,
      )
      expect(signOut).not.toHaveBeenCalled()
      // Used once: the next visit from the admin interface names its own page.
      expect(wayBackFor('g-anna', win)).toBeNull()
    })

    it('signs out where the admin interface is on another origin, as the menu entry always did', () => {
      const win = windowOf()
      const signOut = vi.fn()

      goBackToAdmin({
        adminAuthUrl: 'http://admin.elsewhere.example/authenticate?token=',
        token: 'tok',
        back: '/user',
        signOut,
        win,
      })
      expect(win.location.assign).toHaveBeenCalledWith(
        'http://admin.elsewhere.example/authenticate?token=tok&redirect=%2Fuser',
      )
      expect(signOut).toHaveBeenCalledTimes(1)
    })
  })
})

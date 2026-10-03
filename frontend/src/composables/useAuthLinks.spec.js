// AI-GENERATED — not an architecture reference

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthLinks } from './useAuthLinks'

const route = vi.hoisted(() => ({ current: null }))
// The shapes the real table has (routes/routes.js): the links take from them which params
// their target declares.
const routes = vi.hoisted(() => [
  { name: 'Login', path: '/login/:code?' },
  { name: 'Register', path: '/register/:code?' },
  { name: 'ForgotPassword', path: '/forgot-password' },
  { name: 'ResetPassword', path: '/reset-password/:optin' },
  { name: 'CheckEmail', path: '/checkEmail/:optin/:code?' },
  { name: 'Redeem', path: '/redeem/:code' },
  { name: 'PublicProfile', path: '/u/:alias' },
])
vi.mock('vue-router', () => ({
  useRoute: () => route.current,
  useRouter: () => ({ getRoutes: () => routes }),
}))

const CODE = '1790000600.seal-AAAA_BBBB'

const linksOn = (current) => {
  route.current = current
  return useAuthLinks().routeWithParamsAndQuery
}

/**
 * The auth links carry the current query along -- that is how a guarantor code (E-017) reaches the
 * registration from the address page it was scanned to. The code is sealed for the name in that
 * address, and the registration checks it against `referrer`: a link that carries the code on
 * from there has to name the referrer itself (the page's own button, and `AuthNavbar`).
 */
describe('useAuthLinks', () => {
  beforeEach(() => {
    route.current = null
  })

  describe('on an address page with a guarantor code', () => {
    const addressPage = {
      name: 'PublicProfile',
      params: { alias: 'bernd' },
      query: { guarantor: CODE },
    }

    it('carries the code on, and adds nothing of its own', () => {
      const withParamsAndQuery = linksOn(addressPage)

      for (const name of ['Register', 'Login']) {
        expect(withParamsAndQuery(name).query).toEqual({ guarantor: CODE })
      }
    })

    it('lets a link name the referrer itself', () => {
      const withParamsAndQuery = linksOn(addressPage)

      expect(withParamsAndQuery('Register', { query: { referrer: 'bernd' } }).query).toEqual({
        referrer: 'bernd',
        guarantor: CODE,
      })
    })
  })

  // The detour over the sign-in: there the name already stands in the query, and goes on.
  it('carries on a name and a code that came in the query', () => {
    const withParamsAndQuery = linksOn({
      name: 'Login',
      params: {},
      query: { guarantor: CODE, referrer: 'bernd' },
    })

    expect(withParamsAndQuery('Register').query).toEqual({ guarantor: CODE, referrer: 'bernd' })
  })

  /**
   * ⛔ The redeem code of a registration over a transaction or contribution link. The
   * confirmation mail opens `/checkEmail/<optin>/<code>`, and from there the code is handed
   * from page to page as the route param `code` until it is redeemed: over the sign-in to the
   * redeem page. A link that stops carrying it leaves the new member on the overview with
   * nothing redeemed.
   */
  describe('the redeem code in the route params', () => {
    it('carries it from the confirmation mail page to the sign-in', () => {
      const withParamsAndQuery = linksOn({
        name: 'CheckEmail',
        params: { optin: '123456', code: 'abcdef0123' },
        query: {},
      })

      expect(withParamsAndQuery('Login')).toEqual({
        name: 'Login',
        params: { code: 'abcdef0123' },
        query: {},
      })
    })

    it('carries it from the sign-in to the redeem page, and to the registration', () => {
      const withParamsAndQuery = linksOn({
        name: 'Login',
        params: { code: 'abcdef0123' },
        query: {},
      })

      expect(withParamsAndQuery('Redeem').params).toEqual({ code: 'abcdef0123' })
      expect(withParamsAndQuery('Register').params).toEqual({ code: 'abcdef0123' })
    })
  })

  // vue-router discards a param the target does not declare, and warns about every one of
  // them: `optin` on the way from the confirmation mail page to the sign-in, `alias` on the
  // way from an address page. So they are left behind here.
  describe('params the target route does not declare', () => {
    it('leaves the opt-in code behind on the way to the sign-in', () => {
      const withParamsAndQuery = linksOn({
        name: 'ResetPassword',
        params: { optin: '123456' },
        query: {},
      })

      expect(withParamsAndQuery('Login').params).toEqual({})
    })

    it('leaves the alias behind on the way from an address page', () => {
      const withParamsAndQuery = linksOn({
        name: 'PublicProfile',
        params: { alias: 'bernd' },
        query: {},
      })

      expect(withParamsAndQuery('Register').params).toEqual({})
      expect(withParamsAndQuery('Login').params).toEqual({})
    })

    it('hands none to a route without params', () => {
      const withParamsAndQuery = linksOn({
        name: 'Login',
        params: { code: 'abcdef0123' },
        query: {},
      })

      expect(withParamsAndQuery('ForgotPassword').params).toEqual({})
    })

    // Only the name of a param decides. An opt-in code that happens to read `code` is still
    // the value of `optin`, and must not arrive at the sign-in as a redeem code.
    it('goes by the name of a param, not by a value that reads like one', () => {
      const withParamsAndQuery = linksOn({
        name: 'ResetPassword',
        params: { optin: 'code' },
        query: {},
      })

      expect(withParamsAndQuery('Login').params).toEqual({})
    })

    it('keeps a value that reads like the name of another param', () => {
      const withParamsAndQuery = linksOn({
        name: 'CheckEmail',
        params: { optin: 'code', code: 'optin' },
        query: {},
      })

      expect(withParamsAndQuery('Login').params).toEqual({ code: 'optin' })
    })

    it('leaves out a param the link itself names, if the target has no such param', () => {
      const withParamsAndQuery = linksOn({ name: 'Login', params: {}, query: {} })

      expect(
        withParamsAndQuery('ForgotPassword', { params: { comingFrom: 'reset-password' } }).params,
      ).toEqual({})
    })
  })

  it('lets a link name a param of its own over the one in the address', () => {
    const withParamsAndQuery = linksOn({
      name: 'Login',
      params: { code: 'abcdef0123' },
      query: {},
    })

    expect(withParamsAndQuery('Redeem', { params: { code: 'CL-other' } }).params).toEqual({
      code: 'CL-other',
    })
  })
})

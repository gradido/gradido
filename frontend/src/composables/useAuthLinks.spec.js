// AI-GENERATED — not an architecture reference

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthLinks } from './useAuthLinks'

const route = vi.hoisted(() => ({ current: null }))
vi.mock('vue-router', () => ({ useRoute: () => route.current }))

const CODE = '1790000600.seal-AAAA_BBBB'

const linksOn = (current) => {
  route.current = current
  return useAuthLinks().routeWithParamsAndQuery
}

/**
 * The auth links carry the current query along -- that is how a table code (E-017) reaches the
 * registration from the address page it was scanned to. The code is sealed for the name in that
 * address, and the registration checks it against `referrer`: every link that carries the code
 * must carry the name too.
 */
describe('useAuthLinks', () => {
  beforeEach(() => {
    route.current = null
  })

  describe('on an address page with a table code', () => {
    const addressPage = {
      name: 'PublicProfile',
      params: { alias: 'bernd' },
      query: { presence: CODE },
    }

    // The navigation bar's "Sign up" and "Sign in" add nothing of their own.
    it('carries the name along with the code to the registration and the sign-in', () => {
      const withParamsAndQuery = linksOn(addressPage)

      for (const name of ['Register', 'Login']) {
        expect(withParamsAndQuery(name).query).toEqual({ referrer: 'bernd', presence: CODE })
      }
    })

    // The page's own button names the referrer itself; it stays the one it names.
    it('lets a link name the referrer itself', () => {
      const withParamsAndQuery = linksOn(addressPage)

      expect(withParamsAndQuery('Register', { query: { referrer: 'bernd' } }).query).toEqual({
        referrer: 'bernd',
        presence: CODE,
      })
    })
  })

  // The detour over the sign-in: there the name already stands in the query, and goes on.
  it('carries on a name and a code that came in the query', () => {
    const withParamsAndQuery = linksOn({
      name: 'Login',
      params: {},
      query: { presence: CODE, referrer: 'bernd' },
    })

    expect(withParamsAndQuery('Register').query).toEqual({ presence: CODE, referrer: 'bernd' })
  })

  // Without a table code the links are what they were: the address page's navigation bar
  // does not start naming a referrer on its own.
  it('adds no name where there is no table code', () => {
    const withParamsAndQuery = linksOn({
      name: 'PublicProfile',
      params: { alias: 'bernd' },
      query: {},
    })

    expect(withParamsAndQuery('Register').query).toEqual({})
    expect(withParamsAndQuery('Register').params).toEqual({ alias: 'bernd' })
  })
})

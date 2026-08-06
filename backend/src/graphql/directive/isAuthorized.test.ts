import { ResolverData } from 'type-graphql'

import { INALIENABLE_RIGHTS } from '@/auth/INALIENABLE_RIGHTS'
import { decode } from '@/auth/JWT'
import { MATCHING_RIGHTS } from '@/auth/MATCHING_RIGHTS'
import { RIGHTS } from '@/auth/RIGHTS'
import { GATED_MODULES } from '@/module/gate'
import { readModuleSettings } from '@/module/settings'
import { Context } from '@/server/context'

import { isAuthorized } from './isAuthorized'

// The gate refuses before any query runs, so nothing here needs a database; stubbing the
// package keeps the test honest about that. It does NOT make the suite runnable without
// the Rust binding: jest.config's setupFiles loads core -> database -> shared ->
// shared-native before any mock is registered, so `shared-native` must be built either
// way. If this suite dies on `shared_native.node`, that is the binding, not the mock.
jest.mock('database', () => ({
  RoleNames: {
    ADMIN: 'ADMIN',
    MODERATOR: 'MODERATOR',
    MODERATOR_AI: 'MODERATOR_AI',
    USER: 'USER',
    UNAUTHORIZED: 'UNAUTHORIZED',
    DLT_CONNECTOR: 'DLT_CONNECTOR',
  },
  User: { findOneOrFail: jest.fn() },
  Transaction: class {},
}))

jest.mock('@/module/settings', () => ({
  readModuleSettings: jest.fn(),
}))

jest.mock('@/auth/JWT', () => ({
  decode: jest.fn(),
  encode: jest.fn(),
}))

const readModuleSettingsMock = readModuleSettings as jest.MockedFunction<typeof readModuleSettings>
const decodeMock = decode as jest.MockedFunction<typeof decode>

// A context that carries a token, so a request that gets past the module gate reaches
// the token check next. That next step is what proves the gate let it through: it
// fails with a DIFFERENT error than the gate does. Both refusals say "401" otherwise,
// and a test that matched on the message alone could not tell them apart.
const contextWithToken = () => ({ token: 'a-token', setHeaders: [] }) as unknown as Context

const check = (context: Context, rights: RIGHTS[]) =>
  isAuthorized({ context } as ResolverData<Context>, rights)

describe('isAuthorized', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    decodeMock.mockResolvedValue(null)
  })

  describe('module gate', () => {
    it('refuses a right of a module that is switched off', async () => {
      readModuleSettingsMock.mockResolvedValue({ matchingActive: false })

      await expect(check(contextWithToken(), [RIGHTS.LIST_MATCHING_ENTRY])).rejects.toThrow(
        '401 Unauthorized',
      )
      // The switches WERE read here. The two "not called" assertions further down only
      // mean something next to this one - without it they would hold just as well if
      // the gate had never been written.
      expect(readModuleSettingsMock).toHaveBeenCalled()
      // Refused before the token is even looked at - so it is the gate refusing, and
      // it refuses everyone alike, administrators included.
      expect(decodeMock).not.toHaveBeenCalled()
    })

    it('lets a right of a module that is switched on through to the token check', async () => {
      readModuleSettingsMock.mockResolvedValue({ matchingActive: true })

      // Past the gate, the mocked token fails to decode - a different refusal, and the
      // proof that the gate did not stop this request.
      await expect(check(contextWithToken(), [RIGHTS.LIST_MATCHING_ENTRY])).rejects.toThrow(
        '403.13 - Client certificate revoked',
      )
      expect(decodeMock).toHaveBeenCalled()
    })

    // Reads the list rather than repeating it, so a right added to MATCHING_RIGHTS is
    // covered here without anyone remembering to extend the test.
    it('covers every matching right, not just the one the tests happen to name', async () => {
      readModuleSettingsMock.mockResolvedValue({ matchingActive: false })

      for (const right of MATCHING_RIGHTS) {
        await expect(check(contextWithToken(), [right])).rejects.toThrow('401 Unauthorized')
      }
      expect(decodeMock).not.toHaveBeenCalled()
    })

    // The inalienable short-circuit returns before the gate, so a gated right that ever
    // landed in that list would leave the gate silently. This states the invariant for
    // every module, not just today's.
    it('gates no right that is also inalienable', () => {
      const gated = GATED_MODULES.flatMap((module) => module.rights)

      expect(gated.filter((right) => INALIENABLE_RIGHTS.includes(right))).toEqual([])
    })
  })

  describe('costs nothing where no module is involved', () => {
    it('does not read the switches for an inalienable right', async () => {
      await expect(check({} as Context, [RIGHTS.LOGIN])).resolves.toBe(true)

      expect(readModuleSettingsMock).not.toHaveBeenCalled()
    })

    it('does not read the switches for an ordinary right', async () => {
      // No token: this refusal is the pre-existing one and none of the gate's business.
      await expect(check({} as Context, [RIGHTS.SEARCH_USERS])).rejects.toThrow('401 Unauthorized')

      expect(readModuleSettingsMock).not.toHaveBeenCalled()
    })
  })
})

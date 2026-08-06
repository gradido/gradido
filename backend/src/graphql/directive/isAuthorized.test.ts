// AI-GENERATED — not an architecture reference
import { RoleNames } from 'database'
import { ResolverData } from 'type-graphql'

import { INALIENABLE_RIGHTS } from '@/auth/INALIENABLE_RIGHTS'
import { decode } from '@/auth/JWT'
import { MATCHING_RIGHTS } from '@/auth/MATCHING_RIGHTS'
import { RIGHTS } from '@/auth/RIGHTS'
import { OPTIONAL_MODULES } from '@/data/Module.logic'
import { Context } from '@/server/context'

import { isAuthorized } from './isAuthorized'

// A stub rather than a database: this exercises the rights arithmetic, not storage.
// It does NOT make the suite runnable without the Rust binding - jest.config's
// setupFiles loads core -> database -> shared -> shared-native before any mock is
// registered. If this suite dies on `shared_native.node`, that is the binding.
const dbSelectModuleSettings = jest.fn()
const findOneOrFail = jest.fn()

// RoleNames has to match the real enum member for member, values included: ROLES.ts builds
// every role singleton from it, so a missing entry gives that role an undefined id - and
// the id is on the path this suite guards, because the narrowed role copies it.
jest.mock('database', () => ({
  RoleNames: {
    UNAUTHORIZED: 'UNAUTHORIZED',
    USER: 'USER',
    MODERATOR: 'MODERATOR',
    MODERATOR_AI: 'MODERATOR_AI',
    ADMIN: 'ADMIN',
    DLT_CONNECTOR: 'DLT_CONNECTOR_ROLE',
  },
  User: { findOneOrFail: (...args: unknown[]) => findOneOrFail(...args) },
  Transaction: class {},
  dbSelectModuleSettings: () => dbSelectModuleSettings(),
}))

jest.mock('@/auth/JWT', () => ({
  decode: jest.fn(),
  encode: jest.fn().mockResolvedValue('a-fresh-token'),
}))

const decodeMock = decode as jest.MockedFunction<typeof decode>

const contextForUser = (): Context => ({ token: 'a-token', setHeaders: [] }) as unknown as Context

const check = (context: Context, rights: RIGHTS[]) =>
  isAuthorized({ context } as ResolverData<Context>, rights)

/**
 * Switches the matching module on or off for the next call.
 *
 * Off is a stored row holding 0, not a missing row. That is the state an instance is in
 * once an admin has saved once - the ordinary one - and it is the only one that exercises
 * the conversion of the column value at all. The missing row has its own test below.
 */
const matchingIs = (active: boolean) =>
  dbSelectModuleSettings.mockResolvedValue({ id: 1, matchingActive: active ? 1 : 0 })

describe('isAuthorized', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    decodeMock.mockResolvedValue({ gradidoID: 'a-member' } as never)
    // A plain member, so nothing but the module switch can explain a refusal.
    findOneOrFail.mockResolvedValue({ id: 7, userRoles: [] })
  })

  describe('a module that is switched off', () => {
    it('refuses its rights', async () => {
      matchingIs(false)

      await expect(check(contextForUser(), [RIGHTS.LIST_MATCHING_ENTRY])).rejects.toThrow(
        '401 Unauthorized',
      )
    })

    // The assertion that matters most. @Authorized is not the only path that asks:
    // every field-level guard in this backend calls context.role.hasRight() directly,
    // so a check that only lived in this function would leave them all answering yes.
    it('takes them off the role, so hasRight answers no as well', async () => {
      matchingIs(false)
      const context = contextForUser()

      await expect(check(context, [RIGHTS.SEARCH_ADMIN_USERS])).resolves.toBe(true)

      for (const right of MATCHING_RIGHTS) {
        expect(context.role?.hasRight(right)).toBe(false)
      }
    })

    // The rest of the suite runs as a plain member, where this could not show: ROLE_ADMIN
    // inherits USER_RIGHTS, so it carries the matching rights too. Off has to mean off for
    // administrators as well, not off-for-most.
    it('refuses them to an administrator too', async () => {
      matchingIs(false)
      findOneOrFail.mockResolvedValue({ id: 7, userRoles: [{ role: RoleNames.ADMIN }] })

      await expect(check(contextForUser(), [RIGHTS.LIST_MATCHING_ENTRY])).rejects.toThrow(
        '401 Unauthorized',
      )

      const context = contextForUser()
      await expect(check(context, [RIGHTS.MODULE_SETTINGS])).resolves.toBe(true)
      expect(context.role?.id).toBe(RoleNames.ADMIN)
      for (const right of MATCHING_RIGHTS) {
        expect(context.role?.hasRight(right)).toBe(false)
      }
    })

    it('leaves every other right alone', async () => {
      matchingIs(false)
      const context = contextForUser()

      await expect(check(context, [RIGHTS.SEARCH_ADMIN_USERS])).resolves.toBe(true)
      expect(context.role?.hasRight(RIGHTS.SEARCH_ADMIN_USERS)).toBe(true)
      expect(context.role?.hasRight(RIGHTS.BALANCE)).toBe(true)
    })

    // The state of a fresh install: the migration writes no row on purpose, and the caller
    // has to read that as every module off rather than as an error or as every module on.
    it('reads a database with no row as off as well', async () => {
      dbSelectModuleSettings.mockResolvedValue(undefined)
      const context = contextForUser()

      await expect(check(context, [RIGHTS.SEARCH_ADMIN_USERS])).resolves.toBe(true)
      for (const right of MATCHING_RIGHTS) {
        expect(context.role?.hasRight(right)).toBe(false)
      }
    })

    // Otherwise a switched-off module could not report that it is off, and the wallet
    // would have no way to learn it.
    it('still lets a member read which modules are active', async () => {
      matchingIs(false)
      const context = contextForUser()

      await expect(check(context, [RIGHTS.LIST_ACTIVE_MODULES])).resolves.toBe(true)
      expect(context.role?.hasRight(RIGHTS.LIST_ACTIVE_MODULES)).toBe(true)
    })
  })

  describe('a module that is switched on', () => {
    it('grants its rights, and hasRight agrees', async () => {
      matchingIs(true)
      const context = contextForUser()

      await expect(check(context, [RIGHTS.LIST_MATCHING_ENTRY])).resolves.toBe(true)

      for (const right of MATCHING_RIGHTS) {
        expect(context.role?.hasRight(right)).toBe(true)
      }
    })
  })

  describe('the switches themselves', () => {
    // In parallel on purpose. The root fields of one operation are dispatched together, so
    // checks awaited one after another would always meet a memo that is already filled and
    // could not tell a per-request read from a per-check one.
    it('are read once per request, not once per check', async () => {
      matchingIs(false)
      const context = contextForUser()

      await Promise.all([
        check(context, [RIGHTS.SEARCH_ADMIN_USERS]),
        check(context, [RIGHTS.BALANCE]),
        check(context, [RIGHTS.SEARCH_ADMIN_USERS]),
      ])

      expect(dbSelectModuleSettings).toHaveBeenCalledTimes(1)
    })

    // Unreadable switches mean it is unknown what a role may do, so the request is refused
    // rather than let through. The message has to be ours: no formatError is configured,
    // so a driver message escaping here would reach the client with its SQL attached.
    it('refuse the request when they cannot be read', async () => {
      dbSelectModuleSettings.mockRejectedValue(
        new Error('select `matching_active` from `module_settings` where `id` = 1'),
      )

      await expect(check(contextForUser(), [RIGHTS.SEARCH_ADMIN_USERS])).rejects.toThrow(
        '401 Unauthorized',
      )
    })

    it('are not read at all for an inalienable right', async () => {
      matchingIs(false)

      await expect(check({} as Context, [RIGHTS.LOGIN])).resolves.toBe(true)

      expect(dbSelectModuleSettings).not.toHaveBeenCalled()
    })

    // The inalienable short-circuit returns before any of this, so a right that ever
    // landed in both lists would leave the mechanism silently. States the invariant for
    // every module, not just today's.
    it('never govern a right that is also inalienable', () => {
      const governed = OPTIONAL_MODULES.flatMap((optionalModule) => optionalModule.rights)

      expect(governed.filter((right) => INALIENABLE_RIGHTS.includes(right))).toEqual([])
    })
  })
})

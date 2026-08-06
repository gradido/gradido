// AI-GENERATED — not an architecture reference
import { RoleNames } from 'database'
import { ResolverData } from 'type-graphql'

import { INALIENABLE_RIGHTS } from '@/auth/INALIENABLE_RIGHTS'
import { decode } from '@/auth/JWT'
import { MATCHING_RIGHTS } from '@/auth/MATCHING_RIGHTS'
import { RIGHTS } from '@/auth/RIGHTS'
import { OPTIONAL_MODULES } from '@/data/Module.logic'
import { Context } from '@/server/context'
import { resetModuleActivation, setModuleActivation } from '@/server/moduleActivation'

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
 * Set on the process, not stubbed in the database: the gate reads what this backend
 * already knows, never the table. Whether the table is read correctly is the subject of
 * server/moduleActivation.test.ts.
 */
const matchingIs = (active: boolean) => setModuleActivation({ matchingActive: active })

describe('isAuthorized', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetModuleActivation()
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

    // What a process holds before anything has been read: the safe state, not an error and
    // not every module on.
    it('are off before anything has been read at all', async () => {
      resetModuleActivation()
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
    // The assertion this whole arrangement exists for. The gate runs on every authorized
    // root field, and it reads through a second connection pool beside TypeORM's; a query
    // here once made three timer-faking tests hang and, with --runInBand, took the next
    // file down with them. So the request path must touch the database not rarely, but
    // never.
    it('are never read from the database on the request path', async () => {
      matchingIs(false)
      const context = contextForUser()

      await Promise.all([
        check(context, [RIGHTS.SEARCH_ADMIN_USERS]),
        check(context, [RIGHTS.BALANCE]),
        check(context, [RIGHTS.SEARCH_ADMIN_USERS]),
      ])

      expect(dbSelectModuleSettings).not.toHaveBeenCalled()
    })

    it('do not touch the role at all for an inalienable right', async () => {
      matchingIs(false)
      const context = contextForUser()

      await expect(check(context, [RIGHTS.LOGIN])).resolves.toBe(true)

      // The short-circuit returns before the withdrawal, leaving the unauthorized role.
      expect(context.role?.id).toBe(RoleNames.UNAUTHORIZED)
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

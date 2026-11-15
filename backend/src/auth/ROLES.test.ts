// AI-GENERATED — not an architecture reference
// Unit test of the one mapping from a role row to its rights (roleOfHolder): the name of the role,
// and for the two moderator kinds the tick "may handle support requests" (Support-Anfragen K6).
// Runs under jest and bun alike (AGENTS.md): the role names are the only module stood in for, so
// that neither the database package nor type-graphql has to load; the module under test comes in
// beforeAll.
import type { Role } from './Role'

// only the values ROLES.ts reads
const mockRoleNames = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  USER: 'USER',
  MODERATOR: 'MODERATOR',
  MODERATOR_AI: 'MODERATOR_AI',
  ADMIN: 'ADMIN',
  DLT_CONNECTOR: 'DLT_CONNECTOR_ROLE',
}
jest.mock('@/graphql/enum/RoleNames', () => ({ RoleNames: mockRoleNames }))

let ROLES: typeof import('./ROLES')
let RIGHTS: typeof import('./RIGHTS')['RIGHTS']

beforeAll(async () => {
  ROLES = await import('./ROLES')
  ;({ RIGHTS } = await import('./RIGHTS'))
})

const handles = (role: Role) => role.hasRight(RIGHTS.MANAGE_SUPPORT_TICKETS)

describe('roleOfHolder', () => {
  it.each([
    ['MODERATOR', true, true],
    ['MODERATOR', false, false],
    ['MODERATOR_AI', true, true],
    ['MODERATOR_AI', false, false],
  ])('gives a %s with the tick %s the support right: %s', (role, supportDuty, expected) => {
    expect(handles(ROLES.roleOfHolder({ role, supportDuty }))).toBe(expected)
  })

  it('gives an administrator the support right, with the tick and without', () => {
    expect(handles(ROLES.roleOfHolder({ role: 'ADMIN', supportDuty: false }))).toBe(true)
    expect(handles(ROLES.roleOfHolder({ role: 'ADMIN', supportDuty: true }))).toBe(true)
  })

  // the column is a tick, not a role: rows with USER existed, and a name nobody knows is a member
  it.each([
    ['USER', 'USER'],
    ['a name nobody knows', 'SUPPORT'],
  ])('gives %s nothing for a tick', (_name, role) => {
    const holder = ROLES.roleOfHolder({ role, supportDuty: true })
    expect(handles(holder)).toBe(false)
    expect(holder).toBe(ROLES.ROLE_USER)
  })

  it('reads no row as a usual member', () => {
    expect(ROLES.roleOfHolder(null)).toBe(ROLES.ROLE_USER)
    expect(ROLES.roleOfHolder(undefined)).toBe(ROLES.ROLE_USER)
  })

  // The tick adds the one right and takes nothing: everything a moderator holds stays the same.
  it.each([
    ['MODERATOR', 'ROLE_MODERATOR'],
    ['MODERATOR_AI', 'ROLE_MODERATOR_AI'],
  ] as const)(
    'gives a %s with the tick the rights without it, and the support right more',
    (role, without) => {
      const ticked = ROLES.roleOfHolder({ role, supportDuty: true })
      expect(ROLES.roleOfHolder({ role, supportDuty: false })).toBe(ROLES[without])
      expect(ticked.rights).toEqual([...ROLES[without].rights, RIGHTS.MANAGE_SUPPORT_TICKETS])
      expect(ticked.id).toBe(role)
    },
  )
})

describe('roleByName', () => {
  // the first-creation signer acts by the name alone: no tick, so no support right for a moderator
  it('maps a name as roleOfHolder maps a row without the tick', () => {
    expect(ROLES.roleByName('ADMIN')).toBe(ROLES.ROLE_ADMIN)
    expect(ROLES.roleByName('MODERATOR')).toBe(ROLES.ROLE_MODERATOR)
    expect(ROLES.roleByName('MODERATOR_AI')).toBe(ROLES.ROLE_MODERATOR_AI)
    expect(ROLES.roleByName(null)).toBe(ROLES.ROLE_USER)
    expect(handles(ROLES.roleByName('MODERATOR'))).toBe(false)
  })
})

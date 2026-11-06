// AI-GENERATED — not an architecture reference
import { OptInType, PasswordEncryptionType } from 'shared'
import { AppDatabase, drizzleDb } from '../../AppDatabase'
import { ALIAS_ORIGIN_ADOPTED, Community } from '../../entity'
import { AccountState, RoleNames } from '../../enum'
import { dbDeleteAllRowsExceptMigrations } from '../../queries/informationSchemaTables'
import { userAliasesTable, userContactsTable, userRolesTable, usersTable } from '../../schemas'
import { createCommunity } from '../community'
import { UserInterface } from '../users/UserInterface'
import { buildSeedUserRows, userFactory, userFactoryDrizzle } from './user'

const COMMUNITY_UUID = '0bd3a4a9-31a4-4b0a-8f3c-0c1d7a4b6f00'
const build = (users: UserInterface[]) => buildSeedUserRows(users, 1, COMMUNITY_UUID, new Set())

describe('buildSeedUserRows', () => {
  it('counts the ids from 1 and gives each address the id of its member', () => {
    const rows = build([
      { alias: 'seeda', email: 'a@seed.de' },
      { alias: 'seedb', email: 'b@seed.de' },
    ])

    expect(rows.users.map((u) => [u.id, u.emailId])).toEqual([
      [1, 1],
      [2, 2],
    ])
    expect(rows.userContacts.map((c) => [c.id, c.userId, c.email])).toEqual([
      [1, 1, 'a@seed.de'],
      [2, 2, 'b@seed.de'],
    ])
    expect(rows.users.every((u) => u.communityUuid === COMMUNITY_UUID)).toBe(true)
  })

  it('counts the ids of a later batch on from where it starts', () => {
    const rows = buildSeedUserRows(
      [{ alias: 'seeda', email: 'a@seed.de' }],
      501,
      COMMUNITY_UUID,
      new Set(),
    )

    expect(rows.users[0].id).toBe(501)
    expect(rows.users[0].emailId).toBe(501)
    expect(rows.userContacts[0].userId).toBe(501)
  })

  it('hands back a reference only for the referenced addresses', () => {
    const rows = buildSeedUserRows(
      [
        { alias: 'seeda', email: 'a@seed.de', firstName: 'Anna', lastName: 'A' },
        { alias: 'seedb', email: 'b@seed.de' },
      ],
      1,
      COMMUNITY_UUID,
      new Set(['a@seed.de']),
    )

    expect([...rows.refsByEmail.keys()]).toEqual(['a@seed.de'])
    expect(rows.refsByEmail.get('a@seed.de')).toEqual({
      id: 1,
      gradidoId: rows.users[0].gradidoId,
      communityUuid: COMMUNITY_UUID,
      name: 'Anna A',
    })
  })

  it('activates a member with a checked address and salts their password with the gradido id', () => {
    const rows = build([{ alias: 'seeda', email: 'a@seed.de', emailChecked: true }])

    expect(rows.users[0].accountState).toBe(AccountState.ACTIVATED)
    expect(rows.users[0].passwordEncryptionType).toBe(PasswordEncryptionType.GRADIDO_ID)
    expect(rows.userContacts[0].emailChecked).toBe(true)
    expect(rows.userContacts[0].emailOptInTypeId).toBe(OptInType.EMAIL_OPT_IN_REGISTER)
    expect(typeof rows.userContacts[0].emailVerificationCode).toBe('bigint')
  })

  it('leaves a member without a checked address registered and without password type', () => {
    const rows = build([{ alias: 'seeda', email: 'a@seed.de' }])

    expect(rows.users[0].accountState).toBe(AccountState.REGISTERED)
    expect(rows.users[0].passwordEncryptionType).toBeUndefined()
    expect(rows.userContacts[0].emailChecked).toBeUndefined()
  })

  it('marks a deleted member as deleted', () => {
    const deletedAt = new Date(2026, 0, 1)
    const rows = build([{ alias: 'seeda', email: 'a@seed.de', emailChecked: true, deletedAt }])

    expect(rows.users[0].accountState).toBe(AccountState.DELETED)
    expect(rows.users[0].deletedAt).toBe(deletedAt)
  })

  it('writes a role only for admins and moderators', () => {
    const rows = build([
      { alias: 'seeda', email: 'a@seed.de', role: RoleNames.ADMIN },
      { alias: 'seedb', email: 'b@seed.de', role: RoleNames.MODERATOR },
      { alias: 'seedc', email: 'c@seed.de', role: RoleNames.MODERATOR_AI },
      { alias: 'seedd', email: 'd@seed.de' },
    ])

    expect(rows.userRoles).toEqual([
      { userId: 1, role: RoleNames.ADMIN },
      { userId: 2, role: RoleNames.MODERATOR },
    ])
  })

  it('takes the gradido id a user brings, and draws one otherwise', () => {
    const gradidoId = '0bd3a4a9-31a4-4b0a-8f3c-0c1d7a4b6f01'
    const rows = build([
      { alias: 'seeda', email: 'a@seed.de', gradidoId },
      { alias: 'seedb', email: 'b@seed.de' },
    ])

    expect(rows.users[0].gradidoId).toBe(gradidoId)
    expect(rows.users[1].gradidoId).toHaveLength(36)
  })

  it('records an alias as adopted', () => {
    const rows = build([{ alias: 'Seedy', email: 'a@seed.de' }])

    expect(rows.users[0].alias).toBe('Seedy')
    expect(rows.userAliases).toEqual([{ userId: 1, alias: 'Seedy', origin: ALIAS_ORIGIN_ADOPTED }])
  })
})

describe('userFactory', () => {
  const db = AppDatabase.getInstance()
  const anna: UserInterface = {
    alias: 'SeedAnna',
    email: 'anna@seed.de',
    firstName: 'Anna',
    lastName: 'A',
    emailChecked: true,
  }
  let homeCommunity: Community

  beforeAll(async () => {
    await db.init()
    await dbDeleteAllRowsExceptMigrations()
    homeCommunity = await createCommunity(false)
  })

  afterAll(async () => {
    await dbDeleteAllRowsExceptMigrations()
    await db.destroy()
  })

  beforeEach(async () => {
    await drizzleDb().delete(usersTable)
    await drizzleDb().delete(userContactsTable)
    await drizzleDb().delete(userAliasesTable)
    await drizzleDb().delete(userRolesTable)
  })

  it('writes member, address and name, the two rows pointing at each other', async () => {
    const user = await userFactory(anna)

    const [contact] = await drizzleDb().select().from(userContactsTable)
    expect(contact.userId).toBe(user.id)
    expect(contact.email).toBe('anna@seed.de')
    const [row] = await drizzleDb().select().from(usersTable)
    expect(row.emailId).toBe(contact.id)
    expect(await drizzleDb().select().from(userAliasesTable)).toEqual([
      expect.objectContaining({ userId: user.id, alias: 'SeedAnna', origin: ALIAS_ORIGIN_ADOPTED }),
    ])
  })

  it('hands back the entity with the address and the community', async () => {
    const user = await userFactory(anna)

    expect(user.emailContact.email).toBe('anna@seed.de')
    expect(user.community?.communityUuid).toBe(homeCommunity.communityUuid)
    expect(user.communityUuid).toBe(homeCommunity.communityUuid)
    expect(user.accountState).toBe(AccountState.ACTIVATED)
    expect(user.userRole).toBeUndefined()
    await user.save()
  })

  it('hands back the role of an admin, and of nobody else', async () => {
    const admin = await userFactory({ ...anna, role: RoleNames.ADMIN })

    expect(admin.userRole?.role).toBe(RoleNames.ADMIN)
    expect(await drizzleDb().select().from(userRolesTable)).toHaveLength(1)
  })

  it('takes the community it is given', async () => {
    const other = { communityUuid: homeCommunity.communityUuid }
    expect((await userFactory(anna, other)).communityUuid).toBe(homeCommunity.communityUuid)
  })

  it('finds a deleted member too', async () => {
    const deletedAt = new Date(2026, 0, 1)
    const user = await userFactory({ ...anna, deletedAt })

    expect(user.accountState).toBe(AccountState.DELETED)
    expect(user.deletedAt).toEqual(deletedAt)
  })

  it('userFactoryDrizzle hands back the row with its address, a deleted member too', async () => {
    const deletedAt = new Date(2026, 0, 1)

    const user = await userFactoryDrizzle({ ...anna, deletedAt })

    expect(user.gradidoId).toHaveLength(36)
    expect(user.alias).toBe('SeedAnna')
    expect(user.deletedAt).toEqual(deletedAt)
    expect(user.emailId).toBe(user.emailContact.id)
    expect(user.emailContact.email).toBe('anna@seed.de')
  })

  it('leaves nothing behind when the address is taken', async () => {
    await userFactory(anna)

    await expect(userFactory({ ...anna, alias: 'SeedOther' })).rejects.toThrow()

    expect(await drizzleDb().select().from(usersTable)).toHaveLength(1)
    expect(await drizzleDb().select().from(userAliasesTable)).toHaveLength(1)
  })
})

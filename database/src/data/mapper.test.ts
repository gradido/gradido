// AI-GENERATED — not an architecture reference
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { AppDatabase } from '../AppDatabase'
import { User } from '../entity'
import { dbDeleteAllRowsExceptMigrations } from '../queries/informationSchemaTables'
import { dbFindUserLoginByEmail } from '../queries/user'
import { dbUpsertUserAvatar } from '../queries/userAvatars'
import { createCommunity } from '../seeds/community'
import { userFactory } from '../seeds/factory/user'
import { bibiBloxberg } from '../seeds/users/bibi-bloxberg'
import { bobBaumeister } from '../seeds/users/bob-baumeister'
import { typeOrmUserToDbLoginUser } from './mapper'

// The entity and the row are two spellings of the same member. The mapper is right when it
// hands out what the Drizzle query hands out for the same person.
describe('typeOrmUserToDbLoginUser', () => {
  const db = AppDatabase.getInstance()
  const smallPicture = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x07, 0x08])
  // loaded as the API loads the member of a request (isAuthorized)
  const loaded = (id: number) =>
    User.findOneOrFail({ where: { id }, relations: ['emailContact', 'userRole'] })
  const expected = async (email: string) => {
    const result = await dbFindUserLoginByEmail(email)
    if (!result.success) {
      throw result.error
    }
    return result.value
  }
  let bibi: User
  let bob: User

  beforeAll(async () => {
    await db.init()
    await dbDeleteAllRowsExceptMigrations()
    await createCommunity(false)
    bibi = await userFactory({ ...bibiBloxberg, role: 'ADMIN' })
    bob = await userFactory(bobBaumeister)
    await dbUpsertUserAvatar({
      userId: bibi.id,
      avatarSmall: smallPicture,
      avatarFull: smallPicture,
      mimeType: 'image/jpeg',
    })
  })
  afterAll(async () => {
    await db.destroy()
  })

  it('maps a member with role and picture to what the query answers', async () => {
    expect(typeOrmUserToDbLoginUser(await loaded(bibi.id), smallPicture)).toEqual(
      await expected('bibi@bloxberg.de'),
    )
  })

  it('maps a member with neither role nor picture', async () => {
    expect(typeOrmUserToDbLoginUser(await loaded(bob.id))).toEqual(
      await expected('bob@baumeister.de'),
    )
  })
})

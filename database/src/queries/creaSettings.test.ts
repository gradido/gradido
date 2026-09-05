// AI-GENERATED — not an architecture reference
import { AppDatabase } from '../AppDatabase'
import { CreaSetting } from '../entity/CreaSetting'
import { dbGetFirstCreationSignerUserId, dbSetFirstCreationSignerUserId } from './creaSettings'

const appDB = AppDatabase.getInstance()

beforeAll(async () => {
  await appDB.init()
  await CreaSetting.clear()
})
afterAll(async () => {
  await CreaSetting.clear()
  await appDB.destroy()
})

describe('creaSettings query test', () => {
  it('answers null when no Crea setting was ever saved', async () => {
    expect(await dbGetFirstCreationSignerUserId()).toBeNull()
  })

  it('creates the singleton row on the first set and reads the signer back', async () => {
    await dbSetFirstCreationSignerUserId(7)
    expect(await dbGetFirstCreationSignerUserId()).toBe(7)
    expect(await CreaSetting.count()).toBe(1)
  })

  it('leaves the moderation settings on the row alone', async () => {
    // What the admin's Crea page had stored before the signer was picked.
    await CreaSetting.update({ id: 1 }, { model: 'claude-opus-5', effort: 'high', fastMode: true })
    await dbSetFirstCreationSignerUserId(9)
    const row = await CreaSetting.findOneByOrFail({ id: 1 })
    expect(row).toMatchObject({
      model: 'claude-opus-5',
      effort: 'high',
      fastMode: true,
      firstCreationSignerUserId: 9,
    })
  })

  it('clears the signer with null and does not add a second row', async () => {
    await dbSetFirstCreationSignerUserId(null)
    expect(await dbGetFirstCreationSignerUserId()).toBeNull()
    expect(await CreaSetting.count()).toBe(1)
  })
})

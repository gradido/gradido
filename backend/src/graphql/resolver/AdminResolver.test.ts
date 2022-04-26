import { testEnvironment, headerPushMock, resetToken, cleanDB } from '@test/helpers'
import { seedAll } from '@/seeds/index'

let mutate: any, query: any, con: any
let testEnv: any

beforeAll(async () => {
  testEnv = await testEnvironment()
  mutate = testEnv.mutate
  query = testEnv.query
  con = testEnv.con
  await cleanDB()
  seedAll(testEnv.testClient)
})

afterAll(async () => {
  await cleanDB()
  await con.close()
})

describe('AdminResolver', () => {
  it('runs', () => {
    expect(true).toBe(true)
  })
})

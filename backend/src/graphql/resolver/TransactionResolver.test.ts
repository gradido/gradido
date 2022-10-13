import { cleanDB, testEnvironment } from '@test/helpers'
import { logger } from '@test/testSetup'

let mutate: any, query: any, con: any
let testEnv: any

beforeAll(async () => {
  testEnv = await testEnvironment(logger)
  mutate = testEnv.mutate
  query = testEnv.query
  con = testEnv.con
  await cleanDB()
})

afterAll(async () => {
  await cleanDB()
  await con.close()
})
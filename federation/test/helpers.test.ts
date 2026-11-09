import { afterEach, describe, expect, it } from 'bun:test'
import { cleanDB } from '@test/helpers'

describe('cleanDB', () => {
  const database = process.env.DB_DATABASE

  afterEach(() => {
    process.env.DB_DATABASE = database
  })

  it('refuses a database that is no test database', async () => {
    process.env.DB_DATABASE = 'gradido_community'
    await expect(cleanDB()).rejects.toThrow("'gradido_community' is no test database")
  })

  it('refuses when no database is named', async () => {
    delete process.env.DB_DATABASE
    await expect(cleanDB()).rejects.toThrow("'undefined' is no test database")
  })
})

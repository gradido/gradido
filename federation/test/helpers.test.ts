import { afterEach, describe, expect, it } from 'bun:test'
import { cleanDB, contributionDateFormatter } from '@test/helpers'

describe('contributionDateFormatter', () => {
  it('formats the date correctly', () => {
    expect(contributionDateFormatter(new Date('Thu Feb 29 2024 13:12:11'))).toEqual('2/29/2024')
  })
})

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

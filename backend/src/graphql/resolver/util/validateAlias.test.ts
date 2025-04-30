import type { Connection } from '@dbTools/typeorm'
import { User } from '@entity/User'
import type { ApolloServerTestClient } from 'apollo-server-testing'

import { cleanDB, testEnvironment } from '@test/helpers'
import { i18n as localization, logger } from '@test/testSetup'

import { userFactory } from '@/seeds/factory/user'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'

import { validateAlias } from './validateAlias'

let con: Connection
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  con: Connection
}

beforeAll(async () => {
  testEnv = await testEnvironment(logger, localization)
  con = testEnv.con
  await cleanDB()
})

afterAll(async () => {
  await cleanDB()
  await con.close()
})

describe('validate alias', () => {
  beforeAll(() => {
    jest.clearAllMocks()
  })

  describe('alias too short', () => {
    it('throws and logs an error', async () => {
      await expect(validateAlias('Bi')).rejects.toEqual(new Error('Given alias is too short'))
      expect(logger.error).toBeCalledWith('Given alias is too short', 'Bi')
    })
  })

  describe('alias too long', () => {
    it('throws and logs an error', async () => {
      await expect(validateAlias('BibiBloxbergHexHexHex')).rejects.toEqual(
        new Error('Given alias is too long'),
      )
      expect(logger.error).toBeCalledWith('Given alias is too long', 'BibiBloxbergHexHexHex')
    })
  })

  describe('alias contains invalid characters', () => {
    it('throws and logs an error', async () => {
      await expect(validateAlias('Bibi.Bloxberg')).rejects.toEqual(
        new Error('Invalid characters in alias'),
      )
      expect(logger.error).toBeCalledWith('Invalid characters in alias', 'Bibi.Bloxberg')
    })
  })

  describe('alias is a reserved word', () => {
    it('throws and logs an error', async () => {
      await expect(validateAlias('admin')).rejects.toEqual(new Error('Alias is not allowed'))
      expect(logger.error).toBeCalledWith('Alias is not allowed', 'admin')
    })
  })

  describe('alias is a reserved word with uppercase characters', () => {
    it('throws and logs an error', async () => {
      await expect(validateAlias('Admin')).rejects.toEqual(new Error('Alias is not allowed'))
      expect(logger.error).toBeCalledWith('Alias is not allowed', 'Admin')
    })
  })

  describe('hyphens and underscore', () => {
    describe('alias starts with underscore', () => {
      it('throws and logs an error', async () => {
        await expect(validateAlias('_bibi')).rejects.toEqual(
          new Error('Invalid characters in alias'),
        )
        expect(logger.error).toBeCalledWith('Invalid characters in alias', '_bibi')
      })
    })

    describe('alias contains two following hyphens', () => {
      it('throws and logs an error', async () => {
        await expect(validateAlias('bi--bi')).rejects.toEqual(
          new Error('Invalid characters in alias'),
        )
        expect(logger.error).toBeCalledWith('Invalid characters in alias', 'bi--bi')
      })
    })
  })

  describe('test against existing alias in database', () => {
    beforeAll(async () => {
      const bibi = await userFactory(testEnv, bibiBloxberg)
      const user = await User.findOne({ where: { id: bibi.id } })
      if (user) {
        user.alias = 'b-b'
        await user.save()
      }
    })

    describe('alias exists in database', () => {
      it('throws and logs an error', async () => {
        await expect(validateAlias('b-b')).rejects.toEqual(new Error('Alias already in use'))
        expect(logger.error).toBeCalledWith('Alias already in use', 'b-b')
      })
    })

    describe('alias exists in database with in lower-case', () => {
      it('throws and logs an error', async () => {
        await expect(validateAlias('b-B')).rejects.toEqual(new Error('Alias already in use'))
        expect(logger.error).toBeCalledWith('Alias already in use', 'b-B')
      })
    })

    describe('valid alias', () => {
      it('resolves to true', async () => {
        await expect(validateAlias('bibi')).resolves.toEqual(true)
      })
    })
  })
})

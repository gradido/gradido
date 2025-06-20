import { User, UserContact } from '..'
import { AppDatabase } from '../AppDatabase'
import { aliasExists } from './user'
import { userFactory } from '../seeds/factory/user'
import { bibiBloxberg } from '../seeds/users/bibi-bloxberg'
import { describe, expect, it, beforeAll, afterAll } from 'vitest'

const db = AppDatabase.getInstance()

beforeAll(async () => {
  await db.init()
})
afterAll(async () => {
  await db.destroy()
})

describe('integration test mysql queries', () => { 
  describe('user.queries', () => {
    describe('aliasExists', () => {
      beforeAll(async () => {
        await User.clear()
        await UserContact.clear()

        const bibi =  bibiBloxberg
        bibi.alias = 'b-b'
        await userFactory(bibi)        
      })

      it('should return true if alias exists', async () => {
        expect(await aliasExists('b-b')).toBe(true)
      })

      it('should return true if alias exists even with deviating casing', async () => {
        expect(await aliasExists('b-B')).toBe(true)
      })

      it('should return false if alias does not exist', async () => {
        expect(await aliasExists('bibi')).toBe(false)
      })
    })
  })  
})
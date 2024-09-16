import { describe, it, expect } from 'vitest'
import CONFIG from './index'

describe('config/index', () => {
  describe('decay start block', () => {
    it('has the correct date set', () => {
      expect(CONFIG.DECAY_START_TIME).toEqual(new Date('2021-05-13T17:46:31.000Z'))
    })
  })
})

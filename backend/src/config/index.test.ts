import CONFIG from './index'

describe('config/index', () => {
  describe('decay start block', () => {
    it('has the correct date set', () => {
      expect(CONFIG.DECAY_START_TIME).toEqual(new Date('2021-05-13 17:46:31-0000'))
    })
  })
})

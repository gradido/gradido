import router from './router'

describe('router', () => {
  describe('options', () => {
    const options = router.options

    it('has "/vue" as base', () => {
      console.log(router)
      expect(options).toEqual(expect.objectContaining({
        base: '/vue',
      }))
    })

    it('has "active" as linkActiveClass', () => {
      expect(options).toEqual(expect.objectContaining({
        linkActiveClass: 'active',
      }))
    })

    it('has "history" as mode', () => {
      expect(options).toEqual(expect.objectContaining({
        mode: 'history',
      }))
    })

    
  })
})

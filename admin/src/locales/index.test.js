import locales from './index.js'

describe('locales', () => {
  it('should contain 2 locales', () => {
    expect(locales).toHaveLength(2)
  })

  it('should contain a German locale', () => {
    expect(locales).toContainEqual(
      expect.objectContaining({
        name: 'Deutsch',
        code: 'de',
        iso: 'de-DE',
        enabled: true,
      }),
    )
  })
})

import { createLog4jsConfig, defaultCategory } from '.'

describe('createLog4jsConfig', () => {
  it('should create a log4js config', () => {
    const config = createLog4jsConfig([
      defaultCategory('test', 'debug')
    ])
    expect(config).toBeDefined()
    expect(config.appenders).toBeDefined()
    expect(config.categories).toBeDefined()
    expect(config.appenders).toHaveProperty('test')
    expect(config.categories).toHaveProperty('test')
    expect(config.appenders.test).toMatchObject({
      type: 'dateFile',
      pattern: 'yyyy-MM-dd',
      compress: true,
      keepFileExt: true,
      fileNameSep: '_',
      numBackups: 30,
      filename: 'test.log',
      layout: {
        type: 'coloredContext',
        withStack: 'error',
        withLine: true
      }
    })
  })
})
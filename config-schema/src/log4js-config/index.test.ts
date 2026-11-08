import { createLog4jsConfig, defaultCategory } from '.'

describe('createLog4jsConfig', () => {
  it('should create a log4js config', () => {
    const config = createLog4jsConfig([defaultCategory('test', 'debug')])
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
        withLine: true,
      },
    })
  })

  it('writes every level of a category to stdout', () => {
    const config = createLog4jsConfig([defaultCategory('test', 'debug')])
    expect(config.categories.test.appenders).toEqual(['test', 'out', 'errors'])
  })

  it('writes a category with a stdout level to stdout only from that level on', () => {
    const config = createLog4jsConfig([
      { ...defaultCategory('apollo', 'info'), stdoutLevel: 'warn' },
    ])
    expect(config.categories.apollo.appenders).toEqual(['apollo', 'out-warn', 'errors'])
    expect(config.appenders['out-warn']).toEqual({
      type: 'logLevelFilter',
      level: 'warn',
      appender: 'out',
    })
  })
})

import { LoggingEvent, levels } from 'log4js'
import colors from 'yoctocolors-cjs'
import { createColoredContextLayout } from './coloredContext'

let defaultLogEvent: LoggingEvent
let colorFn: (input: string) => string
const startTime = new Date()
const startTimeString = startTime.toISOString()

describe('createColoredContextLayout', () => {
  beforeEach(() => {
    defaultLogEvent = {
      level: levels.INFO,
      categoryName: 'config',
      data: ['message'],
      context: { user: 1 },
      startTime,
      fileName: 'file',
      lineNumber: 1,
      callStack: 'stack',
      pid: 1,
      serialise: () => {
        throw new Error('Function not implemented.')
      },
    }
  })
  it('returns a function', () => {
    expect(typeof createColoredContextLayout({})).toBe('function')
  })
  describe('level:info, color:green', () => {
    beforeEach(() => {
      defaultLogEvent.level = levels.INFO
      colorFn = colors.green
    })
    it('format with all undefined', () => {
      const coloredString = colorFn(`[${startTimeString}] [${levels.INFO}] config -`)
      expect(createColoredContextLayout({})(defaultLogEvent)).toBe(
        `${coloredString} user=1 message`,
      )
    })
    it('format with stack', () => {
      const coloredString = colorFn(`[${startTimeString}] [${levels.INFO}] config -`)
      expect(createColoredContextLayout({ withStack: true })(defaultLogEvent)).toBe(
        `${coloredString} user=1 message \nstack`,
      )
    })
    it('format with file', () => {
      const coloredString = colorFn(`[${startTimeString}] [${levels.INFO}] config -`)
      expect(createColoredContextLayout({ withFile: true })(defaultLogEvent)).toBe(
        `${coloredString} user=1 message \n    at file:1`,
      )
    })
    it('format with file only if it where level:warn', () => {
      const coloredString = colorFn(`[${startTimeString}] [${levels.INFO}] config -`)
      expect(createColoredContextLayout({ withFile: 'warn' })(defaultLogEvent)).toBe(
        `${coloredString} user=1 message`,
      )
    })
    it('format with line', () => {
      const coloredString = colorFn(`[${startTimeString}] [${levels.INFO}] config:1 -`)
      expect(createColoredContextLayout({ withLine: true })(defaultLogEvent)).toBe(
        `${coloredString} user=1 message`,
      )
    })
    it('format with line only if it where level:warn', () => {
      const coloredString = colorFn(`[${startTimeString}] [${levels.INFO}] config -`)
      expect(createColoredContextLayout({ withLine: 'warn' })(defaultLogEvent)).toBe(
        `${coloredString} user=1 message`,
      )
    })
    it('format with file and line', () => {
      const coloredString = colorFn(`[${startTimeString}] [${levels.INFO}] config -`)
      expect(createColoredContextLayout({ withFile: true, withLine: true })(defaultLogEvent)).toBe(
        `${coloredString} user=1 message \n    at file:1`,
      )
    })
    it('format withStack: error, withLine: true, withFile: warn', () => {
      const coloredString = colorFn(`[${startTimeString}] [${levels.INFO}] config:1 -`)
      expect(
        createColoredContextLayout({
          withStack: 'error',
          withFile: 'warn',
          withLine: true,
        })(defaultLogEvent),
      ).toBe(`${coloredString} user=1 message`)
    })
  })

  describe('level:error, color:red', () => {
    beforeEach(() => {
      defaultLogEvent.level = levels.ERROR
      colorFn = colors.redBright
    })
    it('format with all undefined', () => {
      const coloredString = colorFn(`[${startTimeString}] [${levels.ERROR}] config -`)
      expect(createColoredContextLayout({})(defaultLogEvent)).toBe(
        `${coloredString} user=1 message`,
      )
    })
    it('format with stack', () => {
      const coloredString = colorFn(`[${startTimeString}] [${levels.ERROR}] config -`)
      expect(createColoredContextLayout({ withStack: true })(defaultLogEvent)).toBe(
        `${coloredString} user=1 message \nstack`,
      )
    })
    it('format with file', () => {
      const coloredString = colorFn(`[${startTimeString}] [${levels.ERROR}] config -`)
      expect(createColoredContextLayout({ withFile: true })(defaultLogEvent)).toBe(
        `${coloredString} user=1 message \n    at file:1`,
      )
    })
    it('format with line', () => {
      const coloredString = colorFn(`[${startTimeString}] [${levels.ERROR}] config:1 -`)
      expect(createColoredContextLayout({ withLine: true })(defaultLogEvent)).toBe(
        `${coloredString} user=1 message`,
      )
    })
    it('format with file and line', () => {
      const coloredString = colorFn(`[${startTimeString}] [${levels.ERROR}] config -`)
      expect(createColoredContextLayout({ withFile: true, withLine: true })(defaultLogEvent)).toBe(
        `${coloredString} user=1 message \n    at file:1`,
      )
    })
    it('format withStack: error, withLine: true, withFile: warn', () => {
      const coloredString = colorFn(`[${startTimeString}] [${levels.ERROR}] config -`)
      expect(
        createColoredContextLayout({
          withStack: 'error',
          withFile: 'warn',
          withLine: true,
        })(defaultLogEvent),
      ).toBe(`${coloredString} user=1 message \nstack`)
    })
  })
})

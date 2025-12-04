import { inspect } from 'node:util'
import { Level, LoggingEvent } from 'log4js'
import colors from 'yoctocolors-cjs'
import { ColoredContextLayoutConfig, LogLevel } from './types'

function colorize(str: string, level: Level): string {
  switch (level.colour) {
    case 'white':
      return colors.white(str)
    case 'grey':
      return colors.gray(str)
    case 'black':
      return colors.black(str)
    case 'blue':
      return colors.blue(str)
    case 'cyan':
      return colors.cyan(str)
    case 'green':
      return colors.green(str)
    case 'magenta':
      return colors.magenta(str)
    case 'red':
      return colors.redBright(str)
    case 'yellow':
      return colors.yellow(str)
    default:
      return colors.gray(str)
  }
}

// distinguish between objects with valid toString function (for examples classes derived from AbstractLoggingView) and other objects
function composeDataString(data: (string | Object)[]): string {
  return data
    .map((d) => {
      // if it is a object and his toString function return only garbage
      if (d && typeof d === 'object' && d.toString() === '[object Object]') {
        return inspect(d)
      }
      if (d) {
        return d.toString()
      }
    })
    .join(' ')
}

// automatic detect context objects and list them in logfmt style
function composeContextString(data: Object): string {
  return Object.entries(data)
    .map(([key, value]) => {
      return `${key}=${value} `
    })
    .join(' ')
    .trimEnd()
}

// check if option is enabled, either if option is them self a boolean or a valid log level and <= eventLogLevel
function isEnabledByLogLevel(eventLogLevel: Level, targetLogLevel?: LogLevel | boolean): boolean {
  if (!targetLogLevel) {
    return false
  }
  if (typeof targetLogLevel === 'boolean') {
    return targetLogLevel
  }
  return eventLogLevel.isGreaterThanOrEqualTo(targetLogLevel)
}

enum DetailKind {
  Callstack = 'callstack',
  File = 'file',
  Line = 'line',
}
function resolveDetailKind(
  logEvent: LoggingEvent,
  config: ColoredContextLayoutConfig,
): DetailKind | undefined {
  if (logEvent.callStack && isEnabledByLogLevel(logEvent.level, config.withStack)) {
    return DetailKind.Callstack
  }
  if (isEnabledByLogLevel(logEvent.level, config.withFile)) {
    return DetailKind.File
  }
  if (isEnabledByLogLevel(logEvent.level, config.withLine)) {
    return DetailKind.Line
  }
  return undefined
}

export function createColoredContextLayout(config: ColoredContextLayoutConfig) {
  return (logEvent: LoggingEvent) => {
    const result: string[] = []
    const detailKind = resolveDetailKind(logEvent, config)
    let categoryName = logEvent.categoryName
    if (detailKind === DetailKind.Line) {
      categoryName += `:${logEvent.lineNumber}`
    }
    result.push(
      colorize(
        `[${logEvent.startTime.toISOString()}] [${logEvent.level}] ${categoryName} -`,
        logEvent.level,
      ),
    )
    if (Object.keys(logEvent.context).length > 0) {
      result.push(composeContextString(logEvent.context))
    }
    result.push(composeDataString(logEvent.data))

    if (detailKind === DetailKind.File) {
      result.push(`\n    at ${logEvent.fileName}:${logEvent.lineNumber}`)
    }
    if (detailKind === DetailKind.Callstack) {
      result.push(`\n${logEvent.callStack}`)
    }
    return result.join(' ')
  }
}

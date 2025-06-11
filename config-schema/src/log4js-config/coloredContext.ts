import { Level, LoggingEvent } from 'log4js'
import colors from 'yoctocolors-cjs'
import { LogLevel } from './types'

export type coloredContextLayoutConfig = {
  withStack?: LogLevel | boolean
  withFile?: LogLevel | boolean
}

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
    .map((data) => {
      // if it is a object and his toString function return only garbage
      if (typeof data === 'object' && data.toString() === '[object Object]') {
        return JSON.stringify(data)
      }
      return data.toString()
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

export function createColoredContextLayout(config: coloredContextLayoutConfig) {
  return (logEvent: LoggingEvent) => {
    const result: string[] = []
    result.push(
      colorize(
        `[${logEvent.startTime.toISOString()}] [${logEvent.level}] ${logEvent.categoryName} -`,
        logEvent.level,
      ),
    )
    if (Object.keys(logEvent.context).length > 0) {
      result.push(composeContextString(logEvent.context))
    }
    result.push(composeDataString(logEvent.data))
    const showCallstack =
      logEvent.callStack && isEnabledByLogLevel(logEvent.level, config.withStack)
    if (!showCallstack && isEnabledByLogLevel(logEvent.level, config.withFile)) {
      result.push(`\n    at ${logEvent.fileName}:${logEvent.lineNumber}`)
    }
    if (showCallstack) {
      result.push(`\n${logEvent.callStack}`)
    }
    return result.join(' ')
  }
}

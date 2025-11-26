import { mock, jest } from 'bun:test'
import { inspect } from 'node:util'
/*
 * This file is used to mock the log4js logger in the tests.
 * It is used to collect all log entries in the logs array.
 * If you want to debug your test, you can use `printLogs()` to print all log entries collected through the tests.
 * To have only the relevant logs, call `clearLogs()` before your calling the methods you like to test and `printLogs()` after.
 * 
 * This is the bun version
 */

jest.setTimeout(1000000)

type LogEntry = {
  level: string;
  message: string;
  logger: string;
  context: string;
  additional: any[];
}

const loggers: { [key: string]: any } = {}
const logs: LogEntry[] = []

function addLog(level: string, message: string, logger: string, context: Map<string, string>, additional: any[]) {
  logs.push({ 
    level, 
    context: [...context.entries()].map(([key, value]) => `${key}=${value}`).join(' ').trimEnd(),
    message, 
    logger, 
    additional
  })
}

export function printLogs() {
  for (const log of logs) {
    const messages = []
    messages.push(log.message)
    // console.log('additionals: ', JSON.stringify(log.additional, null, 2))
    messages.push(log.additional.map((d) => inspect(d)).filter((d) => d))
    process.stdout.write(`${log.logger} [${log.level}] ${log.context} ${messages.join(' ')}\n`)
  }
}

export function clearLogs(): void {
  logs.length = 0
}

const getLoggerMocked = mock().mockImplementation((param: any) => {
  if (loggers[param]) {
    // TODO: check if it is working when tests run in parallel
    loggers[param].clearContext()
    return loggers[param]
  }
  // console.log('getLogger called with: ', param)
  const fakeLogger = {
    context: new Map<string, string>(),
    addContext: jest.fn((key: string, value: string) => {
      fakeLogger.context.set(key, value)
    }),
    trace: jest.fn((message: string, ...args: any[]) => {
      addLog('trace', message, param, fakeLogger.context, args)
    }),
    debug: jest.fn((message: string, ...args: any[]) => {
      addLog('debug', message, param, fakeLogger.context, args)
    }),
    warn: jest.fn((message: string, ...args: any[]) => {
      addLog('warn', message, param, fakeLogger.context, args)
    }),
    info: jest.fn((message: string, ...args: any[]) => {
      addLog('info', message, param, fakeLogger.context, args)
    }),
    error: jest.fn((message: string, ...args: any[]) => {
      addLog('error', message, param, fakeLogger.context, args)
    }),
    fatal: jest.fn((message: string, ...args: any[]) => {
      addLog('fatal', message, param, fakeLogger.context, args)
    }),
    removeContext: jest.fn((key: string) => {
      fakeLogger.context.delete(key)
    }),
    clearContext: jest.fn(() => {
      fakeLogger.context.clear()
    }),
    isDebugEnabled: jest.fn(() => {
      return true
    })
  }
  loggers[param] = fakeLogger
  return fakeLogger
})

mock.module('log4js', () => ({
  getLogger: getLoggerMocked,
  addLayout: jest.fn()
}))

export function getLogger(name: string) {
  if (!loggers[name]) {
    return getLoggerMocked(name)
  }
  return loggers[name]
}

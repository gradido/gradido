jest.setTimeout(1000000)

const loggers: { [key: string]: any } = {}
const logs: { level: string; message: string; logger: string; additional: string }[] = []

function addLog(level: string, message: string, logger: string, additional: any[]) {
  logs.push({ level, message, logger, additional: JSON.stringify(additional, null, 2) })
}

export function printLogs() {
  for (const log of logs) {
    process.stdout.write(`${log.logger} [${log.level}] ${log.message} ${log.additional}\n`)
  }
}

export function cleanLogs(): void {
  logs.length = 0
}

jest.mock('log4js', () => {
  const originalModule = jest.requireActual('log4js')
  return {
    __esModule: true,
    ...originalModule,
    getLogger: jest.fn().mockImplementation((param: any) => {
      // console.log('getLogger called with: ', param)
      const fakeLogger = {
        addContext: jest.fn(),
        trace: jest.fn((message: string, ...args: any[]) => {
          addLog('trace', message, param, args)
        }),
        debug: jest.fn((message: string, ...args: any[]) => {
          addLog('debug', message, param, args)
        }),
        warn: jest.fn((message: string, ...args: any[]) => {
          addLog('warn', message, param, args)
        }),
        info: jest.fn((message: string, ...args: any[]) => {
          addLog('info', message, param, args)
        }),
        error: jest.fn((message: string, ...args: any[]) => {
          addLog('error', message, param, args)
        }),
        fatal: jest.fn((message: string, ...args: any[]) => {
          addLog('fatal', message, param, args)
        }),
      }
      loggers[param] = fakeLogger
      return fakeLogger
    }),
  }
})

export function getLogger(name: string) {
  if (!loggers[name]) {
    throw new Error(`No logger with name ${name} was requested from code`)
  }
  return loggers[name]
}

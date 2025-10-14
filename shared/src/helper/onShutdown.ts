import { Logger } from 'log4js'
import colors from 'yoctocolors-cjs'

export enum ShutdownReason {
  SIGINT = 'SIGINT',
  SIGTERM = 'SIGTERM',
  UNCAUGHT_EXCEPTION = 'UNCAUGHT_EXCEPTION',
  UNCAUGHT_REJECTION = 'UNCAUGHT_REJECTION',
}


/**
 * Setup graceful shutdown for the process
 * @param gracefulShutdown will be called if process is terminated
 */
export function onShutdown(shutdownHandler: (reason: ShutdownReason, error?: Error | any) => Promise<void>) {
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM']
  signals.forEach(sig => {  
    process.on(sig, async () => {
      await shutdownHandler(sig as ShutdownReason)
      process.exit(0)
    })
  })

  process.on('uncaughtException', async (err) => {
    await shutdownHandler(ShutdownReason.UNCAUGHT_EXCEPTION, err)
    process.exit(1)
  })

  process.on('unhandledRejection', async (err) => {
    await shutdownHandler(ShutdownReason.UNCAUGHT_REJECTION, err)
    process.exit(1)
  })

  if (process.platform === "win32") {
    const rl = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    rl.on("SIGINT", () => {
      process.emit("SIGINT" as any)
    })
  }
}

export function printServerCrashAsciiArt(msg1: string, msg2: string, msg3: string) {
  console.error(colors.redBright(` /\\_/\\ ${msg1}`))
  console.error(colors.redBright(`( x.x )  ${msg2}`))
  console.error(colors.redBright(`>   <   ${msg3}`))
  console.error(colors.redBright(''))
}
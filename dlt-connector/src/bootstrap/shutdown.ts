import { Logger } from 'log4js'
import { type AppContextClients } from './appContext'

export function setupGracefulShutdown(logger: Logger, clients: AppContextClients) {
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM']
  signals.forEach((sig) => {
    process.on(sig, async () => {
      logger.info(`[shutdown] Got ${sig}, cleaning up…`)
      await gracefulShutdown(logger, clients)
      process.exit(0)
    })
  })

  if (process.platform === 'win32') {
    const rl = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    rl.on('SIGINT', () => {
      process.emit('SIGINT' as any)
    })
  }
}

async function gracefulShutdown(logger: Logger, clients: AppContextClients) {
  logger.info('graceful shutdown')
  await clients.hiero.waitForPendingPromises()
}

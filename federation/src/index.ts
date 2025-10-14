import 'source-map-support/register'
import { createServer } from './server/createServer'

import { defaultCategory, initLogger } from 'config-schema'
import { getLogger } from 'log4js'
// config
import { CONFIG } from './config'
import { LOG4JS_BASE_CATEGORY_NAME } from './config/const'
import { onShutdown, printServerCrashAsciiArt, ShutdownReason } from 'shared'

async function main() {
  const startTime = new Date()
  // init logger
  const log4jsConfigFileName = CONFIG.LOG4JS_CONFIG_PLACEHOLDER.replace('%v', CONFIG.FEDERATION_API)
  initLogger(
    [defaultCategory('federation', CONFIG.LOG_LEVEL), defaultCategory('apollo', CONFIG.LOG_LEVEL)],
    `${CONFIG.LOG_FILES_BASE_PATH}_${CONFIG.FEDERATION_API}`,
    log4jsConfigFileName,
  )

  // init server
  const { app } = await createServer(getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.apollo`))

  app.listen(CONFIG.FEDERATION_PORT, () => {
    const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}`)
    logger.info(`Server is running at http://localhost:${CONFIG.FEDERATION_PORT}`)
    if (CONFIG.GRAPHIQL) {
      logger.info(
        `GraphIQL available at ${CONFIG.FEDERATION_COMMUNITY_URL}/api/${CONFIG.FEDERATION_API}`,
      )
    }
    onShutdown(async (reason, error) => {
      if (ShutdownReason.SIGINT === reason || ShutdownReason.SIGTERM === reason) {
        logger.info(`graceful shutdown: ${reason}`)
      } else {
        const endTime = new Date()
        const duration = endTime.getTime() - startTime.getTime()
        printServerCrashAsciiArt(`reason: ${reason}`, `duration: ${duration}ms`, '')
        logger.error(error)
      }
    })
  })
}

main().catch((e) => {
  // biome-ignore lint/suspicious/noConsole: no logger present
  console.error(e)
  process.exit(1)
})

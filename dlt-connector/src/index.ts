import { Elysia } from 'elysia'
import { CONFIG } from './config'
import { appRoutes } from './server'
import { setupGracefulShutdown } from './bootstrap/shutdown'
import { createAppContext } from './bootstrap/appContext'
import { checkHieroAccount, checkHomeCommunity, checkGradidoNode, loadConfig } from './bootstrap/init'

async function main() {
  // load log4js-config, logger and gradido-blockchain-js crypto keys
  const logger = loadConfig()
  // initialize singletons (clients and cache)
  const appContext = createAppContext()

  // show hiero account balance, double also as check if valid hiero account was given in config
  await checkHieroAccount(logger, appContext.clients)

  // get home community, create topic if not exist, or check topic expiration and update it if needed
  const homeCommunity = await checkHomeCommunity(appContext, logger)

  // ask gradido node if community blockchain was created
  // if not exist, create community root transaction
  await checkGradidoNode(appContext.clients, logger, homeCommunity)
  
  // listen for rpc request from backend (graphql replaced with elysiaJS)
  new Elysia().use(appRoutes).listen(CONFIG.DLT_CONNECTOR_PORT, () => {
    logger.info(`Server is running at http://localhost:${CONFIG.DLT_CONNECTOR_PORT}`)
    setupGracefulShutdown(logger, appContext.clients)
  })
}

main().catch((e) => {
  // biome-ignore lint/suspicious/noConsole: maybe logger isn't initialized here
  console.error(e)
  process.exit(1)
})

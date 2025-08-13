import 'reflect-metadata'
import 'source-map-support/register'
import { getLogger } from 'log4js'
import { CONFIG } from './config'
import { startValidateCommunities } from './federation/validateCommunities'
import { createServer } from './server/createServer'
import { writeJwtKeyPairInHomeCommunity } from './federation/validateCommunities'
import { initLogging } from './server/logger'
import { Wallet, LocalProvider, AccountBalanceQuery, Client, PrivateKey } from '@hashgraph/sdk'

async function checkHieroConfig() {
  if (!CONFIG.HIERO_ACTIVE) {
    return
  }
  if (!CONFIG.HIERO_OPERATOR_ID || !CONFIG.HIERO_OPERATOR_KEY) {
    throw new Error('Hiero operator ID and key must be configured')
  }  
  
  const provider = new LocalProvider({ client: Client.forName(CONFIG.HIERO_HEDERA_NETWORK) })
  let operatorKey: PrivateKey
  if (CONFIG.HIERO_OPERATOR_KEY.length === 64 ) {
    operatorKey = PrivateKey.fromStringED25519(CONFIG.HIERO_OPERATOR_KEY)
  } else {
    operatorKey = PrivateKey.fromStringECDSA(CONFIG.HIERO_OPERATOR_KEY)
  }
  const wallet = new Wallet(
    CONFIG.HIERO_OPERATOR_ID, 
    operatorKey, 
    provider
  )
  const logger = getLogger('hiero')
  try {
    const balance = await new AccountBalanceQuery()
        .setAccountId(wallet.getAccountId())
        .executeWithSigner(wallet)

    logger.info(
        `${wallet
            .getAccountId()
            .toString()} balance = ${balance.hbars.toString()}`,
    )
  } catch (error) {
    logger.error(error)
  }

  provider.close()
}

async function main() {
  initLogging()
  await checkHieroConfig()
  const { app } = await createServer(getLogger('apollo'))

  await writeJwtKeyPairInHomeCommunity()
  app.listen(CONFIG.PORT, () => {
    // biome-ignore lint/suspicious/noConsole: no need for logging the start message
    console.log(`Server is running at http://localhost:${CONFIG.PORT}`)
    if (CONFIG.GRAPHIQL) {
      // biome-ignore lint/suspicious/noConsole: no need for logging the start message
      console.log(`GraphIQL available at http://localhost:${CONFIG.PORT}`)
    }
  })
  await startValidateCommunities(Number(CONFIG.FEDERATION_VALIDATE_COMMUNITY_TIMER))
}

main().catch((e) => {
  // biome-ignore lint/suspicious/noConsole: maybe logger isn't initialized here
  console.error(e)
  throw e
})

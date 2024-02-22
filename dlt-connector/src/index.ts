/* eslint-disable @typescript-eslint/no-explicit-any */
import { CONFIG } from '@/config'

import { Mnemonic } from './data/Mnemonic'
import createServer from './server/createServer'
import { stopTransmitToIota, transmitToIota } from './tasks/transmitToIota'

async function main() {
  if (CONFIG.IOTA_HOME_COMMUNITY_SEED) {
    Mnemonic.validateSeed(CONFIG.IOTA_HOME_COMMUNITY_SEED)
  }
  // eslint-disable-next-line no-console
  console.log(`DLT_CONNECTOR_PORT=${CONFIG.DLT_CONNECTOR_PORT}`)
  const { app } = await createServer()

  // loop run all the time, check for new transaction for sending to iota
  void transmitToIota()
  app.listen(CONFIG.DLT_CONNECTOR_PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is running at http://localhost:${CONFIG.DLT_CONNECTOR_PORT}`)
  })

  process.on('exit', () => {
    // Add shutdown logic here.
    stopTransmitToIota()
  })
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  // eslint-disable-next-line n/no-process-exit
  process.exit(1)
})

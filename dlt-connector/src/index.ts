/* eslint-disable @typescript-eslint/no-explicit-any */
import { CONFIG } from '@/config'
import createServer from './server/createServer'
import { stop as stopTransmitToIota, transmitToIota } from './tasks/transmitToIota'
import { TransactionsManager } from './controller/TransactionsManager'
import { KeyManager } from './controller/KeyManager'

async function main() {
  // eslint-disable-next-line no-console
  console.log(`DLT_CONNECTOR_PORT=${CONFIG.DLT_CONNECTOR_PORT}`)
  const { app } = await createServer()
  const startTime = Date.now()
  await KeyManager.getInstance().init()
  await TransactionsManager.getInstance().init()
  // loop run all the time, check for new transaction for sending to iota
  void transmitToIota()
  app.listen(CONFIG.DLT_CONNECTOR_PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`startup time: ${Date.now() - startTime} ms`)
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

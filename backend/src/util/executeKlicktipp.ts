import { AppDatabase } from 'database'

import { exportEventDataToKlickTipp } from './klicktipp'
import { initLogging } from '@/server/logger'

async function executeKlicktipp(): Promise<boolean> {
  initLogging()
  const connection = AppDatabase.getInstance()
  await connection.init('backend')
  if (connection.isConnected()) {
    await exportEventDataToKlickTipp()
    await connection.destroy()
    return true
  } else {
    return false
  }
}

executeKlicktipp().catch((e) => {
  // biome-ignore lint/suspicious/noConsole: logger isn't used here
  console.error(e)
  process.exit(1)
})

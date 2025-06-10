import { AppDatabase } from 'database'

import { exportEventDataToKlickTipp } from './klicktipp'

async function executeKlicktipp(): Promise<boolean> {
  const connection = AppDatabase.getInstance()
  await connection.init()
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

import { Connection } from '@/typeorm/connection'

import { exportEventDataToKlickTipp } from './klicktipp'

async function executeKlicktipp(): Promise<boolean> {
  const connection = await Connection.getInstance()
  if (connection) {
    await exportEventDataToKlickTipp()
    await connection.close()
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

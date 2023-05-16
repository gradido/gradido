import { getConnection } from '@/typeorm/connection'

import { exportEventDataToKlickTipp } from './klicktipp'

async function executeKlicktipp(): Promise<boolean> {
  const connection = await getConnection()
  if (connection) {
    await exportEventDataToKlickTipp()
    await connection.close()
    return true
  } else {
    return false
  }
}

void executeKlicktipp()

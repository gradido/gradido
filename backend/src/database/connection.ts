import { createConnection, Connection } from 'mysql2/promise'
import CONFIG from '../config'

const connection = async (): Promise<Connection> => {
  const con = await createConnection({
    host: CONFIG.DB_HOST,
    port: CONFIG.DB_PORT,
    user: CONFIG.DB_USER,
    password: CONFIG.DB_PASSWORD,
    database: CONFIG.DB_DATABASE,
  })

  await con.connect()

  return con
}

export default connection

import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'
import { CONFIG } from './src/config'

export default defineConfig({
  out: './drizzle',
  schema: './src/schemas/drizzle.schema.ts',
  dialect: 'mysql',
  dbCredentials: {
    // url: process.env.DATABASE_URL!,
    host: CONFIG.DB_HOST,
    user: CONFIG.DB_USER,
    password: CONFIG.DB_PASSWORD.length > 0 ? CONFIG.DB_PASSWORD : undefined,
    database: CONFIG.DB_DATABASE,
    port: CONFIG.DB_PORT,
  },
})
// AI-GENERATED — not an architecture reference
import 'reflect-metadata'
import { writeFileSync } from 'node:fs'
import { SCHEMA_FILE, schemaFileText } from './schemaFile'

schemaFileText().then((text) => {
  writeFileSync(SCHEMA_FILE, text)
  // the resolvers' imports leave a logger and timers open behind them
  process.exit(0)
})

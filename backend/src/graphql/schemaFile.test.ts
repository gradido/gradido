// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { SCHEMA_FILE, schemaFileText } from './schemaFile'

describe('schema.graphql', () => {
  it('is the schema the resolvers build -- else `bun run schema` in backend', async () => {
    expect(readFileSync(SCHEMA_FILE, 'utf8')).toBe(await schemaFileText())
  })
})

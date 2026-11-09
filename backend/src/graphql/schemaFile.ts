// AI-GENERATED — not an architecture reference
import { join } from 'node:path'
import { printSchema } from 'graphql'
import { schema } from './schema'

/**
 * The schema as a file, for whoever cannot build it: a front end's tests check the answers they
 * make up against it. Written by `bun run schema`; schemaFile.test.ts fails where it no longer
 * matches the resolvers.
 */
export const SCHEMA_FILE = join(__dirname, '..', '..', 'schema.graphql')

export const schemaFileText = async () =>
  [
    '# Generated from the resolvers by `bun run schema` in backend -- do not edit.',
    '',
    printSchema(await schema()),
    '',
  ].join('\n')

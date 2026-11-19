// AI-GENERATED — not an architecture reference

/**
 * Whether the server refused a request because this version's documents no longer fit its
 * schema: a tab open across a deploy. Only that code -- telling somebody to reload where reloading
 * cannot help is worse than saying nothing.
 */
export const isSchemaMismatch = (errors: { extensions?: { code?: unknown } }[]) =>
  errors.some(({ extensions }) => extensions?.code === 'GRAPHQL_VALIDATION_FAILED')

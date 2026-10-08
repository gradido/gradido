import * as v from 'valibot'

const NO_DESCRIPTION = 'No description available'

// the description sits on the schema inside v.optional(...) / v.nullable(...)
const unwrap = (schema: v.GenericSchema): v.GenericSchema =>
  'wrapped' in schema ? unwrap(schema.wrapped as v.GenericSchema) : schema

const descriptionOf = (schema: v.GenericSchema, key: unknown): string => {
  if (typeof key !== 'string' || !('entries' in schema)) {
    return NO_DESCRIPTION
  }
  const entry = (schema.entries as Record<string, v.GenericSchema | undefined>)[key]
  return entry ? (v.getDescription(unwrap(entry)) ?? NO_DESCRIPTION) : NO_DESCRIPTION
}

// one sentence per issue, naming the key, its value and the key's description
const issueMessage = (schema: v.GenericSchema, issue: v.BaseIssue<unknown>): string => {
  const details = JSON.stringify(
    { message: issue.message, expected: issue.expected, received: issue.received },
    null,
    2,
  )
  const path = issue.path
  if (path === undefined) {
    return `Config validation failed: ${issue.message}, details: ${details}`
  }
  const key = path.map((item) => String(item.key)).join('.')
  const description = descriptionOf(schema, path[0].key)
  if (issue.input === undefined) {
    return `Environment Variable '${key}' is missing. ${description}, details: ${details}`
  }
  return `Error on Environment Variable ${key} with value = ${String(issue.input)}: ${issue.message}. ${description}`
}

/**
 * Reads the config out of `env` - usually `process.env` - with `schema`: defaults filled in,
 * values converted, derived values built. Throws on the first issue, before any logger exists,
 * so the message says everything: the key, its value and what the key is for.
 */
export const parseConfig = <TSchema extends v.GenericSchema>(
  schema: TSchema,
  env: unknown,
): v.InferOutput<TSchema> => {
  const result = v.safeParse(schema, env, { abortEarly: true })
  if (!result.success) {
    throw new Error(issueMessage(schema, result.issues[0]))
  }
  return result.output
}

/**
 * Checks a config a module built itself against `schema` and throws on the first issue, the
 * same way `parseConfig` does. Nothing is returned: the module keeps its own object.
 */
export function validate(schema: v.GenericSchema, data: unknown): void {
  parseConfig(schema, data)
}

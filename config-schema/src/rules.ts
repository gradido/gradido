// AI-GENERATED — not an architecture reference
import * as v from 'valibot'

type Config = Record<string, unknown>

const issuePath = (config: Config, key: string): [v.IssuePathItem] => [
  { type: 'object', origin: 'value', input: config, key, value: config[key] },
]

/**
 * A rule across the keys of a config object, reported on `key`. `holds` sees the config after
 * every key passed its own schema, and is skipped while one has not. Piped after the object
 * schema; `TConfig` is inferred from it, so `key` is checked against the object's keys.
 */
export const configRule = <TConfig extends Config>(
  key: keyof TConfig & string,
  holds: (config: TConfig) => boolean,
  message: string,
) =>
  v.rawCheck<TConfig>(({ dataset, addIssue }) => {
    if (dataset.typed && !holds(dataset.value)) {
      addIssue({ message, input: dataset.value[key], path: issuePath(dataset.value, key) })
    }
  })

/** `key` must be set, and not '', while `flag` has the value `is` - `true` unless given. */
export const requiredWhen = <TConfig extends Config>(
  key: keyof TConfig & string,
  flag: keyof TConfig & string,
  is: unknown = true,
) =>
  configRule<TConfig>(
    key,
    (config) => config[flag] !== is || (config[key] !== undefined && config[key] !== ''),
    `${key} is required when ${flag} is ${String(is)}`,
  )

/** `key`, when set, must start with the value of `prefixKey`. */
export const startsWithValueOf = <TConfig extends Config>(
  key: keyof TConfig & string,
  prefixKey: keyof TConfig & string,
) =>
  configRule<TConfig>(
    key,
    (config) => {
      const value = config[key]
      const prefix = config[prefixKey]
      return (
        value === undefined ||
        (typeof value === 'string' && typeof prefix === 'string' && value.startsWith(prefix))
      )
    },
    `${key} must start with ${prefixKey}`,
  )

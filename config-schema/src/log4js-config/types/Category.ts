import { LogLevel } from './LogLevel'

/**
 * Configuration for a log4js category.
 *
 * @property {string} name - The name of the category.
 * @property {string} [filename] - The filename for the category, use name if not set.
 * @property {boolean} [stdout] - Whether to log to stdout.
 * @property {boolean} [additionalErrorsFile] - Whether to log errors additional to the default error file.
 * @property {LogLevel} level - The logging level.
 */
export type Category = {
  name: string
  filename?: string
  stdout?: boolean
  additionalErrorsFile?: boolean
  level: LogLevel
}

export function defaultCategory(name: string, level: LogLevel): Category {
  return {
    name,
    level,
    stdout: true,
    additionalErrorsFile: true,
  }
}
  
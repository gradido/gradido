import { LogLevel } from './LogLevel'

/**
 * Configuration for a log4js category.
 *
 * @property {string} name - The name of the category.
 * @property {string} [filename] - The filename for the category, use name if not set.
 * @property {boolean} [stdout] - Whether to log to stdout.
 * @property {boolean} [stdoutStack] - Whether to log the stacktrace to stdout.
 * @property {boolean} [errors] - Whether to log errors.
 * @property {boolean} [stack] - Whether to log the stacktrace.
 * @property {LogLevel} level - The logging level.
 */
export type Category = {
  name: string
  filename?: string
  stdout?: boolean
  stdoutStack?: boolean
  errors?: boolean
  stack?: boolean
  level: LogLevel
}

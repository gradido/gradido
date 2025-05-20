/**
 * use default dateFile Template for custom file appenders
 *
 * @example use name for key and filename
 * ```
 * const appenderConfig = createAppenderConfig([
 *   { name: 'info' },
 * ])
 * ```
 *
 * @example if log file should contain the stacktrace
 * ```
 * const appenderConfig = createAppenderConfig([
 *   { name: 'warn', filename: 'warn', stacktrace: true },
 * ])
 * ```
 */
export type CustomFileAppender = {
  name: string
  filename?: string
  stacktrace?: boolean
}

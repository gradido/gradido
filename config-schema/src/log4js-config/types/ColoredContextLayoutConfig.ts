import { LogLevel } from './LogLevel'

export type ColoredContextLayoutConfig = {
  withStack?: LogLevel | boolean
  withFile?: LogLevel | boolean
  withLine?: LogLevel | boolean
}
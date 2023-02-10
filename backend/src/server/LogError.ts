import { backendLogger as logger } from './logger'

export default class LogError extends Error {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(msg: string, ...details: any[]) {
    super(msg)
    logger.error(msg, ...details)
  }
}

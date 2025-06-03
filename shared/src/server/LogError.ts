import { backendLogger as logger } from './logger'

export class LogError extends Error {
  constructor(msg: string, ...details: any[]) {
    super(msg)
    logger.error(msg, ...details)
  }
}

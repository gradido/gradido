/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { logger } from './logger'

export class LogError extends Error {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(msg: string, ...details: any[]) {
    super(msg)
    logger.error(msg, ...details)
  }
}

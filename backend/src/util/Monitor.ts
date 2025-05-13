import { registerEnumType } from 'type-graphql'

import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

export enum MonitorNames {
  SEND_DLT_TRANSACTIONS = 1,
}

registerEnumType(MonitorNames, {
  name: 'MonitorNames', // this one is mandatory
  description: 'Name of Monitor-keys', // this one is optional
})

/* @typescript-eslint/no-extraneous-class */
export class Monitor {
  private static locks = new Map<MonitorNames, boolean>()

  private constructor() {}

  private _dummy = `to avoid unexpected class with only static properties`
  public get dummy() {
    return this._dummy
  }

  public static isLocked(key: MonitorNames): boolean | undefined {
    if (this.locks.has(key)) {
      logger.debug(`Monitor isLocked key=${key} = `, this.locks.get(key))
      return this.locks.get(key)
    }
    logger.debug(`Monitor isLocked key=${key} not exists`)
    return false
  }

  public static lockIt(key: MonitorNames): void {
    logger.debug(`Monitor lockIt key=`, key)
    if (this.locks.has(key)) {
      throw new LogError('still existing Monitor with key=', key)
    }
    this.locks.set(key, true)
  }

  public static releaseIt(key: MonitorNames): void {
    logger.debug(`Monitor releaseIt key=`, key)
    if (this.locks.has(key)) {
      this.locks.delete(key)
    }
  }
}

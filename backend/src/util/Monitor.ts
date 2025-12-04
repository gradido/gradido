import { getLogger } from 'log4js'
import { registerEnumType } from 'type-graphql'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { LogError } from '@/server/LogError'

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
  private static logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.util.Monitor`)

  private constructor() {}

  private _dummy = `to avoid unexpected class with only static properties`
  public get dummy() {
    return this._dummy
  }

  public static isLocked(key: MonitorNames): boolean | undefined {
    if (this.locks.has(key)) {
      this.logger.debug(`Monitor isLocked key=${key} = `, this.locks.get(key))
      return this.locks.get(key)
    }
    this.logger.debug(`Monitor isLocked key=${key} not exists`)
    return false
  }

  public static lockIt(key: MonitorNames): void {
    this.logger.debug(`Monitor lockIt key=`, key)
    if (this.locks.has(key)) {
      throw new LogError('still existing Monitor with key=', key)
    }
    this.locks.set(key, true)
  }

  public static releaseIt(key: MonitorNames): void {
    this.logger.debug(`Monitor releaseIt key=`, key)
    if (this.locks.has(key)) {
      this.locks.delete(key)
    }
  }
}

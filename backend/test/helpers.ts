/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { createTestClient } from 'apollo-server-testing'
import createServer from '../src/server/createServer'
import { initialize } from '@dbTools/helpers'
import { entities } from '@entity/index'

export const headerPushMock = jest.fn((t) => {
  context.token = t.value
})

const context = {
  token: '',
  setHeaders: {
    push: headerPushMock,
    forEach: jest.fn(),
  },
  clientRequestTime: '',
}

export const cleanDB = async () => {
  // this only works as lond we do not have foreign key constraints
  for (let i = 0; i < entities.length; i++) {
    await resetEntity(entities[i])
  }
}

export const testEnvironment = async (logger?: any) => {
  const server = await createServer(context, logger)
  const con = server.con
  const testClient = createTestClient(server.apollo)
  const mutate = testClient.mutate
  const query = testClient.query
  await initialize()
  return { mutate, query, con }
}

export const resetEntity = async (entity: any) => {
  const items = await entity.find({ withDeleted: true })
  if (items.length > 0) {
    const ids = items.map((i: any) => i.id)
    await entity.delete(ids)
  }
}

export const resetToken = () => {
  context.token = ''
}

export function addTimezoneHoursToClientRequestTime(offset: number): void {
  console.log(`addTimezoneHoursToClientRequesttime: ${getClientRequestTime()} + offset ${offset}`)
  const clientRequestTimeString = getClientRequestTimeAsDate()
    .toISOString()
    .replace(/Z$/, `+${String(offset).padStart(2, '0')}:00`)
  console.log(`clientRequestTimeString: ${clientRequestTimeString}`)
  let d = new Date(clientRequestTimeString)
  console.log(`clientRequestTimeString as Date: ${d}`)
  setClientRequestTime(clientRequestTimeString)
}

export function subTimezoneHoursToClientRequestTime(offset: number): void {
  console.log(`subTimezoneHoursToClientRequesttime: ${getClientRequestTime()} - offset ${offset}`)
  const clientRequestTimeString = getClientRequestTimeAsDate()
    .toISOString()
    .replace(/Z$/, `-${String(offset).padStart(2, '0')}:00`)
  console.log(`clientRequestTimeString: ${clientRequestTimeString}`)
  let d = new Date(clientRequestTimeString)
  console.log(`clientRequestTimeString as Date: ${d}`)
  setClientRequestTime(clientRequestTimeString)
}

export const setClientRequestTime = (stringDate: string) => {
  /*
  , timeZone: string) => {
  const feTime = timeZoneTransformer(stringDate, timeZone).fromUtc
  console.log('feTime=', feTime)
  const beTime = timeZoneTransformer(stringDate, timeZone).toUtc
  console.log('beTime=', beTime)

  console.log('timezoneOffset=', timezoneOffset(timeZone))

  const fe2beTime = timeZoneTransformer(feTime, timeZone).toUtc
  console.log('fe2beTime=', beTime)
  */

  context.clientRequestTime = stringDate
}

export const getClientRequestTime = (): string => {
  return context.clientRequestTime
}

export const getClientRequestTimeAsDate = (): Date => {
  return new Date(context.clientRequestTime)
}

export const resetClientRequestTime = () => {
  context.clientRequestTime = ''
}

/*
const timeZoneTransformer = (stringDate: string, timeZone: string) => {
  console.log('timeZoneTransformer:', stringDate, timeZone)
  const now = new Date()
  console.log('now', now.toISOString())
  const serverDate = new Date(stringDate)
  console.log('serverDate=', serverDate.toISOString())
  const utcDate = new Date(
    Date.UTC(
      serverDate.getFullYear(),
      serverDate.getMonth(),
      serverDate.getDate(),
      serverDate.getHours(),
      serverDate.getMinutes(),
      serverDate.getSeconds(),
    ),
  )
  console.log('utcDate=', utcDate.toISOString())
  const invdate = new Date(serverDate.toLocaleString('en-US', { timeZone })) // 'en-US'
  console.log('invdate=', invdate.toISOString())
  const diff = now.getTime() - invdate.getTime()
  console.log('diff=', diff)
  const adjustedDate = new Date(now.getTime() - diff)
  console.log('now.getTime - diff', now.getTime(), diff)
  console.log('adjustedDate=', adjustedDate.toISOString())
  console.log('toUTC=', utcDate.toISOString())
  console.log('fromUTC=', adjustedDate.toISOString())
  return {
    toUtc: utcDate.toISOString(),
    fromUtc: adjustedDate.toISOString(),
  }
}

const timezoneOffset = (timeZone: string, date = new Date()) => {
  const localDate = date.toLocaleString('fr', { timeZone, timeZoneName: 'long' })
  const tz = localDate.split(' ')
  const TZ = localDate.replace(tz[0], '').replace(tz[1], '').replace(' ', '')
  const dateString = date.toString()
  const offset =
    (Date.parse(`${dateString} UTC`) - Date.parse(`${dateString}${TZ}`)) / (3600 * 1000)
  return offset
}
*/
/*
const fromUtc = timeZoneTransformer('2020-10-10T08:00:00.000', 'Europe/Paris').fromUtc
console.log(fromUtc)
const toUtc = timeZoneTransformer(fromUtc, 'Europe/Paris').toUtc
console.log(toUtc)
*/

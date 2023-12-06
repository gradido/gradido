/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import axios from 'axios'

import { CONFIG } from '@/config'
import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

import { GmsUser } from './model/GmsUser'

/*
export async function communityList(): Promise<GmsCommunity[] | string | undefined> {
  const baseUrl = 'https://'.concat(CONFIG.GMS_HOST).concat(':').concat(CONFIG.GMS_PORT).concat('/')
  const service = 'community/list?page=1&perPage=20'
  const config = {
    headers: {
      accept: 'application/json',
      language: 'en',
      timezone: 'UTC',
      connection: 'keep-alive',
      authorization:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjoiVTJGc2RHVmtYMThuNzllbGJscThDbmxxZ0I2SGxicTZuajlpM2lmV3BTc3pHZFRtOFVTQjJZNWY2bG56elhuSUF0SEwvYVBWdE1uMjA3bnNtWDQ0M21xWVFyd0xJMklHNGtpRkZ3U2FKbVJwRk9VZXNDMXIyRGlta3VLMklwN1lYRTU0c2MzVmlScmMzaHE3djlFNkRabk4xeVMrU1QwRWVZRFI5c09pTDJCdmg4a05DNUc5NTdoZUJzeWlRbXcrNFFmMXFuUk5SNXpWdXhtZEE2WUUrT3hlcS85Y0d6NURyTmhoaHM3MTJZTFcvTmprZGNwdU55dUgxeWxhNEhJZyIsImlhdCI6MTcwMDUxMDg4OX0.WhtNGZc9A_hUfh8CcPjr44kWQWMkKJ7hlYXELOd3yy4',
    },
  }
  try {
    const result = await axios.get(baseUrl.concat(service), config)
    logger.debug('GET-Response of community/list:', result)
    if (result.status !== 200) {
      throw new LogError('HTTP Status Error in community/list:', result.status, result.statusText)
    }
    logger.debug('responseData:', result.data.responseData.data)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    // const gmsCom = JSON.parse(result.data.responseData.data)
    // logger.debug('gmsCom:', gmsCom)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return result.data.responseData.data
  } catch (error: any) {
    logger.error('Error in Get community/list:', error)
    const errMsg: string = error.message
    return errMsg
  }
}

export async function userList(): Promise<GmsUser[] | string | undefined> {
  const baseUrl = 'https://'.concat(CONFIG.GMS_HOST).concat(':').concat(CONFIG.GMS_PORT).concat('/')
  const service = 'community-user/list?page=1&perPage=20'
  const config = {
    headers: {
      accept: 'application/json',
      language: 'en',
      timezone: 'UTC',
      connection: 'keep-alive',
      authorization:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjoiVTJGc2RHVmtYMThuNzllbGJscThDbmxxZ0I2SGxicTZuajlpM2lmV3BTc3pHZFRtOFVTQjJZNWY2bG56elhuSUF0SEwvYVBWdE1uMjA3bnNtWDQ0M21xWVFyd0xJMklHNGtpRkZ3U2FKbVJwRk9VZXNDMXIyRGlta3VLMklwN1lYRTU0c2MzVmlScmMzaHE3djlFNkRabk4xeVMrU1QwRWVZRFI5c09pTDJCdmg4a05DNUc5NTdoZUJzeWlRbXcrNFFmMXFuUk5SNXpWdXhtZEE2WUUrT3hlcS85Y0d6NURyTmhoaHM3MTJZTFcvTmprZGNwdU55dUgxeWxhNEhJZyIsImlhdCI6MTcwMDUxMDg4OX0.WhtNGZc9A_hUfh8CcPjr44kWQWMkKJ7hlYXELOd3yy4',
    },
  }
  try {
    const result = await axios.get(baseUrl.concat(service), config)
    logger.debug('GET-Response of community/list:', result)
    if (result.status !== 200) {
      throw new LogError(
        'HTTP Status Error in community-user/list:',
        result.status,
        result.statusText,
      )
    }
    logger.debug('responseData:', result.data.responseData.data)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    // const gmsUser = JSON.parse(result.data.responseData.data)
    // logger.debug('gmsUser:', gmsUser)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return result.data.responseData.data
  } catch (error: any) {
    logger.error('Error in Get community-user/list:', error)
    const errMsg: string = error.message
    return errMsg
  }
}

export async function userByUuid(uuid: string): Promise<GmsUser[] | string | undefined> {
  const baseUrl = 'https://'.concat(CONFIG.GMS_HOST).concat(':').concat(CONFIG.GMS_PORT).concat('/')
  const service = 'community-user/list?page=1&perPage=20'
  const config = {
    headers: {
      accept: 'application/json',
      language: 'en',
      timezone: 'UTC',
      connection: 'keep-alive',
      authorization:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjoiVTJGc2RHVmtYMThuNzllbGJscThDbmxxZ0I2SGxicTZuajlpM2lmV3BTc3pHZFRtOFVTQjJZNWY2bG56elhuSUF0SEwvYVBWdE1uMjA3bnNtWDQ0M21xWVFyd0xJMklHNGtpRkZ3U2FKbVJwRk9VZXNDMXIyRGlta3VLMklwN1lYRTU0c2MzVmlScmMzaHE3djlFNkRabk4xeVMrU1QwRWVZRFI5c09pTDJCdmg4a05DNUc5NTdoZUJzeWlRbXcrNFFmMXFuUk5SNXpWdXhtZEE2WUUrT3hlcS85Y0d6NURyTmhoaHM3MTJZTFcvTmprZGNwdU55dUgxeWxhNEhJZyIsImlhdCI6MTcwMDUxMDg4OX0.WhtNGZc9A_hUfh8CcPjr44kWQWMkKJ7hlYXELOd3yy4',
    },
  }
  try {
    const result = await axios.get(baseUrl.concat(service), config)
    logger.debug('GET-Response of community/list:', result)
    if (result.status !== 200) {
      throw new LogError(
        'HTTP Status Error in community-user/list:',
        result.status,
        result.statusText,
      )
    }
    logger.debug('responseData:', result.data.responseData.data)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    // const gmsUser = JSON.parse(result.data.responseData.data)
    // logger.debug('gmsUser:', gmsUser)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return result.data.responseData.data
  } catch (error: any) {
    logger.error('Error in Get community-user/list:', error)
    const errMsg: string = error.message
    return errMsg
  }
}
*/

export async function createGmsUser(apiKey: string, user: GmsUser): Promise<boolean> {
  const baseUrl = 'http://'.concat(CONFIG.GMS_HOST).concat(':').concat(CONFIG.GMS_PORT).concat('/')
  const service = 'community-user'
  const config = {
    headers: {
      accept: 'application/json',
      language: 'en',
      timezone: 'UTC',
      connection: 'keep-alive',
      authorization: apiKey,
    },
  }
  try {
    const result = await axios.post(baseUrl.concat(service), user, config)
    logger.debug('POST-Response of community-user:', result)
    if (result.status !== 200) {
      throw new LogError('HTTP Status Error in community-user:', result.status, result.statusText)
    }
    logger.debug('responseData:', result.data.responseData)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    // const gmsUser = JSON.parse(result.data.responseData)
    // logger.debug('gmsUser:', gmsUser)
    return true
  } catch (error: any) {
    logger.error('Error in Get community-user:', error)
    throw new LogError(error.message)
  }
}

import axios from 'axios'
import { ensureUrlEndsWithSlash } from 'core'
import { SignJWT, jwtVerify } from 'jose'
import { getLogger } from 'log4js'
import { httpAgent, httpsAgent } from '@/apis/ConnectionAgents'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { LogError } from '@/server/LogError'

import { GmsUser } from './model/GmsUser'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.apis.gms.GmsClient`)

/*
export async function communityList(): Promise<GmsCommunity[] | string | undefined> {
  const baseUrl = ensureUrlEndsWithSlash(CONFIG.GMS_URL)
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

    // const gmsCom = JSON.parse(result.data.responseData.data)
    // logger.debug('gmsCom:', gmsCom)

    return result.data.responseData.data
  } catch (error: any) {
    logger.error('Error in Get community/list:', error)
    const errMsg: string = error.message
    return errMsg
  }
}

export async function userList(): Promise<GmsUser[] | string | undefined> {
  const baseUrl = ensureUrlEndsWithSlash(CONFIG.GMS_URL)
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

    // const gmsUser = JSON.parse(result.data.responseData.data)
    // logger.debug('gmsUser:', gmsUser)

    return result.data.responseData.data
  } catch (error: any) {
    logger.error('Error in Get community-user/list:', error)
    const errMsg: string = error.message
    return errMsg
  }
}

export async function userByUuid(uuid: string): Promise<GmsUser[] | string | undefined> {
  const baseUrl = ensureUrlEndsWithSlash(CONFIG.GMS_URL)
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

    // const gmsUser = JSON.parse(result.data.responseData.data)
    // logger.debug('gmsUser:', gmsUser)

    return result.data.responseData.data
  } catch (error: any) {
    logger.error('Error in Get community-user/list:', error)
    const errMsg: string = error.message
    return errMsg
  }
}
*/

export async function upsertGmsUsers(apiKey: string, users: GmsUser[]): Promise<boolean> {
  if (CONFIG.GMS_ACTIVE) {
    const baseUrl = ensureUrlEndsWithSlash(CONFIG.GMS_API_URL)
    const service = 'community-users'
    const config = {
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        language: 'en',
        timezone: 'UTC',
        authorization: `Bearer ${apiKey}`,
      },
      httpAgent,
      httpsAgent,
    }
    try {
      const result = await axios.post(baseUrl.concat(service), users, config)
      logger.debug('POST-Response of community-users:', result)
      if (result.status !== 200) {
        throw new LogError(
          'HTTP Status Error in community-users:',
          result.status,
          result.statusText,
        )
      }
      logger.debug('responseData:', result.data.responseData)

      // const gmsUser = JSON.parse(result.data.responseData)
      // logger.debug('gmsUser:', gmsUser)
      return true
    } catch (error: unknown) {
      logger.error('Error in post community-users:', error)
      if (error instanceof Error) {
        throw new LogError(error.message)
      }
      throw new LogError('Unknown error in post community-users')
    }
  } else {
    logger.info('GMS-Communication disabled per ConfigKey GMS_ACTIVE=false!')
    return false
  }
}

export async function verifyAuthToken(
  apiKey: string,
  token: string,
): Promise<string> {
  const baseUrl = ensureUrlEndsWithSlash(CONFIG.GMS_API_URL)
  const service = `verify-auth-token/${token}`
  const config = {
    headers: {
      accept: 'application/json',
      language: 'en',
      timezone: 'UTC',
      authorization: `Bearer ${apiKey}`,
    },
    httpAgent,
    httpsAgent,
  }
  try {
    const result = await axios.get(baseUrl.concat(service), config)
    logger.debug('GET-Response of verify-auth-token:', result)
    if (result.status !== 200) {
      throw new LogError(
        'HTTP Status Error in verify-auth-token:',
        result.status,
        result.statusText,
      )
    }
    logger.debug('data:', result.data)

    const token: string = result.data
    logger.debug('verifyAuthToken=', token)
    return token
  } catch (error: unknown) {
    logger.error('Error in verifyAuthToken:', error)
    if (error instanceof Error) {
      throw new LogError(error.message)
    }
    throw new LogError('Unknown error in verifyAuthToken')
  }
}

export async function createGmsHandshakeJWTToken(userUuid: string): Promise<string> {
  const secret = new TextEncoder().encode(CONFIG.JWT_SECRET)
  const token = await new SignJWT({ 'urn:gradido:check': true, uuid: userUuid })
    .setProtectedHeader({ alg: 'HS512' })
    .setIssuedAt()
    .setIssuer('urn:gradido:issuer')
    .setAudience('urn:gms:audience')
    .setExpirationTime('5m')
    .sign(secret)
  return token
}

export async function verifyGmsHandshakeJWTToken(token: string): Promise<string | undefined> {
  try {
    const secret = new TextEncoder().encode(CONFIG.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'urn:gradido:issuer',
      audience: 'urn:gms:audience',
    })
    
    return payload.uuid as string
  } catch (e) {
    logger.warn(`gms verify call failed with: ${e}`)
  }
}

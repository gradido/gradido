import axios from 'axios'
import { ensureUrlEndsWithSlash } from 'core'
import { jwtVerify, SignJWT } from 'jose'
import { getLogger } from 'log4js'
import { httpAgent, httpsAgent } from '@/apis/ConnectionAgents'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { LogError } from '@/server/LogError'

import { GmsMatchingEntrySnapshot, GmsUserMatchingEntry } from './model/GmsMatchingEntry'
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
      headers: gmsHeaders(apiKey),
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

/**
 * Write the matching entries of a batch of members, each member's set stated in full.
 * The GMS removes what a snapshot leaves out, so this also cleans up entries that were
 * paused or deleted while it could not be reached.
 *
 * Send this only after the users themselves are through: a member the GMS does not know
 * yet has their snapshot dropped with a warning, and the call still answers 200.
 */
export async function putGmsMatchingEntrySnapshots(
  apiKey: string,
  snapshots: GmsMatchingEntrySnapshot[],
): Promise<boolean> {
  if (!CONFIG.GMS_ACTIVE) {
    logger.info('GMS-Communication disabled per ConfigKey GMS_ACTIVE=false!')
    return false
  }
  const baseUrl = ensureUrlEndsWithSlash(CONFIG.GMS_API_URL)
  const service = 'community-users/matching-entry-snapshots'
  try {
    const result = await axios.put(baseUrl.concat(service), snapshots, {
      headers: gmsHeaders(apiKey),
      httpAgent,
      httpsAgent,
    })
    logger.debug('PUT-Response of community-users/matching-entry-snapshots:', result)
    if (result.status !== 200) {
      throw new LogError(
        'HTTP Status Error in community-users/matching-entry-snapshots:',
        result.status,
        result.statusText,
      )
    }
    return true
  } catch (error: unknown) {
    logger.error('Error in put community-users/matching-entry-snapshots:', error)
    if (error instanceof Error) {
      throw new LogError(error.message)
    }
    throw new LogError('Unknown error in put community-users/matching-entry-snapshots')
  }
}

/**
 * Write one matching entry. Idempotent on the entry's uuid, so a retry after a
 * lost response is harmless.
 */
export async function putGmsMatchingEntry(
  apiKey: string,
  entry: GmsUserMatchingEntry,
): Promise<boolean> {
  if (!CONFIG.GMS_ACTIVE) {
    logger.info('GMS-Communication disabled per ConfigKey GMS_ACTIVE=false!')
    return false
  }
  const baseUrl = ensureUrlEndsWithSlash(CONFIG.GMS_API_URL)
  const result = await axios.put(baseUrl.concat('community-user/matching-entry'), entry, {
    headers: gmsHeaders(apiKey),
    httpAgent,
    httpsAgent,
  })
  if (result.status !== 200) {
    throw new LogError(
      'HTTP Status Error in put community-user/matching-entry:',
      result.status,
      result.statusText,
    )
  }
  return true
}

/**
 * Remove one matching entry - because the member deleted it, or paused it: a
 * paused entry must not show up in anyone's search.
 */
export async function deleteGmsMatchingEntry(apiKey: string, uuid: string): Promise<boolean> {
  if (!CONFIG.GMS_ACTIVE) {
    logger.info('GMS-Communication disabled per ConfigKey GMS_ACTIVE=false!')
    return false
  }
  const baseUrl = ensureUrlEndsWithSlash(CONFIG.GMS_API_URL)
  const result = await axios.delete(baseUrl.concat(`community-user/matching-entry/${uuid}`), {
    headers: gmsHeaders(apiKey),
    httpAgent,
    httpsAgent,
  })
  if (result.status !== 200) {
    throw new LogError(
      'HTTP Status Error in delete community-user/matching-entry:',
      result.status,
      result.statusText,
    )
  }
  return true
}

/**
 * Remove a user and everything of theirs from the GMS. Sent when a member does not
 * take part - until now, nothing was sent at all in that case, and their copy simply
 * stayed in the GMS.
 *
 * Deleting an account does not reach this yet: `UserResolver.deleteUser` soft-removes
 * the member and leaves their copy over there. Wiring it up needs an answer for
 * `unDeleteUser` first, which would otherwise bring a member back who is no longer
 * findable.
 */
export async function deleteGmsUser(apiKey: string, userUuid: string): Promise<boolean> {
  if (!CONFIG.GMS_ACTIVE) {
    logger.info('GMS-Communication disabled per ConfigKey GMS_ACTIVE=false!')
    return false
  }
  const baseUrl = ensureUrlEndsWithSlash(CONFIG.GMS_API_URL)
  const result = await axios.delete(baseUrl.concat(`community-user/${userUuid}`), {
    headers: gmsHeaders(apiKey),
    httpAgent,
    httpsAgent,
  })
  if (result.status !== 200) {
    throw new LogError(
      'HTTP Status Error in delete community-user:',
      result.status,
      result.statusText,
    )
  }
  return true
}

/** One word of the shared matching vocabulary, with the cursor to ask after it. */
export interface GmsVocabularyWord {
  id: number
  word: string
}

/**
 * A page of the shared matching vocabulary.
 *
 * The list is global - every community's coined words in one table - and it is what
 * goes into the instruction before an entry is keyed, with one demand of the model: if
 * one of these fits, use exactly it. Without it two members describing the same thing
 * on two servers coin two words and never find each other.
 *
 * Paged by id, oldest first, because ids are only handed out and never reused: a
 * caller remembers the last one it saw and asks for what came after, and misses
 * nothing however much was inserted while it was away.
 */
export async function getGmsMatchingVocabulary(
  apiKey: string,
  afterId: number,
  limit: number,
): Promise<{ words: GmsVocabularyWord[]; hasMore: boolean }> {
  if (!CONFIG.GMS_ACTIVE) {
    logger.info('GMS-Communication disabled per ConfigKey GMS_ACTIVE=false!')
    return { words: [], hasMore: false }
  }
  const baseUrl = ensureUrlEndsWithSlash(CONFIG.GMS_API_URL)
  const result = await axios.get(baseUrl.concat('matching-vocabulary'), {
    params: { afterId: String(afterId), limit: String(limit) },
    headers: gmsHeaders(apiKey),
    httpAgent,
    httpsAgent,
  })
  if (result.status !== 200) {
    throw new LogError(
      'HTTP Status Error in get matching-vocabulary:',
      result.status,
      result.statusText,
    )
  }
  return { words: result.data?.words ?? [], hasMore: Boolean(result.data?.hasMore) }
}

/**
 * Report the words this server just coined, so every other one can reuse them.
 *
 * Sent separately from the entry that carries them, and both halves of that matter.
 * It arrives the moment the model has answered rather than whenever the entry is next
 * counted; and the word outlives the entry, because a word we forget is one the next
 * entry coins a second variant of.
 *
 * The language is the member's, and it is the only place the GMS can learn it: the
 * sentence itself never leaves this server. Words first coined in a language other
 * than German are measurably rougher, and the GMS keeps that mark so they can be read
 * through first.
 *
 * Answers with how many were new to the GMS.
 */
export async function postGmsMatchingVocabulary(
  apiKey: string,
  language: string,
  words: string[],
): Promise<number> {
  if (!CONFIG.GMS_ACTIVE) {
    logger.info('GMS-Communication disabled per ConfigKey GMS_ACTIVE=false!')
    return 0
  }
  const baseUrl = ensureUrlEndsWithSlash(CONFIG.GMS_API_URL)
  const result = await axios.post(
    baseUrl.concat('matching-vocabulary'),
    { language, words },
    { headers: gmsHeaders(apiKey), httpAgent, httpsAgent },
  )
  if (result.status !== 200) {
    throw new LogError(
      'HTTP Status Error in post matching-vocabulary:',
      result.status,
      result.statusText,
    )
  }
  return result.data?.added ?? 0
}

function gmsHeaders(apiKey: string) {
  return {
    accept: 'application/json',
    'Content-Type': 'application/json',
    language: 'en',
    timezone: 'UTC',
    authorization: `Bearer ${apiKey}`,
  }
}

export async function verifyAuthToken(apiKey: string, token: string): Promise<string> {
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

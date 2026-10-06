import axios from 'axios'
import { ensureUrlEndsWithSlash } from 'core'
import { getLogger } from 'log4js'
import {
  AuthContext,
  AuthSigningType,
  authContextSchema,
  createUserToken,
  Duration,
  JwtSigner,
  Uuidv4,
  verifyUserToken,
} from 'shared'
import * as v from 'valibot'
import { httpAgent, httpsAgent } from '@/apis/ConnectionAgents'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { LogError } from '@/server/LogError'
import { GmsMatchingEntrySnapshot, GmsUserMatchingEntry } from './model/GmsMatchingEntry'
import { GmsUser } from './model/GmsUser'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.apis.gms.GmsClient`)

/**
 * How long a call the keying run makes may take before it is given up on.
 *
 * The shared agents keep connections alive and set no timeout, and axios has none by
 * default, so a connection that dies without a FIN leaves the caller awaiting for as
 * long as the process lives. Every call the background run makes needs this: it keeps
 * one pass in flight at a time, so one hung request does not slow it down, it ends
 * it, with no error to log because nothing ever rejects.
 *
 * Carried by every call that any background loop makes - which is not only the keying
 * run. The two DELETEs are retried by `retryInBackground`, and a hang there is worse
 * than a slow one: `runRetries` awaits each attempt, so it never reaches attempt two,
 * never reaches its own "still failing after 3 retries - GMS copy may remain" line,
 * and a paused or deleted entry stays visible in everybody's search with nothing said
 * anywhere. That loop exists for the privacy case; it has to be able to finish.
 *
 * ⚠️ The remaining calls have none. They are made from request handlers or from a
 * script, where a hang costs one request rather than a whole guarantee.
 */
const GMS_REQUEST_TIMEOUT_MS = 30_000

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
    // Same timeout, same reason as the vocabulary calls above - and this one matters
    // more, because the keying run calls it once per entry from inside the pass that
    // guards itself with a single in-flight promise. A half-open connection here
    // would not fail the run, it would stop it, silently, until the process restarts.
    // The member's own save path calls this too, where a timeout only turns a hang
    // into the warning it already handles.
    timeout: GMS_REQUEST_TIMEOUT_MS,
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
    timeout: GMS_REQUEST_TIMEOUT_MS,
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
    timeout: GMS_REQUEST_TIMEOUT_MS,
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
    // The agents keep connections alive and set no timeout of their own, so without
    // this a half-open connection leaves the caller awaiting forever - and the caller
    // here is a background run that guards itself with a single in-flight promise. It
    // would not fail; it would stop, silently, until the process restarts.
    timeout: GMS_REQUEST_TIMEOUT_MS,
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
    { headers: gmsHeaders(apiKey), httpAgent, httpsAgent, timeout: GMS_REQUEST_TIMEOUT_MS },
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

// built once at module load: an invalid COMMUNITY_URL stops the server at startup
// own audience and HS512: signed with the same secret for the same member as the session token
// (auth/JWT.ts), and neither must pass for the other
const authContext: AuthContext = v.parse(authContextSchema, {
  issuer: CONFIG.COMMUNITY_URL,
  audience: `${ensureUrlEndsWithSlash(CONFIG.COMMUNITY_URL)}hook/gms/`,
  duration: Duration.minutes(5),
  signer: new JwtSigner(CONFIG.JWT_SECRET, AuthSigningType.HMAC512),
})

export function createGmsHandshakeJWTToken(gradidoID: Uuidv4): string {
  return createUserToken(gradidoID, authContext)
}

export function verifyGmsHandshakeJWTToken(token: string): string | null {
  return verifyUserToken(token, authContext)
}

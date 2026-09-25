// AI-GENERATED — not an architecture reference
import { randomBytes } from 'node:crypto'
import { Result } from 'shared'
import { CONFIG } from '@/config'
import { CHAT_VIDEO_SERVERS_DEFAULT } from './ChatVideoServers.default'

/**
 * A Jitsi server the chat takes video rooms from (V1). Per call the backend picks one among the
 * servers that passed the last check and hands out a fresh room on it; the wallet sends the
 * address as an ordinary chat message (V2).
 */
export interface ChatVideoServer {
  /** Where the rooms are: https, ending in '/'. A room's address is this plus its name. */
  baseUrl: string
  /** The host of `baseUrl`, port included where there is one: what names the server. */
  host: string
  /** Who runs the server, as the list names them; null where it names nobody. */
  operator: string | null
  /** What every room name on this server starts with: letters and digits, '' for none. */
  prefix: string
}

/** One entry as a list writes it: the default list in the code, or CHAT_VIDEO_SERVERS. */
export interface ChatVideoServerEntry {
  baseUrl: string
  operator: string | null
  prefix?: string
}

/** Why an entry is not taken. */
export type ChatVideoServerRejection =
  // Not an https address at all.
  | 'NOT_HTTPS'
  // An address with a query, a fragment or a user in it: a room's address would carry them.
  | 'NOT_A_BASE_ADDRESS'
  // A prefix with more than letters and digits. fairmeeting ignores hyphens in a room name,
  // other servers need not; spaces and other signs do not belong in an address at all.
  | 'BAD_PREFIX'
  // More than three fields: an operator's name cannot hold "|".
  | 'TOO_MANY_FIELDS'
  // The host is what names a server; a second entry for it is a mistake in the list.
  | 'DUPLICATE_HOST'

export interface ChatVideoServerList {
  /** Which list it is: the server's own, or the default list in the code. */
  source: 'CHAT_VIDEO_SERVERS' | 'DEFAULT'
  servers: ChatVideoServer[]
  /** The entries not taken, with the reason -- for the log, once, when the check starts. */
  rejected: { entry: string; reason: ChatVideoServerRejection }[]
}

/**
 * How often every server of the list is checked: every ten minutes, as the redirector
 * jitsi.random-redirect.de checks its own list (server.py, 600 s). An address handed out
 * points at a server that passed within the last ten minutes. A constant, not a setting (E-020).
 */
export const CHAT_VIDEO_CHECK_INTERVAL_MS = 600_000

/**
 * How many video rooms one HTTP request may ask for, over every alias and every operation it
 * carries -- counted in RequestBudget (server/context.ts): nothing in a single call keeps a
 * document from repeating the field. The wallet asks for one room per call a member starts.
 * Five rather than one for the reason MEMBER_AVATARS_FULL_MAX_PER_REQUEST gives: a limit that
 * ordinary use can reach gets raised by whoever hits it, without the reasoning being read again.
 */
export const CHAT_VIDEO_ROOMS_MAX_PER_REQUEST = 5

/** How long the random part of a room name is: 12 of 36 characters, about 62 bits. */
export const CHAT_VIDEO_ROOM_RANDOM_LENGTH = 12

// Lower case and digits only: capitals would count for nothing, as the XMPP rooms behind Jitsi
// do not tell them apart.
const ROOM_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'
// The largest multiple of 36 up to 256. A byte from 252 on is drawn again, so that every
// character is equally likely: with 252..255 taken as well, a..d would come up 8 times in
// 256 and every other character 7 times.
const ROOM_BYTE_LIMIT = 252

const PREFIX = /^[A-Za-z0-9]*$/

const parseUrl = (text: string): URL | null => {
  try {
    return new URL(text)
  } catch {
    return null
  }
}

/**
 * An entry as the server it names: the base address with a '/' at its end, its host, the
 * operator's name trimmed (empty is none), and the prefix as it was given.
 */
export const chatVideoServerFrom = (
  entry: ChatVideoServerEntry,
): Result<ChatVideoServer, ChatVideoServerRejection> => {
  const url = parseUrl(entry.baseUrl.trim())
  if (!url || url.protocol !== 'https:') {
    return { success: false, error: 'NOT_HTTPS' }
  }
  if (url.username || url.password || url.search || url.hash) {
    return { success: false, error: 'NOT_A_BASE_ADDRESS' }
  }
  const prefix = entry.prefix ?? ''
  if (!PREFIX.test(prefix)) {
    return { success: false, error: 'BAD_PREFIX' }
  }
  const path = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`
  return {
    success: true,
    value: {
      baseUrl: `${url.origin}${path}`,
      host: url.host,
      operator: entry.operator?.trim() || null,
      prefix,
    },
  }
}

type ServersAndRejected = Pick<ChatVideoServerList, 'servers' | 'rejected'>

/** Adds `entry` to `list`, or its reason to `list.rejected` -- in the order of the list. */
const take = (list: ServersAndRejected, text: string, entry: ChatVideoServerEntry): void => {
  const result = chatVideoServerFrom(entry)
  if (!result.success) {
    list.rejected.push({ entry: text, reason: result.error })
  } else if (list.servers.some((server) => server.host === result.value.host)) {
    list.rejected.push({ entry: text, reason: 'DUPLICATE_HOST' })
  } else {
    list.servers.push(result.value)
  }
}

/**
 * CHAT_VIDEO_SERVERS read: entries separated by ";", fields by "|" -- base address, operator,
 * prefix, the last two optional. An entry that breaks a rule is left out with its reason; the
 * others are taken all the same.
 */
export const parseChatVideoServers = (text: string): ServersAndRejected => {
  const list: ServersAndRejected = { servers: [], rejected: [] }
  for (const part of text.split(';')) {
    const entryText = part.trim()
    if (entryText === '') {
      continue
    }
    const fields = entryText.split('|').map((field) => field.trim())
    if (fields.length > 3) {
      list.rejected.push({ entry: entryText, reason: 'TOO_MANY_FIELDS' })
      continue
    }
    const [baseUrl, operator, prefix] = fields
    take(list, entryText, { baseUrl, operator: operator || null, prefix })
  }
  return list
}

/**
 * The servers the chat takes video rooms from. The one place the list comes from: the check
 * reads it here, and the query knows only what the check found -- where the list is kept can
 * change here alone (V3: a table the admin fills).
 *
 * ⛔ Where the server's configuration sets CHAT_VIDEO_SERVERS, that list is the only one --
 * also when none of its entries can be used. A community that set fairmeeting with its prefix
 * gets no public server in its place: its agreement with fairkom covers the prefix, not a
 * server to fall back on. Only an empty value means the default list.
 */
export const chatVideoServers = (
  configured: string = CONFIG.CHAT_VIDEO_SERVERS,
): ChatVideoServerList => {
  if (configured.trim() === '') {
    const list: ServersAndRejected = { servers: [], rejected: [] }
    for (const entry of CHAT_VIDEO_SERVERS_DEFAULT) {
      take(list, entry.baseUrl, entry)
    }
    return { source: 'DEFAULT', ...list }
  }
  return { source: 'CHAT_VIDEO_SERVERS', ...parseChatVideoServers(configured) }
}

/**
 * A room name: the server's prefix, then 12 characters drawn from lower case letters and digits
 * with `random` -- crypto.randomBytes, never Math.random: whoever knows the name can join the
 * room, so it must not be guessable. `random` is a parameter for the tests only.
 */
export const chatVideoRoomName = (
  prefix: string,
  random: (size: number) => Buffer = randomBytes,
): string => {
  let name = ''
  while (name.length < CHAT_VIDEO_ROOM_RANDOM_LENGTH) {
    for (const byte of random(CHAT_VIDEO_ROOM_RANDOM_LENGTH)) {
      if (byte < ROOM_BYTE_LIMIT && name.length < CHAT_VIDEO_ROOM_RANDOM_LENGTH) {
        name += ROOM_ALPHABET[byte % ROOM_ALPHABET.length]
      }
    }
  }
  return prefix + name
}

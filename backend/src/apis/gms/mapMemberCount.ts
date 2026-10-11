// AI-GENERATED — not an architecture reference
import { getHomeCommunityDrizzle } from 'database'
import { getLogger } from 'log4js'
import { Result } from 'shared'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { GmsUserCountError, getGmsUserCount } from './GmsClient'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.apis.gms.mapMemberCount`)

/**
 * How often the GMS is asked. The number moves by a few members a day and nobody watches it
 * move: the wallet shows it once, as the heading of an invitation, to a member who is not on
 * the map yet. A quarter of an hour is far more often than that needs. It is this short so
 * that a GMS which learns to answer -- a release over there, a key entered on the admin page
 * here -- shows on the tiles soon, without a restart.
 */
export const MAP_MEMBER_COUNT_REFRESH_MS = 15 * 60 * 1000

/** One answer of the GMS, or null where there is nobody to ask. */
export type MapMemberCountAnswer = Result<number, GmsUserCountError> | null

/**
 * Asks the GMS with this community's key; null for a community that has none. Read on every
 * round and not once: the key is entered on the admin page while the process runs, and the
 * home community is cached and told about every write.
 */
export const askGmsForMapMemberCount = async (): Promise<MapMemberCountAnswer> => {
  const { gmsApiKey } = await getHomeCommunityDrizzle()
  return gmsApiKey ? getGmsUserCount(gmsApiKey) : null
}

/**
 * How many members stand on the map across every community, as the GMS last said -- held in
 * the process, the way the chat's video servers are (apis/jitsi/chatVideoServerPool.ts).
 *
 * The GMS is asked here, in the background, and never in a member's request: the query
 * `mapMemberCount` only calls known(). A wallet waits for that query before it paints its
 * overview, so it must not wait for a server somewhere else.
 */
export class MapMemberCount {
  private count: number | null = null
  private started = false
  // What the last round ended with, so that the log tells of a change and not of every round:
  // a GMS without the route would otherwise say so 96 times a day.
  private lastOutcome: string | null = null

  constructor(
    private readonly ask: () => Promise<MapMemberCountAnswer> = askGmsForMapMemberCount,
  ) {}

  /**
   * Asks now, then every `intervalMs`. The first answer is not waited for: until it is in,
   * known() is null and the wallet's invitation stands without the number.
   *
   * Nothing at all on a server without the GMS.
   *
   * setTimeout twice rather than setInterval, like startValidateCommunities: a round that takes
   * longer than the interval does not overlap the next. unref: this timer alone keeps no process
   * alive.
   *
   * Called from index.ts, once.
   */
  start(intervalMs: number = MAP_MEMBER_COUNT_REFRESH_MS): void {
    if (this.started || !CONFIG.GMS_ACTIVE) {
      return
    }
    this.started = true
    logger.info(`members on the map: the GMS is asked every ${intervalMs} ms`)
    const run = async (): Promise<void> => {
      await this.refresh()
      setTimeout(run, intervalMs).unref()
    }
    setTimeout(run, 0).unref()
  }

  /**
   * One round. Never rejects: a round that brings no number -- or throws, where the home
   * community cannot be read -- is logged, and the next one still comes.
   *
   * ⛔ A round without a number leaves the last one standing. A GMS that is briefly away must
   * not take the number off every invitation; what stood there an hour or a day ago is as true
   * as this number needs to be.
   */
  async refresh(): Promise<void> {
    let answer: MapMemberCountAnswer
    try {
      answer = await this.ask()
    } catch (error) {
      this.tell('the question could not be asked', 'error', error)
      return
    }
    if (answer === null) {
      this.tell('this community has no GMS key, nobody to ask', 'info')
      return
    }
    if (!answer.success) {
      this.tell(`no number from the GMS: ${answer.error.message}`, 'warn')
      return
    }
    this.count = answer.value
    this.tell(`${answer.value} members on the map`, 'info')
  }

  /** The number as the GMS last said it; null until it has. */
  known(): number | null {
    return this.count
  }

  private tell(outcome: string, level: 'info' | 'warn' | 'error', detail?: unknown): void {
    if (outcome === this.lastOutcome) {
      return
    }
    this.lastOutcome = outcome
    const line = `members on the map: ${outcome}`
    if (detail === undefined) {
      logger[level](line)
    } else {
      logger[level](line, detail)
    }
  }
}

/** The one of the process: started from index.ts, read by the query `mapMemberCount`. */
export const mapMemberCount = new MapMemberCount()

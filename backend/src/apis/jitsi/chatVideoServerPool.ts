// AI-GENERATED — not an architecture reference
import { randomInt } from 'node:crypto'
import { dbSelectChatVideoServers } from 'database'
import { getLogger } from 'log4js'
import { Result } from 'shared'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import {
  CHAT_VIDEO_CHECK_INTERVAL_MS,
  CHAT_VIDEO_CHECK_MAX_AGE_MS,
  ChatVideoServer,
  ChatVideoServerTable,
  chatVideoServersFromRows,
} from '@/data/ChatVideoServer.logic'
import { JitsiProbeAnswer, probeJitsiServer } from './jitsiProbe'
import { JitsiProbeError, JitsiProbeFailure } from './jitsiProbe.logic'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.apis.jitsi.chatVideoServerPool`)

/**
 * The list as a check goes through it: chat_video_servers, read afresh every time. The admin page
 * changes the table while the process runs, and a copy read at the start would not see it -- the
 * house rule for a state switchable at run time (drizzle.schema.ts, matching_keying_active).
 */
export const readChatVideoServers = async (): Promise<ChatVideoServerTable> =>
  chatVideoServersFromRows(await dbSelectChatVideoServers())

/** What the last check found about one server of the list. */
export interface ChatVideoServerState {
  /** The row of chat_video_servers the server comes from. */
  id: number
  server: ChatVideoServer
  /** The tick "in the random choice", as the row had it when the check read the table. */
  active: boolean
  /** Whether it passed: rooms are handed out on it until the next check says otherwise. */
  ok: boolean
  /** Why not, where it did not pass; null where it did. */
  reason: JitsiProbeFailure | null
  /** When the check that found this was through. */
  checkedAt: Date
  /** How long its two answers took together, where it passed. */
  latencyMs: number | null
  /** How many rooms were handed out on it since the process started. */
  picks: number
}

/**
 * The servers of the list and what the last check found about them, held in the process.
 * The check runs here, every ten minutes and never in a member's request: chatVideoRoom only
 * calls pick(), which reads what the last check found -- a request never waits for a server
 * somewhere else. The admin page may ask for a check at once (refreshNow).
 */
export class ChatVideoServerPool {
  private states: ChatVideoServerState[] = []
  private started = false
  // The check under way, if one is -- and whether it has been asked for again meanwhile.
  private underway: Promise<void> | null = null
  private askedAgain = false

  constructor(
    private readonly list: () => Promise<ChatVideoServerTable> = readChatVideoServers,
    private readonly probe: (
      server: ChatVideoServer,
    ) => Promise<Result<JitsiProbeAnswer, JitsiProbeError>> = probeJitsiServer,
  ) {}

  /**
   * Checks the list now, then every `intervalMs`. The first check is not waited for: until it
   * is through, pick() finds no server and the query says so.
   *
   * setTimeout twice rather than setInterval, like startValidateCommunities: a check that takes
   * longer than the interval does not overlap the next. unref: this timer alone keeps no process
   * alive.
   *
   * Called from index.ts, once, after the list was filled where it was empty.
   */
  start(intervalMs: number = CHAT_VIDEO_CHECK_INTERVAL_MS): void {
    if (this.started) {
      return
    }
    this.started = true
    logger.info(
      `chat video servers: the list of the admin page (chat_video_servers), checked every ${intervalMs} ms`,
    )
    const run = async (): Promise<void> => {
      await this.refreshNow()
      setTimeout(run, intervalMs).unref()
    }
    setTimeout(run, 0).unref()
  }

  /**
   * A check now, and never two at the same time: two would ask every server twice, and the one
   * through last would put its older view in place.
   *
   * ⛔ While a check runs, a call does not start a second one -- it gets the promise of the one
   * under way, and that check goes through the list ONCE MORE when it is done, however many calls
   * came in meanwhile. The check under way read the table before the change that asked for this
   * one: without the second round a server switched off during a check would stay in the random
   * choice until the next timer, ten minutes later.
   *
   * Never rejects: a check that fails -- the table cannot be read -- is logged, and the last one
   * found stands (pick() stops using it once it is older than CHAT_VIDEO_CHECK_MAX_AGE_MS).
   */
  refreshNow(): Promise<void> {
    if (this.underway) {
      this.askedAgain = true
      return this.underway
    }
    const rounds = async (): Promise<void> => {
      try {
        do {
          this.askedAgain = false
          try {
            await this.refresh()
          } catch (error) {
            logger.error('checking the chat video servers failed', error)
          }
        } while (this.askedAgain)
      } finally {
        this.underway = null
      }
    }
    this.underway = rounds()
    return this.underway
  }

  /**
   * Checks every server of the list -- the inactive ones as well, so that the admin page shows
   * whether a server switched off answers again; two requests every ten minutes cost little --
   * all at the same time, and puts what it found in place in one step: a pick in the meantime
   * sees the last check whole, never part of the next. One sentence in the log -- how many
   * answer, how many of them are in the random choice, and each one that does not answer with
   * its reason.
   */
  private async refresh(): Promise<void> {
    const { servers, rejected } = await this.list()
    for (const { entry, reason } of rejected) {
      logger.warn(`chat video server left out: ${entry} (${reason})`)
    }
    const results = await Promise.allSettled(servers.map(({ server }) => this.probe(server)))
    const checkedAt = new Date()
    // What was handed out stays with its row -- read now, not before the check, so that the
    // picks made while it ran count as well.
    const picks = new Map<number, number>(this.states.map((state) => [state.id, state.picks]))
    this.states = servers.map(({ id, active, server }, index): ChatVideoServerState => {
      const settled = results[index]
      let reason: JitsiProbeFailure | null = null
      let latencyMs: number | null = null
      if (settled.status === 'rejected') {
        // probeJitsiServer returns every failure of a server; a throw is a bug of ours.
        logger.error(`checking ${server.host} threw`, settled.reason)
        reason = 'UNREACHABLE'
      } else if (!settled.value.success) {
        reason = settled.value.error.reason
      } else {
        latencyMs = settled.value.value.latencyMs
      }
      return {
        id,
        server,
        active,
        ok: reason === null,
        reason,
        checkedAt,
        latencyMs,
        picks: picks.get(id) ?? 0,
      }
    })
    const failed = this.states.filter((state) => !state.ok)
    const chosen = this.states.filter((state) => state.ok && state.active).length
    const which = failed.map((state) => `${state.server.host} ${state.reason}`).join(', ')
    logger.info(
      `chat video servers: ${this.states.length - failed.length} of ${this.states.length} answer, ${chosen} of them in the random choice${which ? ` -- ${which}` : ''}`,
    )
  }

  /**
   * One of the servers in the random choice that passed the last check, each of them equally
   * likely, counted in its picks; null where none did -- before the first check is through as
   * well, and where the last check is older than CHAT_VIDEO_CHECK_MAX_AGE_MS because the checks
   * after it failed.
   */
  pick(): ChatVideoServerState | null {
    const now = Date.now()
    const answering = this.states.filter(
      (state) =>
        state.active && state.ok && now - state.checkedAt.getTime() <= CHAT_VIDEO_CHECK_MAX_AGE_MS,
    )
    if (answering.length === 0) {
      return null
    }
    const chosen = answering[randomInt(answering.length)]
    chosen.picks += 1
    return chosen
  }

  /** What the last check found, one entry per server of the list, in its order. */
  state(): readonly ChatVideoServerState[] {
    return this.states
  }
}

/** The one pool of the process: started from index.ts, read by chatVideoRoom and the admin page. */
export const chatVideoServerPool = new ChatVideoServerPool()

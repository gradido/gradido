// AI-GENERATED — not an architecture reference
import { randomInt } from 'node:crypto'
import { getLogger } from 'log4js'
import { Result } from 'shared'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import {
  CHAT_VIDEO_CHECK_INTERVAL_MS,
  CHAT_VIDEO_CHECK_MAX_AGE_MS,
  ChatVideoServer,
  ChatVideoServerList,
  chatVideoServers,
} from '@/data/ChatVideoServer.logic'
import { JitsiProbeAnswer, probeJitsiServer } from './jitsiProbe'
import { JitsiProbeError, JitsiProbeFailure } from './jitsiProbe.logic'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.apis.jitsi.chatVideoServerPool`)

/** What the last check found about one server of the list. */
export interface ChatVideoServerState {
  server: ChatVideoServer
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
 * The check runs here, every ten minutes and never in a request: chatVideoRoom only calls
 * pick(), which reads what the last check found -- a request never waits for a server
 * somewhere else.
 */
export class ChatVideoServerPool {
  private states: ChatVideoServerState[] = []
  private started = false

  constructor(
    private readonly list: () => ChatVideoServerList = chatVideoServers,
    private readonly probe: (
      server: ChatVideoServer,
    ) => Promise<Result<JitsiProbeAnswer, JitsiProbeError>> = probeJitsiServer,
  ) {}

  /**
   * Checks the list now, then every `intervalMs`. The first check is not waited for: until it
   * is through, pick() finds no server and the query says so.
   *
   * setTimeout twice rather than setInterval, like startValidateCommunities: a check that takes
   * longer than the interval does not overlap the next. A check that throws is logged, and the
   * next one still comes. unref: this timer alone keeps no process alive.
   *
   * Called from index.ts, once; the tests call refresh() themselves.
   */
  start(intervalMs: number = CHAT_VIDEO_CHECK_INTERVAL_MS): void {
    if (this.started) {
      return
    }
    this.started = true
    const { source, servers, rejected } = this.list()
    logger.info(
      `chat video servers: ${servers.length} from ${source === 'DEFAULT' ? 'the default list' : 'CHAT_VIDEO_SERVERS'}, checked every ${intervalMs} ms`,
    )
    for (const { entry, reason } of rejected) {
      logger.warn(`chat video server left out: ${entry} (${reason})`)
    }
    if (source === 'CHAT_VIDEO_SERVERS' && servers.length === 0) {
      logger.error('CHAT_VIDEO_SERVERS is set, but holds no usable entry: no video rooms here')
    }
    const run = async (): Promise<void> => {
      try {
        await this.refresh()
      } catch (error) {
        logger.error('checking the chat video servers failed', error)
      }
      setTimeout(run, intervalMs).unref()
    }
    setTimeout(run, 0).unref()
  }

  /**
   * Checks every server of the list, all at the same time, and puts what it found in place in
   * one step: a pick in the meantime sees the last check whole, never part of the next. One
   * sentence in the log -- how many answer, and each one that does not with its reason.
   */
  async refresh(): Promise<void> {
    const { servers } = this.list()
    const results = await Promise.allSettled(servers.map((server) => this.probe(server)))
    const checkedAt = new Date()
    // What was handed out stays with its server -- read now, not before the check, so that the
    // picks made while it ran count as well.
    const picks = new Map<string, number>(
      this.states.map((state) => [state.server.host, state.picks]),
    )
    this.states = servers.map((server, index): ChatVideoServerState => {
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
        server,
        ok: reason === null,
        reason,
        checkedAt,
        latencyMs,
        picks: picks.get(server.host) ?? 0,
      }
    })
    const failed = this.states.filter((state) => !state.ok)
    const which = failed.map((state) => `${state.server.host} ${state.reason}`).join(', ')
    logger.info(
      `chat video servers: ${this.states.length - failed.length} of ${this.states.length} answer${which ? ` -- ${which}` : ''}`,
    )
  }

  /**
   * One of the servers that passed the last check, each of them equally likely, counted in its
   * picks; null where none did -- before the first check is through as well, and where the last
   * check is older than CHAT_VIDEO_CHECK_MAX_AGE_MS because the checks after it failed.
   */
  pick(): ChatVideoServerState | null {
    const now = Date.now()
    const answering = this.states.filter(
      (state) => state.ok && now - state.checkedAt.getTime() <= CHAT_VIDEO_CHECK_MAX_AGE_MS,
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

/** The one pool of the process: started from index.ts, read by chatVideoRoom. */
export const chatVideoServerPool = new ChatVideoServerPool()

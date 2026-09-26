// AI-GENERATED — not an architecture reference
import { randomInt } from 'node:crypto'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { Result } from 'shared'
import { httpAgent, httpsAgent } from '@/apis/ConnectionAgents'
import { ChatVideoServer } from '@/data/ChatVideoServer.logic'
import {
  boshSessionRequest,
  evaluateBoshFeatures,
  evaluateJitsiConfig,
  JitsiProbeError,
  JitsiProbeFailure,
} from './jitsiProbe.logic'

/** How long each of the two requests may take, all of it. */
export const JITSI_PROBE_TIMEOUT_MS = 5000

// config.js of a Jitsi server runs to about 80 KB; no answer is read beyond this.
const JITSI_PROBE_MAX_BYTES = 1_000_000

/** What a server that passed the check answered with. */
export interface JitsiProbeAnswer {
  /** How long its two answers took together. */
  latencyMs: number
}

const REQUEST_OPTIONS: AxiosRequestConfig = {
  httpAgent,
  httpsAgent,
  timeout: JITSI_PROBE_TIMEOUT_MS,
  responseType: 'text',
  // axios 0.21 parses every answer that reads as JSON, whatever responseType says
  // (transitional.forcedJSONParsing); the check wants the text as it came.
  transformResponse: (data: unknown) => data,
  // Every status is an answer here; which one will do, the check decides.
  validateStatus: () => true,
  maxContentLength: JITSI_PROBE_MAX_BYTES,
}

const textOf = (response: AxiosResponse<unknown>): string =>
  typeof response.data === 'string' ? response.data : ''

/**
 * One request, with a deadline for the whole of it. axios' own `timeout` becomes Node's socket
 * timeout, which counts idle time on a connected socket: a server that answers a little at a
 * time would hold the check open far longer, and the check waits for its slowest server before
 * any server's state changes. Whatever the request throws comes back as its message.
 */
const withinDeadline = async (
  send: (options: AxiosRequestConfig) => Promise<AxiosResponse<unknown>>,
): Promise<Result<AxiosResponse<unknown>, string>> => {
  const source = axios.CancelToken.source()
  const deadline = setTimeout(
    () => source.cancel(`no complete answer within ${JITSI_PROBE_TIMEOUT_MS} ms`),
    JITSI_PROBE_TIMEOUT_MS,
  )
  try {
    return { success: true, value: await send({ ...REQUEST_OPTIONS, cancelToken: source.token }) }
  } catch (error) {
    const message = (error as { message?: unknown } | null)?.message
    return { success: false, error: typeof message === 'string' ? message : String(error) }
  } finally {
    clearTimeout(deadline)
  }
}

/**
 * Whether a room on `server` opens for anybody, without an account -- the check the pool runs
 * every ten minutes (Chat/Notiz-2026-09-23 §11, measured on 25.09.2026). Two requests, one after
 * the other:
 * 1. `config.js`: a Jitsi configuration, no active anonymousdomain or tokenAuthUrl, and the XMPP
 *    domain -- where it names none, the server's host.
 * 2. `http-bind`: the first request of an XMPP session over BOSH, and ANONYMOUS among the ways
 *    in. Both, because config.js does not show what the XMPP server asks for, and BOSH does not
 *    show where config.js sends people: jitsi.debian.social offers ANONYMOUS and still sends
 *    everybody to a login.
 *
 * Never throws: a server that does not answer is an expected case. The reason says what failed.
 */
export async function probeJitsiServer(
  server: ChatVideoServer,
): Promise<Result<JitsiProbeAnswer, JitsiProbeError>> {
  const started = Date.now()
  const failure = (reason: JitsiProbeFailure, detail: string) => ({
    success: false as const,
    error: new JitsiProbeError(server.host, reason, detail),
  })

  const config = await withinDeadline((options) => axios.get(`${server.baseUrl}config.js`, options))
  if (!config.success) {
    return failure('UNREACHABLE', config.error)
  }
  if (config.value.status !== 200) {
    return failure('NOT_JITSI', `config.js answered ${config.value.status}`)
  }
  const configFacts = evaluateJitsiConfig(textOf(config.value))
  if (!configFacts.success) {
    return failure(configFacts.error, 'config.js')
  }

  const domain = configFacts.value.domain ?? new URL(server.baseUrl).hostname
  const bosh = await withinDeadline((options) =>
    axios.post(
      `${server.baseUrl}http-bind`,
      // A request id as XEP-0124 wants one: random, and far below 2^53.
      boshSessionRequest(domain, randomInt(1, 2 ** 31)),
      { ...options, headers: { 'Content-Type': 'text/xml; charset=utf-8' } },
    ),
  )
  if (!bosh.success) {
    return failure('NO_BOSH', bosh.error)
  }
  if (bosh.value.status !== 200) {
    return failure('NO_BOSH', `http-bind answered ${bosh.value.status}`)
  }
  const features = evaluateBoshFeatures(textOf(bosh.value))
  if (!features.success) {
    return failure(features.error, 'http-bind')
  }
  return { success: true, value: { latencyMs: Date.now() - started } }
}

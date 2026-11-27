import { lookup as dnsLookup, type LookupAddress } from 'node:dns'
import http from 'node:http'
import https from 'node:https'
import { isIP, type LookupFunction } from 'node:net'
import { Readable } from 'node:stream'
import { isPublicHostname } from 'shared'
import { peerHttpAgent, peerHttpsAgent } from '../apis/ConnectionAgents'

/** A peer's host is, or resolves to, an address that is not on the internet. */
export class NotPublicAddressError extends Error {
  constructor(hostname: string, address: string) {
    super(`${hostname} is ${address}, not a public address`)
    this.name = 'NotPublicAddressError'
  }
}

// statuses a Response must have no body for
const NULL_BODY_STATUSES = [101, 204, 205, 304]

/**
 * fetch for a request to another community, as far as the ApiClient uses it, that reaches the
 * internet only.
 *
 * - The host is resolved when the connection is made, and the request fails if any of its
 *   addresses is not public. The connection goes to exactly the address checked: a name that
 *   resolves to another address a moment later (DNS rebinding) changes nothing. Host header and
 *   TLS server name stay the name of the url. A kept-alive connection to the same host and port
 *   is used again, without a new lookup: it goes to the address checked when it was opened.
 * - A redirect is not followed: it comes back as the answer it is, and the ApiClient takes it
 *   as a failed one. So a public url cannot pass the request on to an address of the local
 *   network.
 *
 * @param isAllowed whether an address may be connected to; another one for tests only
 */
export async function publicFetch(
  request: Request,
  isAllowed: (address: string) => boolean = isPublicHostname,
): Promise<Response> {
  const url = new URL(request.url)
  const hostname = url.hostname.replace(/^\[(.*)\]$/, '$1')
  // an address in the url is connected to without a lookup
  if (isIP(hostname) && !isAllowed(hostname)) {
    throw new NotPublicAddressError(hostname, hostname)
  }
  const lookup: LookupFunction = (name, options, callback) => {
    dnsLookup(name, { ...options, all: true }, (error, addresses: LookupAddress[]) => {
      if (error) {
        callback(error, '', 0)
        return
      }
      const refused = addresses.find(({ address }) => !isAllowed(address))
      if (refused) {
        callback(new NotPublicAddressError(name, refused.address), '', 0)
        return
      }
      if (options.all) {
        ;(callback as unknown as (error: null, addresses: LookupAddress[]) => void)(null, addresses)
        return
      }
      callback(null, addresses[0].address, addresses[0].family)
    })
  }
  const body = Buffer.from(await request.arrayBuffer())
  const headers = Object.fromEntries(request.headers)
  if (body.length > 0) {
    headers['content-length'] = String(body.length)
  }
  const [send, agent] =
    url.protocol === 'https:' ? [https.request, peerHttpsAgent] : [http.request, peerHttpAgent]

  return new Promise<Response>((resolve, reject) => {
    // as fetch: an aborted signal rejects with its reason, a TimeoutError for the time limit
    const abort = () => {
      reject(request.signal.reason)
      outgoing.destroy()
    }
    const outgoing = send(
      {
        protocol: url.protocol,
        host: hostname,
        port: url.port || undefined,
        path: `${url.pathname}${url.search}`,
        method: request.method,
        headers,
        agent,
        lookup,
      },
      (incoming) => {
        request.signal.removeEventListener('abort', abort)
        const status = incoming.statusCode ?? 0
        const responseHeaders = new Headers()
        for (const [name, value] of Object.entries(incoming.headers)) {
          for (const one of Array.isArray(value) ? value : value === undefined ? [] : [value]) {
            responseHeaders.append(name, one)
          }
        }
        const responseBody = NULL_BODY_STATUSES.includes(status)
          ? null
          : // the web stream of node:stream, of the same kind as the one Response takes
            (Readable.toWeb(incoming) as unknown as ReadableStream<Uint8Array>)
        if (!responseBody) {
          incoming.resume()
        }
        resolve(new Response(responseBody, { status, headers: responseHeaders }))
      },
    )
    if (request.signal.aborted) {
      abort()
      return
    }
    request.signal.addEventListener('abort', abort, { once: true })
    outgoing.on('error', (error) => {
      request.signal.removeEventListener('abort', abort)
      reject(error)
    })
    outgoing.end(body)
  })
}

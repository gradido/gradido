import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { peerHttpAgent } from '../apis/ConnectionAgents'
import { NotPublicAddressError, publicFetch } from './publicFetch'

// A server on this machine: the default refuses it, as it does every address of the local network.
// To see a request go through, a test allows every address.
const allowAll = () => true

let port: number
let socketPorts: (number | undefined)[] = []
let received: { method?: string; url?: string; host?: string; body: string }[] = []
let answer: (response: http.ServerResponse) => void
const server = http.createServer((request, response) => {
  let body = ''
  request.on('data', (chunk) => {
    body += chunk
  })
  request.on('end', () => {
    received.push({ method: request.method, url: request.url, host: request.headers.host, body })
    socketPorts.push(request.socket.remotePort)
    answer(response)
  })
})

beforeAll(async () => {
  // both families: localhost may resolve to ::1 or to 127.0.0.1
  await new Promise<void>((resolve) => server.listen(0, '::', resolve))
  port = (server.address() as AddressInfo).port
})
afterAll(() => {
  server.close()
})
beforeEach(() => {
  received = []
  socketPorts = []
  answer = (response) => {
    response.setHeader('content-type', 'application/json')
    response.end('{"answer":42}')
  }
})

describe('publicFetch', () => {
  it('refuses a name that resolves to this machine, before anything is sent', async () => {
    const request = new Request(`http://localhost:${port}/peer-api/v1/communityInfos`)

    await expect(publicFetch(request)).rejects.toBeInstanceOf(NotPublicAddressError)
    expect(received).toEqual([])
  })

  it.each([
    ['an IPv4 address', '127.0.0.1'],
    ['an IPv6 address', '[::1]'],
  ])('refuses %s of this machine in the url, before anything is sent', async (_, host) => {
    const request = new Request(`http://${host}:${port}/peer-api/v1/communityInfos`)

    await expect(publicFetch(request)).rejects.toBeInstanceOf(NotPublicAddressError)
    expect(received).toEqual([])
  })

  it('sends method, path, query, host and body, and hands out the answer', async () => {
    const request = new Request(`http://localhost:${port}/peer-api/v1/prepare?x=1`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"question":true}',
    })

    const response = await publicFetch(request, allowAll)

    expect(received).toEqual([
      {
        method: 'POST',
        url: '/peer-api/v1/prepare?x=1',
        host: `localhost:${port}`,
        body: '{"question":true}',
      },
    ])
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/json')
    expect(await response.json()).toEqual({ answer: 42 })
  })

  it('sends the next request over the connection kept alive, of its own agent', async () => {
    for (let i = 0; i < 3; i++) {
      await (await publicFetch(new Request(`http://localhost:${port}/`), allowAll)).text()
    }

    // one socket, so one port on the client's side
    expect(new Set(socketPorts).size).toBe(1)
    // not in the agent of everything else, whose sockets went through no check
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(Object.keys(peerHttpAgent.freeSockets)).toContain(`localhost:${port}:`)
    expect(Object.keys(http.globalAgent.freeSockets)).toEqual([])
  })

  it('does not follow a redirect, it hands it out as the answer', async () => {
    answer = (response) => {
      response.writeHead(302, { location: 'http://169.254.169.254/latest/meta-data/' })
      response.end()
    }

    const response = await publicFetch(new Request(`http://localhost:${port}/`), allowAll)

    expect(response.status).toBe(302)
    expect(response.ok).toBe(false)
    expect(received).toHaveLength(1)
  })

  it('gives up on an aborted signal with its reason, as fetch does', async () => {
    answer = () => {
      // never answers
    }
    const request = new Request(`http://localhost:${port}/`, { signal: AbortSignal.timeout(50) })

    await expect(publicFetch(request, allowAll)).rejects.toMatchObject({ name: 'TimeoutError' })
  })
})

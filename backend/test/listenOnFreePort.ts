// AI-GENERATED — not an architecture reference
import { Server } from 'node:http'
import { AnyElysia } from 'elysia'

// Apart from helpers.ts, which pulls in the database and the whole server: a test of one route
// mounts it in an app of its own and may mock what that route imports, `core` among it.
/**
 * Starts an application on a free port of the loopback interface and hands out node's own
 * server once it listens: its address() names the port, close() stops it. The adapter itself
 * names the port it was asked for, which is 0 here.
 */
export const listenOnFreePort = (app: AnyElysia): Promise<Server> =>
  new Promise((resolve) => {
    app.listen({ port: 0, hostname: '127.0.0.1' }, (started) => {
      const server: Server = (started as any).raw.node.server
      if (server.listening) {
        resolve(server)
      } else {
        server.once('listening', () => resolve(server))
      }
    })
  })

import 'reflect-metadata'
import 'source-map-support/register'
import { getHomeCommunityDrizzle } from 'database'
import { getLogger } from 'log4js'
import { AppContext } from 'shared'
import { matchingKeyingRun } from './apis/anthropic/matching/keyingRun'
import { mapMemberCount } from './apis/gms/mapMemberCount'
import { chatVideoServerPool } from './apis/jitsi/chatVideoServerPool'
import { seedChatVideoServers } from './apis/jitsi/seedChatVideoServers'
import { CONFIG } from './config'
import { FOREIGN_AVATAR_DATES_REFRESH_MS } from './data/MemberAvatars.logic'
import { startRefreshForeignMemberAvatarDates } from './federation/refreshForeignMemberAvatarDates'
import { startValidateCommunities } from './federation/validateCommunities'
import { createServer } from './server/createServer'
import { initLogging } from './server/logger'

async function main() {
  initLogging()
  // The secrets every password and PIN derivation is keyed with, and the hashing threads.
  // A second init -- the tests initialize it first, at a lower difficulty -- changes nothing.
  AppContext.getInstance().init({
    appSecret: CONFIG.LOGIN_APP_SECRET,
    serverKey: CONFIG.LOGIN_SERVER_KEY,
  })
  const { app } = await createServer(getLogger('apollo'))

  // will throw if a home community is missing
  await getHomeCommunityDrizzle()

  // The node adapter with two of its defaults turned off, which express did not have:
  // - reusePort: a second backend on the same port has to fail to start, not share the port.
  // - gracefulShutdown: it takes SIGINT and SIGTERM for itself and closes the server only --
  //   with the timers below still running, the process would never end.
  // Neither is an option of Bun, which is what Elysia's types name.
  const options = { port: CONFIG.BACKEND_PORT, reusePort: false, gracefulShutdown: false }
  // The adapter calls back before the port is bound and keeps a failure to itself: ready()
  // of the server underneath is what says so. A port already taken ends the start.
  const started = await new Promise<{ raw: { ready(): Promise<unknown> } }>((resolve) => {
    app.listen(options as object, (server: unknown) => resolve(server as never))
  })
  await started.raw.ready()
  // biome-ignore lint/suspicious/noConsole: no need for logging the start message
  console.log(`Server is running at http://localhost:${CONFIG.BACKEND_PORT}`)
  await startValidateCommunities(Number(CONFIG.FEDERATION_VALIDATE_COMMUNITY_TIMER))
  // When the members of other communities last changed their pictures (AS-019): what lets the
  // lists show their faces. The first run comes one interval after the start.
  startRefreshForeignMemberAvatarDates(FOREIGN_AVATAR_DATES_REFRESH_MS)
  // Works out the words a matching entry can be found under, in the background. Does
  // nothing at all without an Anthropic key or without the GMS, and nothing is lost
  // by that: entries are stored and served either way, they are just not yet
  // findable by word.
  matchingKeyingRun.start()
  // How many members stand on the map, for the invitation on the wallet's overview: the GMS
  // is asked now and every quarter of an hour, in the background -- the query mapMemberCount
  // only reads what the last answer said. Nothing at all without the GMS.
  mapMemberCount.start()
  // The chat's video servers: the list is filled once where it is still empty (from
  // CHAT_VIDEO_SERVERS or the default list), then checked now and every ten minutes, in the
  // background -- the query chatVideoRoom only reads what the last check found and never waits
  // for a server.
  await seedChatVideoServers()
  chatVideoServerPool.start()
}

main().catch((e) => {
  // biome-ignore lint/suspicious/noConsole: maybe logger isn't initialized here
  console.error(e)
  throw e
})

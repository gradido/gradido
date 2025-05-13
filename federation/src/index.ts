import { createServer } from './server/createServer'

// config
import { CONFIG } from './config'

async function main() {
  // biome-ignore lint/suspicious/noConsole: no logger needed fot startup infos
  console.log(`FEDERATION_PORT=${CONFIG.FEDERATION_PORT}`)
  // biome-ignore lint/suspicious/noConsole: no logger needed fot startup infos
  console.log(`FEDERATION_API=${CONFIG.FEDERATION_API}`)
  const { app } = await createServer()

  app.listen(CONFIG.FEDERATION_PORT, () => {
    // biome-ignore lint/suspicious/noConsole: no logger needed fot startup infos
    console.log(`Server is running at http://localhost:${CONFIG.FEDERATION_PORT}`)
    if (CONFIG.GRAPHIQL) {
      // biome-ignore lint/suspicious/noConsole: no logger needed fot startup infos
      console.log(
        `GraphIQL available at ${CONFIG.FEDERATION_COMMUNITY_URL}/api/${CONFIG.FEDERATION_API}`,
      )
    }
  })
}

main().catch((e) => {
  // biome-ignore lint/suspicious/noConsole: no logger present
  console.error(e)
  process.exit(1)
})

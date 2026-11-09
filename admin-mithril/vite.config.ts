// AI-GENERATED — not an architecture reference
import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { browserUrls, validate } from 'config-schema'
import dotenv from 'dotenv'
import Icons from 'unplugin-icons/vite'
import { defineConfig } from 'vite'
import EnvironmentPlugin from 'vite-plugin-environment'
import { vitePluginGraphqlLoader } from 'vite-plugin-graphql-loader'

dotenv.config()

export default defineConfig(async ({ command }) => {
  // read by the config of the old admin (../admin/src/config) before it parses the environment
  process.env.ADMIN_HOSTING = command === 'serve' ? 'nodejs' : 'nginx'
  // next to the old admin on 8080 while both exist
  process.env.ADMIN_MODULE_PORT ??= '8081'
  if (existsSync('../.git')) {
    process.env.BUILD_COMMIT = execSync('git rev-parse HEAD').toString().trim()
  }
  const { CONFIG } = await import('../admin/src/config')
  // all urls used in the browser with the same protocol, against mixed content errors
  validate(browserUrls, [CONFIG.COMMUNITY_URL, CONFIG.GRAPHQL_URI, CONFIG.WALLET_URL])

  return {
    base: '/admin/',
    server: { host: CONFIG.ADMIN_MODULE_HOST, port: CONFIG.ADMIN_MODULE_PORT, strictPort: true },
    preview: { host: CONFIG.ADMIN_MODULE_HOST, port: CONFIG.ADMIN_MODULE_PORT },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        // the old admin's files that do not depend on Vue, read from there until the switch
        '@admin': path.resolve(__dirname, '../admin/src'),
      },
    },
    plugins: [
      // an icon as the text of its SVG, for m.trust
      Icons({ compiler: 'raw' }),
      // the old admin's .graphql documents, each operation under its own name
      vitePluginGraphqlLoader(),
      // the same variables as the old admin hands to the browser (../admin/vite.config.mjs)
      EnvironmentPlugin({
        BUILD_COMMIT: CONFIG.BUILD_COMMIT ?? undefined,
        PORT: CONFIG.ADMIN_MODULE_PORT ?? null,
        COMMUNITY_HOST: CONFIG.ADMIN_MODULE_HOST ?? null,
        COMMUNITY_NAME: CONFIG.COMMUNITY_NAME,
        COMMUNITY_URL: CONFIG.COMMUNITY_URL ?? null,
        URL_PROTOCOL: CONFIG.ADMIN_MODULE_PROTOCOL ?? null,
        GRAPHQL_URL: CONFIG.GRAPHQL_URI ?? null,
        GRAPHQL_PATH: process.env.GRAPHQL_PATH ?? '/graphql',
        WALLET_URL: CONFIG.WALLET_URL ?? null,
        WALLET_AUTH_PATH: CONFIG.WALLET_AUTH_PATH,
        WALLET_LOGIN_PATH: CONFIG.WALLET_LOGIN_PATH,
        DEBUG_DISABLE_AUTH: CONFIG.DEBUG_DISABLE_AUTH ?? null,
        ANTHROPIC_ACTIVE: CONFIG.ANTHROPIC_ACTIVE ?? null,
        HUMHUB_ACTIVE: CONFIG.HUMHUB_ACTIVE ?? null,
        HUMHUB_API_URL: CONFIG.HUMHUB_API_URL ?? null,
      }),
    ],
    build: { outDir: path.resolve(__dirname, './build') },
  }
})

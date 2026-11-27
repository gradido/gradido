// AI-GENERATED — not an architecture reference
import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { browserUrls, validate } from 'config-schema'
import dotenv from 'dotenv'
import Icons from 'unplugin-icons/vite'
import { defineConfig } from 'vite'
import commonjs from 'vite-plugin-commonjs'
import EnvironmentPlugin from 'vite-plugin-environment'
import { vitePluginGraphqlLoader } from 'vite-plugin-graphql-loader'
import { createHtmlPlugin } from 'vite-plugin-html'

// Its own .env first (a port of its own, where one is needed), then the old wallet's: every other
// setting is the same wallet's, and is kept there until the switch. dotenv never overwrites.
dotenv.config()
// next to the old wallet on 3000 while both exist
process.env.FRONTEND_MODULE_PORT ??= '3001'
dotenv.config({ path: '../frontend/.env' })

const require = createRequire(import.meta.url)
const frontend = path.resolve(__dirname, '../frontend')

export default defineConfig(({ command }) => {
  // both read by the config of the old wallet (../frontend/src/config) before it parses the environment
  process.env.FRONTEND_HOSTING = command === 'serve' ? 'nodejs' : 'nginx'
  if (existsSync('../.git')) {
    process.env.BUILD_COMMIT = execSync('git rev-parse HEAD').toString().trim()
  }
  const CONFIG = require('../frontend/src/config')
  // all urls used in the browser with the same protocol, against mixed content errors
  validate(browserUrls, [
    CONFIG.ADMIN_AUTH_URL,
    CONFIG.COMMUNITY_URL,
    CONFIG.COMMUNITY_REGISTER_URL,
    CONFIG.GRAPHQL_URI,
    CONFIG.FRONTEND_MODULE_URL,
  ])

  return {
    // favicon, fonts, manifest and pictures: the old wallet's, served from where they lie
    publicDir: path.join(frontend, 'public'),
    server: {
      host: CONFIG.FRONTEND_MODULE_HOST,
      port: CONFIG.FRONTEND_MODULE_PORT,
      strictPort: true,
      // the old wallet's sources lie outside this folder
      fs: { allow: ['..'] },
    },
    preview: { host: CONFIG.FRONTEND_MODULE_HOST, port: CONFIG.FRONTEND_MODULE_PORT },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        // the old wallet's files that do not depend on Vue, read from there until the switch
        '@frontend': path.join(frontend, 'src'),
      },
    },
    plugins: [
      // author and URL of the meta tags, and the page without its comments in a build
      createHtmlPlugin({
        minify: CONFIG.PRODUCTION === true,
        inject: {
          data: { VITE_META_AUTHOR: CONFIG.META_AUTHOR, VITE_META_URL: CONFIG.META_URL },
        },
      }),
      // the same variables as the old wallet hands to the browser (../frontend/vite.config.mjs)
      EnvironmentPlugin({
        // worked out from AUTO_POLL_INTERVAL_SECONDS already, so the browser gets no second one
        AUTO_POLL_INTERVAL: CONFIG.AUTO_POLL_INTERVAL,
        AUTO_POLL_INTERVAL_SECONDS: null,
        BUILD_COMMIT: CONFIG.BUILD_COMMIT,
        CROSS_TX_REDEEM_LINK_ACTIVE: CONFIG.CROSS_TX_REDEEM_LINK_ACTIVE,
        DLT_ACTIVE: CONFIG.DLT_ACTIVE,
        GMS_ACTIVE: CONFIG.GMS_ACTIVE,
        MATCHING_ACTIVE: CONFIG.MATCHING_ACTIVE,
        HUMHUB_ACTIVE: CONFIG.HUMHUB_ACTIVE,
        PORT: null,
        COMMUNITY_HOST: null,
        URL_PROTOCOL: null,
        COMMUNITY_URL: CONFIG.COMMUNITY_URL,
        GRAPHQL_PATH: null,
        GRAPHQL_URI: CONFIG.GRAPHQL_URI,
        ADMIN_AUTH_PATH: CONFIG.ADMIN_AUTH_PATH ?? null,
        ADMIN_AUTH_URL: CONFIG.ADMIN_AUTH_URL,
        COMMUNITY_NAME: CONFIG.COMMUNITY_NAME,
        COMMUNITY_REGISTER_PATH: null,
        COMMUNITY_REGISTER_URL: null,
        COMMUNITY_DESCRIPTION: null,
        COMMUNITY_SUPPORT_MAIL: null,
        COMMUNITY_LOCATION: CONFIG.COMMUNITY_LOCATION,
        MAP_TILES_URL: CONFIG.MAP_TILES_URL,
        MAP_ASSETS_URL: CONFIG.MAP_ASSETS_URL,
        META_URL: null,
        META_AUTHOR: null,
      }),
      // the old wallet's .graphql documents, each operation under its own name
      vitePluginGraphqlLoader(),
      // `~icons/<set>/<name>` is the icon's SVG as text (components/icon.ts)
      Icons({ compiler: 'raw' }),
      // the old wallet's config is CommonJS (../frontend/src/config), read by this file too
      commonjs(),
    ],
    // As the old wallet builds its styles, so that the same rules reach the browser. The scss
    // options are for the components' own *.module.scss; gradido.scss is compiled ahead (main.ts).
    css: {
      transformer: 'lightningcss' as const,
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@frontend/assets/scss/custom/gradido-custom/color" as *;`,
        },
      },
    },
    build: {
      outDir: path.resolve(__dirname, './build'),
      cssMinify: 'lightningcss' as const,
      sourcemap: CONFIG.DEBUG,
    },
  }
})

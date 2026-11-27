// AI-GENERATED — not an architecture reference
import { execFileSync, execSync, spawnSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { browserUrls, validate } from 'config-schema'
import dotenv from 'dotenv'
import { PurgeCSS } from 'purgecss'
import * as sass from 'sass'
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
// grass is a binary of its own (cargo install grass); without it Dart Sass compiles
const hasGrass = spawnSync('grass', ['--version']).status === 0

/** In grass where it is installed (0.2 s against Dart Sass's 1 s), as the old wallet's compile-scss. */
function compileSass(file: string, watch: (read: string) => void) {
  const nodeModules = path.resolve(__dirname, '../node_modules')
  if (hasGrass) {
    // grass names no file it read: every file beside it is watched
    for (const read of readdirSync(path.dirname(file), { recursive: true })) {
      watch(path.join(path.dirname(file), String(read)))
    }
    return execFileSync('grass', ['--quiet', '-I', nodeModules, file]).toString()
  }
  const compiled = sass.compile(file, {
    loadPaths: [nodeModules],
    // as the old wallet's compile-scss: Bootstrap 5.3 is written with @import
    silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
  })
  for (const read of compiled.loadedUrls) {
    watch(fileURLToPath(read))
  }
  return compiled.css
}

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
      // `~icons/<set>/<name>` is the icon's SVG as text (components/ui/icon.ts)
      Icons({ compiler: 'raw' }),
      // the old wallet's config is CommonJS (../frontend/src/config), read by this file too
      commonjs(),
      // The global styles (styles/gradido.scss) are Sass, written against Bootstrap's sources.
      // With lightningcss as the transformer Vite runs no preprocessor, so Sass runs here,
      // before it; the styles of the components are plain CSS.
      {
        name: 'sass',
        enforce: 'pre' as const,
        async transform(_code: string, id: string) {
          if (!id.endsWith('.scss')) {
            return undefined
          }
          const css = compileSass(id, (file) => this.addWatchFile(file))
          if (command !== 'build') {
            return { code: css, map: null }
          }
          // Out go the rules whose classes no page names: most of Bootstrap. So a class is
          // written whole, never put together (`btn-${variant}`). Here, before the bundle,
          // so the file's name is the hash of what is left.
          const [purged] = await new PurgeCSS().purge({
            content: [path.resolve(__dirname, 'index.html'), path.resolve(__dirname, 'src/**/*.ts')],
            skippedContentGlobs: ['**/*.test.ts'],
            css: [{ raw: css }],
          })
          return { code: purged.css, map: null }
        },
      },
    ],
    // The styles are copies of the old wallet's; the specs hold the two pictures equal
    // (tests/fixtures/picture.ts).
    css: {
      transformer: 'lightningcss' as const,
    },
    build: {
      outDir: path.resolve(__dirname, './build'),
      cssMinify: 'lightningcss' as const,
      sourcemap: CONFIG.DEBUG,
    },
  }
})

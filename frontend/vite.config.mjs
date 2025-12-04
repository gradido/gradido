import { defineConfig } from 'vite'
import path from 'node:path'
import commonjs from 'vite-plugin-commonjs'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import Icons from 'unplugin-icons/vite'
import IconsResolve from 'unplugin-icons/resolver'
import EnvironmentPlugin from 'vite-plugin-environment'
import { createHtmlPlugin } from 'vite-plugin-html'
import schema from './src/config/schema'
import { execSync } from 'node:child_process'
import { existsSync, constants } from 'node:fs'

import { validate, browserUrls } from 'config-schema'

import { BootstrapVueNextResolver } from 'bootstrap-vue-next'
import { createRequire } from 'node:module'
import dotenv from 'dotenv'
dotenv.config() // load env vars from .env

const require = createRequire(import.meta.url)
const CONFIG = require('./src/config')

// https://vitejs.dev/config/
export default defineConfig(async ({ command }) => {
  const { vitePluginGraphqlLoader } = await import('vite-plugin-graphql-loader')
  if (command === 'serve') {
    CONFIG.FRONTEND_HOSTING = 'nodejs'
  } else {
    CONFIG.FRONTEND_HOSTING = 'nginx'
  }
  if (existsSync('../.git', constants.F_OK)) {
    CONFIG.BUILD_COMMIT = execSync('git rev-parse HEAD').toString().trim()
    CONFIG.BUILD_COMMIT_SHORT = (CONFIG.BUILD_COMMIT ?? '0000000').slice(0, 7)
  }
  // Check config
  validate(schema, CONFIG)
  // make sure that all urls used in browser have the same protocol to prevent mixed content errors
  validate(browserUrls, [
    CONFIG.ADMIN_AUTH_URL,
    CONFIG.COMMUNITY_URL,
    CONFIG.COMMUNITY_REGISTER_URL,
    CONFIG.GRAPHQL_URI,
    CONFIG.FRONTEND_MODULE_URL,
  ])

  return {
    server: {
      host: CONFIG.FRONTEND_MODULE_HOST, // '0.0.0.0',
      port: CONFIG.FRONTEND_MODULE_PORT, // 3000,
      https: CONFIG.FRONTEND_MODULE_PROTOCOL === 'https',
      fs: {
        strict: true,
      },
      esbuild: {
        minify: CONFIG.PRODUCTION === true,
      },
    },
    preview: {
      host: CONFIG.FRONTEND_MODULE_HOST, // '0.0.0.0',
      port: CONFIG.FRONTEND_MODULE_PORT, // 3000,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        assets: path.join(__dirname, 'src/assets'),
        '@vee-validate/i18n/dist/locale/en.json': require.resolve(
          '@vee-validate/i18n/dist/locale/en.json',
        ),
        '@vee-validate/i18n/dist/locale/de.json': require.resolve(
          '@vee-validate/i18n/dist/locale/de.json',
        ),
        '@vee-validate/i18n/dist/locale/es.json': require.resolve(
          '@vee-validate/i18n/dist/locale/es.json',
        ),
        '@vee-validate/i18n/dist/locale/fr.json': require.resolve(
          '@vee-validate/i18n/dist/locale/fr.json',
        ),
        '@vee-validate/i18n/dist/locale/nl.json': require.resolve(
          '@vee-validate/i18n/dist/locale/nl.json',
        ),
        '@vee-validate/i18n/dist/locale/tr.json': require.resolve(
          '@vee-validate/i18n/dist/locale/tr.json',
        ),
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    },
    plugins: [
      vue(),
      createHtmlPlugin({
        minify: CONFIG.PRODUCTION === true,
        inject: {
          data: {
            VITE_META_TITLE_DE: CONFIG.META_TITLE_DE,
            VITE_META_TITLE_EN: CONFIG.META_TITLE_EN,
            VITE_META_DESCRIPTION_DE: CONFIG.META_DESCRIPTION_DE,
            VITE_META_DESCRIPTION_EN: CONFIG.META_DESCRIPTION_EN,
            VITE_META_KEYWORDS_DE: CONFIG.META_KEYWORDS_DE,
            VITE_META_KEYWORDS_EN: CONFIG.META_KEYWORDS_EN,
            VITE_META_AUTHOR: CONFIG.META_AUTHOR,
            VITE_META_URL: CONFIG.META_URL,
          },
        },
      }),
      Components({
        resolvers: [BootstrapVueNextResolver(), IconsResolve()],
        dts: true,
      }),
      Icons({
        compiler: 'vue3',
        autoInstall: true,
      }),
      EnvironmentPlugin({
        AUTO_POLL_INTERVAL: CONFIG.AUTO_POLL_INTERVAL,
        BUILD_COMMIT: CONFIG.BUILD_COMMIT,
        CROSS_TX_REDEEM_LINK_ACTIVE: CONFIG.CROSS_TX_REDEEM_LINK_ACTIVE,
        DLT_ACTIVE: CONFIG.DLT_ACTIVE,
        GMS_ACTIVE: CONFIG.GMS_ACTIVE,
        HUMHUB_ACTIVE: CONFIG.HUMHUB_ACTIVE,
        DEFAULT_PUBLISHER_ID: null,
        PORT: null,
        COMMUNITY_HOST: null,
        URL_PROTOCOL: null,
        COMMUNITY_URL: CONFIG.COMMUNITY_URL,
        GRAPHQL_PATH: null,
        GRAPHQL_URI: CONFIG.GRAPHQL_URI, // null,
        ADMIN_AUTH_PATH: CONFIG.ADMIN_AUTH_PATH ?? null, // it is the only env without exported default
        ADMIN_AUTH_URL: CONFIG.ADMIN_AUTH_URL, // null,
        COMMUNITY_NAME: CONFIG.COMMUNITY_NAME,
        COMMUNITY_REGISTER_PATH: null,
        COMMUNITY_REGISTER_URL: null,
        COMMUNITY_DESCRIPTION: null,
        COMMUNITY_SUPPORT_MAIL: null,
        META_URL: null,
        META_TITLE_DE: null,
        META_TITLE_EN: null,
        META_DESCRIPTION_DE: null,
        META_DESCRIPTION_EN: null,
        META_KEYWORDS_DE: null,
        META_KEYWORDS_EN: null,
        META_AUTHOR: null,
      }),
      vitePluginGraphqlLoader(),
      commonjs(),
    ],
    css: {
      extract: CONFIG.PRODUCTION === true,
      transformer: 'lightningcss',
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/assets/scss/custom/gradido-custom/color" as *;`,
        },
      },
    },
    build: {
      outDir: path.resolve(__dirname, './build'),
      chunkSizeWarningLimit: 1600,
      minify: 'esbuild',
      cssMinify: 'lightningcss',
      sourcemap: CONFIG.DEBUG,
    },
  }
})

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import commonjs from 'vite-plugin-commonjs'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'
import IconsResolve from 'unplugin-icons/resolver'
import { BootstrapVueNextResolver } from 'bootstrap-vue-next'
import EnvironmentPlugin from 'vite-plugin-environment'

import schema from './src/config/schema'

import { execSync } from 'node:child_process'
import { existsSync, constants } from 'node:fs'

import { validate, browserUrls } from 'config-schema'

import path from 'node:path'
import { createRequire } from 'node:module'
import dotenv from 'dotenv'
dotenv.config() // load env vars from .env

const require = createRequire(import.meta.url)
const CONFIG = require('./src/config')

export default defineConfig(async ({ command }) => {
  const { vitePluginGraphqlLoader } = await import('vite-plugin-graphql-loader')
  if (command === 'serve') {
    CONFIG.ADMIN_HOSTING = 'nodejs'
  } else {
    CONFIG.ADMIN_HOSTING = 'nginx'
  }
  if (existsSync('../.git', constants.F_OK)) {
    CONFIG.BUILD_COMMIT = execSync('git rev-parse HEAD').toString().trim()
    CONFIG.BUILD_COMMIT_SHORT = (CONFIG.BUILD_COMMIT ?? '0000000').slice(0, 7)
  }
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
    base: '/admin/',
    server: {
      host: CONFIG.ADMIN_MODULE_HOST, // '0.0.0.0',
      port: CONFIG.ADMIN_MODULE_PORT, // 8080,
    },
    preview: {
      host: CONFIG.ADMIN_MODULE_HOST, // '0.0.0.0',
      port: CONFIG.ADMIN_MODULE_PORT, // 8080,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        assets: path.join(__dirname, 'src/assets'),
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    },

    plugins: [
      vue({
        template: {
          compilerOptions: {
            compatConfig: {
              MODE: 2,
            },
          },
        },
      }),
      Components({
        resolvers: [IconsResolve(), BootstrapVueNextResolver()],
        dts: true,
      }),
      Icons({
        compiler: 'vue3',
      }),
      EnvironmentPlugin({
        BUILD_COMMIT: CONFIG.BUILD_COMMIT ?? undefined,
        PORT: CONFIG.ADMIN_MODULE_PORT ?? null, // null,
        COMMUNITY_HOST: CONFIG.ADMIN_MODULE_HOST ?? null, // null,
        COMMUNITY_URL: CONFIG.COMMUNITY_URL ?? null,
        URL_PROTOCOL: CONFIG.ADMIN_MODULE_PROTOCOL ?? null, // null,
        WALLET_AUTH_URL: CONFIG.WALLET_AUTH_URL ?? null,
        GRAPHQL_URL: CONFIG.GRAPHQL_URI ?? null, // null,
        GRAPHQL_PATH: process.env.GRAPHQL_PATH ?? '/graphql', // null,
        WALLET_AUTH_PATH: CONFIG.WALLET_AUTH_PATH ?? null,
        WALLET_LOGIN_PATH: CONFIG.WALLET_LOGIN_URL ?? null, // null,
        DEBUG_DISABLE_AUTH: CONFIG.DEBUG_DISABLE_AUTH ?? null, // null,
        OPENAI_ACTIVE: CONFIG.OPENAI_ACTIVE ?? null, // null,
        HUMHUB_ACTIVE: CONFIG.HUMHUB_ACTIVE ?? null, // null,
        HUMHUB_API_URL: CONFIG.HUMHUB_API_URL ?? null, // null,
        // CONFIG_VERSION: CONFIG.CONFIG_VERSION, // null,
      }),
      vitePluginGraphqlLoader(),
      commonjs(),
    ],
    css: {
      extract: CONFIG.PRODUCTION === true,
      transformer: 'lightningcss',
    },
    build: {
      outDir: path.resolve(__dirname, './build'),
      chunkSizeWarningLimit: 1600,
      cssMinify: 'lightningcss',
    },
    publicDir: '/admin',
  }
})

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import commonjs from 'vite-plugin-commonjs'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'
import IconsResolve from 'unplugin-icons/resolver'
import { BootstrapVueNextResolver } from 'bootstrap-vue-next'
import EnvironmentPlugin from 'vite-plugin-environment'

import dotenv from 'dotenv'

dotenv.config() // load env vars from .env

const CONFIG = require('./src/config')

const path = require('path')

export default defineConfig({
  base: '/admin/',
  server: {
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
      BUILD_COMMIT: null,
      PORT: null,
      COMMUNITY_HOST: null,
      URL_PROTOCOL: null,
      WALLET_URL: null,
      GRAPHQL_URL: null,
      GRAPHQL_PATH: null,
      WALLET_AUTH_PATH: null,
      WALLET_LOGIN_PATH: null,
      DEBUG_DISABLE_AUTH: null,
      CONFIG_VERSION: null,
    }),
    commonjs(),
  ],
  build: {
    outDir: path.resolve(__dirname, './build'),
    chunkSizeWarningLimit: 1600,
  },
  publicDir: '/admin',
})

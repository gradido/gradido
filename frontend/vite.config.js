import { defineConfig } from 'vite'
// import { fileURLToPath, URL } from 'url';
import path from 'path'
import commonjs from 'vite-plugin-commonjs'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import Icons from 'unplugin-icons/vite'
import IconsResolve from 'unplugin-icons/resolver'
import EnvironmentPlugin from 'vite-plugin-environment'

import { BootstrapVueNextResolver } from 'bootstrap-vue-next'

// const path = require('path')

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  resolve: {
    alias: {
      vue: '@vue/compat',
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
      resolvers: [BootstrapVueNextResolver(), IconsResolve()],
      dts: true,
    }),
    Icons({
      compiler: 'vue3',
      autoInstall: true,
    }),
    EnvironmentPlugin({
      BUILD_COMMIT: null,
      GMS_ACTIVE: null,
      HUMHUB_ACTIVE: null,
      NODE_ENV: null,
      DEFAULT_PUBLISHER_ID: null,
      PORT: null,
      COMMUNITY_HOST: null,
      URL_PROTOCOL: null,
      COMMUNITY_URL: null,
      GRAPHQL_PATH: null,
      ADMIN_AUTH_PATH: null,
      COMMUNITY_NAME: null,
      COMMUNITY_REGISTER_PATH: null,
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
      CONFIG_VERSION: null,
    }),
    commonjs(),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/assets/scss/gradido.scss";`,
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, './build'),
  },
})

import { defineConfig } from 'vite'
import path from 'path'
import commonjs from 'vite-plugin-commonjs'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import Icons from 'unplugin-icons/vite'
import IconsResolve from 'unplugin-icons/resolver'
import EnvironmentPlugin from 'vite-plugin-environment'
import { createHtmlPlugin } from 'vite-plugin-html'

import { BootstrapVueNextResolver } from 'bootstrap-vue-next'
import CONFIG from './src/config'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      assets: path.join(__dirname, 'src/assets'),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
  },
  plugins: [
    vue(),
    createHtmlPlugin({
      minify: true,
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
    extract: true,
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

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import commonjs from 'vite-plugin-commonjs'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'
import IconsResolve from 'unplugin-icons/resolver'
import { BootstrapVueNextResolver } from 'bootstrap-vue-next'
import EnvironmentPlugin from 'vite-plugin-environment'
import purgecss from 'vite-plugin-purgecss'

const path = require('path')

export default defineConfig({
  base: '/admin/',
  server: {
    host: '0.0.0.0',
    port: 8080,
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
    purgecss({
      content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
      defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || [],
    }),
  ],
  build: {
    outDir: path.resolve(__dirname, './build'),
  },
  publicDir: '/admin',
})

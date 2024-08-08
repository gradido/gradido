import { defineConfig } from 'vite'
// import { fileURLToPath, URL } from 'url';
import path from 'path'
import commonjs from 'vite-plugin-commonjs'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import Icons from 'unplugin-icons/vite'
import IconsResolve from 'unplugin-icons/resolver'

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

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import commonjs from 'vite-plugin-commonjs'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'
import IconsResolve from 'unplugin-icons/resolver'
const path = require('path')

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? './' : '/admin',
  server: {
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
      resolvers: [IconsResolve()],
      dts: true,
    }),
    Icons({
      compiler: 'vue3',
    }),
    commonjs(),
  ],
  build: {
    outDir: path.resolve(__dirname, './build'),
  },
  publicDir: '/admin',
})

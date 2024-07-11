import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
import commonjs from "vite-plugin-commonjs";

const path = require('path')

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      assets: path.join(__dirname, 'src/assets'),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
  },
  plugins: [vue(), commonjs()],
})

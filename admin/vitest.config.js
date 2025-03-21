import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import path from 'path'

// export default defineConfig({
//   plugins: [Vue()],
//   test: {
//     globals: true,
//     environment: 'jsdom',
//   },
// })

export default defineConfig(async () => {
  const { vitePluginGraphqlLoader } = await import('vite-plugin-graphql-loader')
  return {
    plugins: [Vue(), vitePluginGraphqlLoader()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./test/vitest.setup.js'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: ['node_modules/**', 'src/assets/**', '**/*.{spec,test}.js'],
        lines: 95,
      },
      include: ['**/?(*.)+(spec|test).js?(x)'],
      moduleNameMapper: {
        '^@/(.*)$': path.resolve(__dirname, './src/$1'),
        '\\.(css|less)$': 'identity-obj-proxy',
      },
      transformMode: {
        web: [/\.[jt]sx$/],
      },
      deps: {
        inline: [/vee-validate/, 'vitest-canvas-mock'],
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    },
  }
})

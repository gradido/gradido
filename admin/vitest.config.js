import { defineConfig } from 'vite'
import path from 'path'
import { availableParallelism } from 'node:os'

export default defineConfig(async () => {
  const { vitePluginGraphqlLoader } = await import('vite-plugin-graphql-loader')
  const { default: VueJsx } = await import('@vitejs/plugin-vue-jsx')
  // resolves the `~icons/…` imports
  const { default: Icons } = await import('unplugin-icons/vite')
  return {
    plugins: [VueJsx(), Icons({ compiler: 'vue3' }), vitePluginGraphqlLoader()],
    test: {
      globals: true,
      environment: 'jsdom',
      // Most of a run went into building a process and a jsdom per spec file. Here every file
      // gets its own vm context inside a shared thread instead, with the files still isolated
      // from each other. Measured for the whole suite: about 6.5s rather than 10.5s on 32
      // cores, 9.5s rather than 20s with four workers.
      // ⚠️ The cap is part of it: with one thread per core on 32 cores the suite took 11s,
      // slower than the forks it replaces.
      pool: 'vmThreads',
      // minThreads has to be given too: its default follows the core count and may not exceed the cap.
      poolOptions: {
        vmThreads: { minThreads: 1, maxThreads: Math.min(8, availableParallelism()) },
      },
      setupFiles: ['./test/vitest.setup.js'],
      // Vitest hands every stylesheet to the tests as an empty string -- an import with
      // `?raw` too. utils/printFont.js hangs the declaration of Open Sans in as a <style>
      // from exactly such an import, so this one file keeps its text.
      css: { include: [/assets\/fonts\/open-sans\/open-sans\.css/] },
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: ['node_modules/**', 'src/assets/**', '**/*.{spec,test}.{js,jsx,ts,tsx}'],
        lines: 95,
      },
      include: ['**/?(*.)+(spec|test).[jt]s?(x)'],
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
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
    },
  }
})

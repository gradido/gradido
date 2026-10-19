import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import path from 'path'
import { availableParallelism } from 'node:os'

export default defineConfig(async () => {
  const { vitePluginGraphqlLoader } = await import('vite-plugin-graphql-loader')
  const { default: VueJsx } = await import('@vitejs/plugin-vue-jsx')
  // resolves the explicit `~icons/…` imports of .tsx files; .vue templates get theirs by name
  // through unplugin-vue-components, which the tests leave out
  const { default: Icons } = await import('unplugin-icons/vite')
  return {
    plugins: [Vue(), VueJsx(), Icons({ compiler: 'vue3' }), vitePluginGraphqlLoader()],
    test: {
      globals: true,
      environment: 'jsdom',
      // Most of a run went into building a process and a jsdom per spec file. Here every file
      // gets its own vm context inside a shared thread instead, with the files still isolated
      // from each other. Measured for the whole suite: about 22s rather than 35-40s on 32
      // cores, 39s rather than 100s with four workers. Twelve threads were the fastest here;
      // one per core was slower again.
      pool: 'vmThreads',
      // minThreads has to be given too: its default follows the core count and may not exceed the cap.
      poolOptions: {
        vmThreads: { minThreads: 1, maxThreads: Math.min(12, availableParallelism()) },
      },
      // ⚠️ Two things a spec cannot do in that pool, and these files do one of them, so they
      // keep a process of their own:
      // - replace window.location (vi.stubGlobal('location', …)): the global there is jsdom's
      //   own window, whose location cannot be redefined;
      // - switch the time zone through process.env.TZ: a thread has only a copy of the
      //   environment, and writing to it moves no clock.
      poolMatchGlobs: [
        ['**/RedeemThanks.spec.js', 'forks'],
        ['**/RedeemCommunitySelection.spec.js', 'forks'],
        ['**/useRedeemCommunity.spec.js', 'forks'],
        ['**/TransactionLink.thanks.spec.js', 'forks'],
        ['**/chatVideoCalendar.spec.js', 'forks'],
        ['**/chatVideoInvite.spec.js', 'forks'],
        ['**/ChatVideoCall.edit.spec.js', 'forks'],
        ['**/ContactWindow.spec.js', 'forks'],
      ],
      // setupFiles: ['./test/vitest.setup.js'],
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
      server: {
        deps: {
          inline: [/vee-validate/, 'vitest-canvas-mock'],
        },
      },
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@test': path.resolve(__dirname, './test'),
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@test': path.resolve(__dirname, './test'),
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    },
  }
})

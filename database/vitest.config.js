import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: '../config-schema/test/testSetup.vitest.ts',
  },
})
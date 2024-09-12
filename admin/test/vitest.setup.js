import { config } from '@vue/test-utils'
import { createApp } from 'vue'
import { vi } from 'vitest'

import { createI18n } from 'vue-i18n'
import { createBootstrap } from 'bootstrap-vue-next'

const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
const mockToast = vi.fn()

vi.mock('../src/composables/useAppToast', () => ({
  useAppToast: () => ({
    toastSuccess: mockToastSuccess,
    toastError: mockToastError,
    toast: mockToast,
  }),
}))

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      success: 'Success',
      error: 'Error',
    },
  },
})

const app = createApp({})

app.use(i18n)
app.use(createBootstrap())

config.global.plugins = [i18n]

app.config.warnHandler = (warning) => {
  throw new Error(warning)
}

export { mockToastSuccess, mockToastError, mockToast, i18n }

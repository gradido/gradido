import { config } from '@vue/test-utils'
import { createApp } from 'vue'
import { vi } from 'vitest'

import { createI18n } from 'vue-i18n'

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

config.global.plugins = [i18n]

app.config.warnHandler = (warning) => {
  throw new Error(warning)
}
const getVueInstance = () => {
  const testApp = createApp({})
  testApp.use(i18n)
  return testApp
}

export { mockToastSuccess, mockToastError, mockToast, getVueInstance, i18n }

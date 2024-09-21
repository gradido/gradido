// import { config } from '@vue/test-utils'
// import BootstrapVue from 'bootstrap-vue-next'
// import { createStore } from 'vuex'
// import { createI18n } from 'vue-i18n'
// import { defineRule, configure } from 'vee-validate'
// import AllRules from '@vee-validate/rules'
// import { loadAllRules } from '@/validation-rules'
// import { loadFilters } from '@/filters/amount'
// import { focus } from 'vue-focus'
// import * as Vue from 'vue'
// import { vi } from 'vitest'
//
// // Mock timers
// vi.useFakeTimers()
//
// // Setup Bootstrap Vue
// const bootstrapVue = BootstrapVue
//
// // Setup Vuex
// const store = createStore({
//   // Your store configuration
// })
//
// const mockToastSuccess = vi.fn()
// const mockToastError = vi.fn()
// const mockToast = vi.fn()
//
// vi.mock('../src/composables/useToast', () => ({
//   useAppToast: () => ({
//     toastSuccess: mockToastSuccess,
//     toastError: mockToastError,
//     toast: mockToast,
//   }),
// }))
//
// // Setup i18n
// const i18n = createI18n({
//   legacy: false,
//   locale: 'en',
//   messages: {
//     en: {
//       // Your English translations
//     },
//   },
// })
//
// // Setup vee-validate
// Object.keys(AllRules).forEach((rule) => {
//   defineRule(rule, AllRules[rule])
// })
//
// configure({
//   generateMessage: (context) => {
//     return `The field ${context.field} is invalid`
//   },
// })
//
// // Load custom validation rules
// loadAllRules(i18n, { query: vi.fn().mockResolvedValue({ data: { checkUsername: true } }) })
//
// // Setup filters
// const filters = loadFilters(i18n)
//
// // Global Vue configuration
// config.global.plugins = [bootstrapVue, store, i18n]
// config.global.mocks = {
//   $t: (key) => key,
//   $n: (value) => value,
//   $filters: filters,
// }
// config.global.directives = {
//   focus: focus,
// }
//
// // Suppress Bootstrap Vue warnings
// global.import.meta.env.BOOTSTRAP_VUE_NO_WARN = true
//
// // Suppress specific warnings
// const originalWarn = console.warn
// console.warn = (msg) => {
//   if (!msg.includes('[portal-vue]')) {
//     originalWarn(msg)
//   }
// }
//
// // Throw errors for Vue warnings
// Vue.config.warnHandler = (msg) => {
//   throw new Error(msg)
// }

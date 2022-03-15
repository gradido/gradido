import { createLocalVue } from '@vue/test-utils'
import Vue from 'vue'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'

// without this async calls are not working
import 'regenerator-runtime'

import { toasters } from '../src/mixins/toaster'

export const toastErrorSpy = jest.spyOn(toasters.methods, 'toastError')
export const toastSuccessSpy = jest.spyOn(toasters.methods, 'toastSuccess')

global.localVue = createLocalVue()

global.localVue.use(BootstrapVue)
global.localVue.use(IconsPlugin)

global.localVue.mixin(toasters)

// throw errors for vue warnings to force the programmers to take care about warnings
Vue.config.warnHandler = (w) => {
  throw new Error(w)
}

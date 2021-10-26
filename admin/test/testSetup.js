import { createLocalVue } from '@vue/test-utils'
import Vue from 'vue'

require('jsdom-global')()

global.localVue = createLocalVue()

// throw errors for vue warnings to force the programmers to take care about warnings
Vue.config.warnHandler = (w) => {
  throw new Error(w)
}

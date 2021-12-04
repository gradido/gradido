import { createLocalVue } from '@vue/test-utils'
import Vue from 'vue'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'

// without this async calls are not working
import 'regenerator-runtime'

global.localVue = createLocalVue()

global.localVue.use(BootstrapVue)
global.localVue.use(IconsPlugin)

// throw errors for vue warnings to force the programmers to take care about warnings
Vue.config.warnHandler = (w) => {
  throw new Error(w)
}

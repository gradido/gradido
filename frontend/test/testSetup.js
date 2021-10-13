import { createLocalVue } from '@vue/test-utils'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import Vuex from 'vuex'
import Vue from 'vue'

import { ValidationProvider, ValidationObserver, extend } from 'vee-validate'
import * as rules from 'vee-validate/dist/rules'
import { messages } from 'vee-validate/dist/locale/en.json'

import RegeneratorRuntime from 'regenerator-runtime'
import SideBar from '@/components/SidebarPlugin'
import VueQrcode from 'vue-qrcode'

import VueMoment from 'vue-moment'
import VueApexCharts from 'vue-apexcharts'

import clickOutside from '@/directives/click-ouside.js'
import { focus } from 'vue-focus'

import { loadAllRules } from '../src/validation-rules'

Object.keys(rules).forEach((rule) => {
  extend(rule, {
    ...rules[rule], // copies rule configuration
    message: messages[rule], // assign message
  })
})

const i18nMock = {
  t: (identifier, values) => identifier,
  n: (value, format) => value,
}

loadAllRules(i18nMock)

global.localVue = createLocalVue()

// switch of warnings from bootstrap vue
global.process.env.BOOTSTRAP_VUE_NO_WARN = true

global.localVue.use(BootstrapVue)
global.localVue.use(Vuex)
global.localVue.use(IconsPlugin)
global.localVue.use(RegeneratorRuntime)
global.localVue.use(SideBar)
global.localVue.use(VueQrcode)
global.localVue.use(VueMoment)
global.localVue.use(VueApexCharts)
global.localVue.component('validation-provider', ValidationProvider)
global.localVue.component('validation-observer', ValidationObserver)
global.localVue.directive('click-outside', clickOutside)
global.localVue.directive('focus', focus)

// throw errors for vue warnings to force the programmers to take care about warnings
Vue.config.warnHandler = (w) => {
  throw new Error(w)
}

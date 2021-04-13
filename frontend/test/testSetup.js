import { createLocalVue } from '@vue/test-utils'
import ElementUI from 'element-ui'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import Vuex from 'vuex'
import { ValidationProvider, ValidationObserver } from 'vee-validate'
import * as rules from 'vee-validate/dist/rules'
import { extend } from 'vee-validate'
import { messages } from 'vee-validate/dist/locale/en.json'
import BaseInput from '@/components/Inputs/BaseInput.vue'
import BaseButton from '@/components/BaseButton.vue'
import RegeneratorRuntime from 'regenerator-runtime'
import Notifications from '@/components/NotificationPlugin'
import SideBar from '@/components/SidebarPlugin'
import VueRouter from 'vue-router'
import BaseDropdown from '@/components/BaseDropdown.vue'
import VueQrcode from 'vue-qrcode'
import BaseHeader from '@/components/BaseHeader'
import StatsCard from '@/components/Cards/StatsCard.vue'

import clickOutside from '@/directives/click-ouside.js'

global.localVue = createLocalVue()

Object.keys(rules).forEach((rule) => {
  extend(rule, {
    ...rules[rule], // copies rule configuration
    message: messages[rule], // assign message
  })
})

global.localVue.use(ElementUI)
global.localVue.use(BootstrapVue)
global.localVue.use(Vuex)
global.localVue.use(IconsPlugin)
global.localVue.use(RegeneratorRuntime)
global.localVue.use(Notifications)
global.localVue.use(SideBar)
global.localVue.use(VueRouter)
global.localVue.use(VueQrcode)
global.localVue.component(BaseInput.name, BaseInput)
global.localVue.component('validation-provider', ValidationProvider)
global.localVue.component('validation-observer', ValidationObserver)
global.localVue.component(BaseButton.name, BaseButton)
global.localVue.component(BaseDropdown.name, BaseDropdown)
global.localVue.component(BaseHeader.name, BaseHeader)
global.localVue.component(StatsCard.name, StatsCard)

global.localVue.directive('click-outside', clickOutside)

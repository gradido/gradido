import '@/polyfills'
import { configure, extend } from 'vee-validate'
import GlobalComponents from './globalComponents'
import GlobalDirectives from './globalDirectives'
import SideBar from '@/components/SidebarPlugin'

import '@/assets/scss/argon.scss'
import '@/assets/vendor/nucleo/css/nucleo.css'
import * as rules from 'vee-validate/dist/rules'
import { messages } from 'vee-validate/dist/locale/en.json'

import VueQrcodeReader from 'vue-qrcode-reader'
import VueQrcode from 'vue-qrcode'

import FlatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'

import VueMoment from 'vue-moment'

import Loading from 'vue-loading-overlay'
import 'vue-loading-overlay/dist/vue-loading.css'

import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'

Object.keys(rules).forEach((rule) => {
  extend(rule, {
    ...rules[rule], // copies rule configuration
    message: messages[rule], // assign message
  })
})

export default {
  install(Vue) {
    Vue.use(GlobalComponents)
    Vue.use(GlobalDirectives)
    Vue.use(SideBar)
    Vue.use(BootstrapVue)
    Vue.use(IconsPlugin)
    Vue.use(VueMoment)
    Vue.use(VueQrcodeReader)
    Vue.use(VueQrcode)
    Vue.use(FlatPickr)
    Vue.use(Loading)
    configure({
      classes: {
        valid: 'is-valid',
        invalid: 'is-invalid',
        dirty: ['is-dirty', 'is-dirty'], // multiple classes per flag!
      },
    })
  },
}

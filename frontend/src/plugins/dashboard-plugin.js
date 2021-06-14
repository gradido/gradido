// Polyfills for js features used in the Dashboard but not supported in some browsers (mainly IE)
import '@/polyfills'
// Notifications plugin. Used on Notifications page
import Notifications from '@/components/NotificationPlugin'
// Validation plugin used to validate forms
import { configure, extend } from 'vee-validate'
// A plugin file where you could register global components used across the app
import GlobalComponents from './globalComponents'
// A plugin file where you could register global directives
import GlobalDirectives from './globalDirectives'
// Sidebar on the right. Used as a local plugin in DashboardLayout.vue
import SideBar from '@/components/SidebarPlugin'

import PortalVue from 'portal-vue'

import VueBootstrapToasts from 'vue-bootstrap-toasts'

// vue-bootstrap
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'

// asset imports
import '@/assets/scss/argon.scss'
import '@/assets/vendor/nucleo/css/nucleo.css'
import * as rules from 'vee-validate/dist/rules'
import { messages } from 'vee-validate/dist/locale/en.json'

import VueQrcodeReader from 'vue-qrcode-reader'
import VueQrcode from 'vue-qrcode'

import VueFlatPickr from 'vue-flatpickr-component'

import VueGoodTablePlugin from 'vue-good-table'
// import the styles
import 'vue-good-table/dist/vue-good-table.css'

import VueMoment from 'vue-moment'

import Loading from 'vue-loading-overlay'
// import the styles
import 'vue-loading-overlay/dist/vue-loading.css'

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
    Vue.use(Notifications)
    Vue.use(PortalVue)
    Vue.use(BootstrapVue)
    Vue.use(IconsPlugin)
    Vue.use(VueBootstrapToasts)
    Vue.use(VueGoodTablePlugin)
    Vue.use(VueMoment)
    Vue.use(VueQrcodeReader)
    Vue.use(VueQrcode)
    Vue.use(VueFlatPickr)
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

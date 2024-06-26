import GlobalComponents from './globalComponents'
import GlobalDirectives from './globalDirectives'

import PortalVue from 'portal-vue'

// vue-bootstrap
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'

import '@/assets/scss/gradido.scss'

import FlatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'

import Loading from 'vue-loading-overlay'
import 'vue-loading-overlay/dist/vue-loading.css'

import VueApollo from 'vue-apollo'

import VueTimers from 'vue-timers'

export default {
  install(Vue) {
    Vue.use(GlobalComponents)
    Vue.use(GlobalDirectives)
    Vue.use(BootstrapVue)
    Vue.use(IconsPlugin)
    Vue.use(PortalVue)
    Vue.use(FlatPickr)
    Vue.use(Loading)
    Vue.use(VueApollo)
    Vue.use(VueTimers)
  },
}

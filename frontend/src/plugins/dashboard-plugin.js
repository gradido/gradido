import '@/polyfills'
import GlobalComponents from './globalComponents'
import GlobalDirectives from './globalDirectives'
import SideBar from '@/components/SidebarPlugin'

import PortalVue from 'portal-vue'

import Toasted from 'vue-toasted'

// vue-bootstrap
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'

// asset imports
import '@/assets/scss/argon.scss'
import '@/assets/vendor/nucleo/css/nucleo.css'

import VueQrcodeReader from 'vue-qrcode-reader'
import VueQrcode from 'vue-qrcode'

import FlatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'

import VueMoment from 'vue-moment'

import Loading from 'vue-loading-overlay'
import 'vue-loading-overlay/dist/vue-loading.css'

import VueApollo from 'vue-apollo'

export default {
  install(Vue) {
    Vue.use(GlobalComponents)
    Vue.use(GlobalDirectives)
    Vue.use(SideBar)
    Vue.use(PortalVue)
    Vue.use(BootstrapVue)
    Vue.use(IconsPlugin)
    Vue.use(VueMoment)
    Vue.use(VueQrcodeReader)
    Vue.use(VueQrcode)
    Vue.use(FlatPickr)
    Vue.use(Loading)
    Vue.use(VueApollo)
    Vue.use(Toasted, {
      position: 'top-center',
      duration: 5000,
      fullWidth: true,
      action: {
        text: 'x',
        onClick: (e, toastObject) => {
          toastObject.goAway(0)
        },
      },
    })
  },
}

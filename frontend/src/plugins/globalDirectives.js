import clickOutside from '@/directives/click-ouside.js'
import { focus } from 'vue-focus'

/**
 * You can register global directives here and use them as a plugin in your main Vue instance
 */

const GlobalDirectives = {
  install(Vue) {
    Vue.directive('click-outside', clickOutside)
    Vue.directive('focus', focus)
  },
}

export default GlobalDirectives

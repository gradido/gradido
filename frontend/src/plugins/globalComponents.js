import { ValidationProvider, ValidationObserver } from 'vee-validate'

const GlobalComponents = {
  install(Vue) {
    Vue.component('ValidationProvider', ValidationProvider)
    Vue.component('ValidationObserver', ValidationObserver)
  },
}

export default GlobalComponents

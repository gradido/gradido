import { ValidationProvider, ValidationObserver } from 'vee-validate'

const GlobalComponents = {
  install(Vue) {
    Vue.component('validation-provider', ValidationProvider)
    Vue.component('validation-observer', ValidationObserver)
  },
}

export default GlobalComponents

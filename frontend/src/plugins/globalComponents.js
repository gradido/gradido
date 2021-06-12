import BaseNav from '@/components/Navbar/BaseNav'
import { ValidationProvider, ValidationObserver } from 'vee-validate'

const GlobalComponents = {
  install(Vue) {
    Vue.component(BaseNav.name, BaseNav)
    Vue.component('validation-provider', ValidationProvider)
    Vue.component('validation-observer', ValidationObserver)
  },
}

export default GlobalComponents

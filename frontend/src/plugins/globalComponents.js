import Card from '@/components/Cards/Card.vue'
import StatsCard from '@/components/Cards/StatsCard.vue'
import Badge from '@/components/Badge.vue'
import BaseNav from '@/components/Navbar/BaseNav'
import { ValidationProvider, ValidationObserver } from 'vee-validate'

const GlobalComponents = {
  install(Vue) {
    Vue.component(Badge.name, Badge)
    Vue.component(BaseNav.name, BaseNav)
    Vue.component(Card.name, Card)
    Vue.component(StatsCard.name, StatsCard)
    Vue.component('validation-provider', ValidationProvider)
    Vue.component('validation-observer', ValidationObserver)
  },
}

export default GlobalComponents

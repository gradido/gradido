import BaseInput from '@/components/Inputs/BaseInput.vue'
import BaseDropdown from '@/components/BaseDropdown.vue'
import Card from '@/components/Cards/Card.vue'
import Modal from '@/components/Modal.vue'
import StatsCard from '@/components/Cards/StatsCard.vue'
import BaseButton from '@/components/BaseButton.vue'
import Badge from '@/components/Badge.vue'
import BaseCheckbox from '@/components/Inputs/BaseCheckbox.vue'
import BaseRadio from '@/components/Inputs/BaseRadio'
import BaseProgress from '@/components/BaseProgress'
import BasePagination from '@/components/BasePagination'
import BaseAlert from '@/components/BaseAlert'
import BaseNav from '@/components/Navbar/BaseNav'
import { ValidationProvider, ValidationObserver } from 'vee-validate'


const GlobalComponents = {
  install(Vue) {
    Vue.component(Badge.name, Badge)
    Vue.component(BaseAlert.name, BaseAlert)
    Vue.component(BaseButton.name, BaseButton)
    Vue.component(BaseCheckbox.name, BaseCheckbox)
    Vue.component(BaseInput.name, BaseInput)
    Vue.component(BaseDropdown.name, BaseDropdown)
    Vue.component(BaseNav.name, BaseNav)
    Vue.component(BasePagination.name, BasePagination)
    Vue.component(BaseProgress.name, BaseProgress)
    Vue.component(BaseRadio.name, BaseRadio)
    Vue.component(Card.name, Card)
    Vue.component(Modal.name, Modal)
    Vue.component(StatsCard.name, StatsCard)
    Vue.component('validation-provider', ValidationProvider)
    Vue.component('validation-observer', ValidationObserver)
  },
}

export default GlobalComponents

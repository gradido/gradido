import { createLocalVue } from '@vue/test-utils'
import ElementUI from 'element-ui'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import Vuex from 'vuex'
import { ValidationProvider, ValidationObserver } from 'vee-validate'
import BaseInput from '@/components/Inputs/BaseInput.vue'
import BaseButton from '@/components/BaseButton.vue'

global.localVue = createLocalVue()

global.localVue.use(ElementUI)
global.localVue.use(BootstrapVue)
global.localVue.use(Vuex)
global.localVue.use(IconsPlugin)
global.localVue.component(BaseInput.name, BaseInput)
global.localVue.component('validation-provider', ValidationProvider)
global.localVue.component('validation-observer', ValidationObserver)
global.localVue.component(BaseButton.name, BaseButton)

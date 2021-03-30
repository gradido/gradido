import { createLocalVue } from '@vue/test-utils'
import ElementUI from 'element-ui'
import BootstrapVue from 'bootstrap-vue'

global.localVue = createLocalVue()

global.localVue.use(ElementUI)
global.localVue.use(BootstrapVue)

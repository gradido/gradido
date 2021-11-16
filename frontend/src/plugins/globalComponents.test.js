import GlobalComponents from './globalComponents.js'
import Vue from 'vue'
import 'vee-validate'

jest.mock('vue')
jest.mock('vee-validate', () => {
  const originalModule = jest.requireActual('vee-validate')
  return {
    __esModule: true,
    ...originalModule,
    ValidationProvider: 'mocked validation provider',
    ValidationObserver: 'mocked validation observer',
  }
})

const vueComponentMock = jest.fn()
Vue.component = vueComponentMock

describe('global Components', () => {
  GlobalComponents.install(Vue)

  it('installs the validation provider', () => {
    expect(vueComponentMock).toBeCalledWith('validation-provider', 'mocked validation provider')
  })

  it('installs the validation observer', () => {
    expect(vueComponentMock).toBeCalledWith('validation-observer', 'mocked validation observer')
  })
})

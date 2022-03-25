import GlobalDirectives from './globalDirectives'
import { focus } from 'vue-focus'
import Vue from 'vue'

jest.mock('vue-focus', () => {
  return {
    __esModule: true,
    focus: jest.fn(),
  }
})
jest.mock('vue')

const vueDirectiveMock = jest.fn()
Vue.directive = vueDirectiveMock

describe('globalDirectives', () => {
  it('installs the focus directive', () => {
    GlobalDirectives.install(Vue)
    expect(vueDirectiveMock).toBeCalledWith('focus', focus)
  })
})

import dashboardPlugin from './dashboard-plugin.js'
import Vue from 'vue'

import GlobalComponents from './globalComponents'
import GlobalDirectives from './globalDirectives'

jest.mock('./globalComponents')
jest.mock('./globalDirectives')

jest.mock('vue')

const vueUseMock = jest.fn()
Vue.use = vueUseMock

describe('dashboard plugin', () => {
  dashboardPlugin.install(Vue)

  it('installs the global components', () => {
    expect(vueUseMock).toBeCalledWith(GlobalComponents)
  })

  it('installs the global directives', () => {
    expect(vueUseMock).toBeCalledWith(GlobalDirectives)
  })
})

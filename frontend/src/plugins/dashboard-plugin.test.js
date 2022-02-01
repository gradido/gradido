import dashboardPlugin from './dashboard-plugin.js'
import Vue from 'vue'

import GlobalComponents from './globalComponents'
import GlobalDirectives from './globalDirectives'

import Toasted from 'vue-toasted'

import './assets/scss/app.scss'

jest.mock('./globalComponents')
jest.mock('./globalDirectives')
jest.mock('vue-toasted')

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

  describe('vue toasted', () => {
    const toastedAction = vueUseMock.mock.calls[9][1].action.onClick
    const goAwayMock = jest.fn()
    const toastObject = {
      goAway: goAwayMock,
    }

    it('installs vue toasted', () => {
      expect(vueUseMock).toBeCalledWith(Toasted, expect.anything())
    })

    it('onClick calls goAway(0)', () => {
      toastedAction({}, toastObject)
      expect(goAwayMock).toBeCalledWith(0)
    })
  })
})

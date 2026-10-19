import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from 'vue'
import { createAdminApp } from '../src/main'

// Mock dependencies
vi.mock('vue', () => ({
  createApp: vi.fn(() => ({
    use: vi.fn(),
    mixin: vi.fn(),
    mount: vi.fn(),
  })),
}))

vi.mock('./App.vue', () => ({ default: {} }))
vi.mock('./store/store', () => ({
  store: { moderator: { language: 'en' } },
  pinia: {},
}))
vi.mock('./router/router', () => ({ router: {} }))
vi.mock('./router/guards', () => ({ addNavigationGuards: vi.fn() }))
vi.mock('./i18n', () => ({
  i18n: {
    global: {
      locale: { value: 'en' },
    },
  },
}))
vi.mock('portal-vue', () => ({ default: {} }))
vi.mock('bootstrap-vue-next', () => ({ createBootstrap: vi.fn() }))
vi.mock('./mixins/toaster', () => ({ toasters: {} }))
vi.mock('./plugins/apolloProvider', () => ({ apolloClient: {} }))

describe('main.js', () => {
  let app

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    app = createAdminApp()
  })

  it('creates a Vue app', () => {
    expect(createApp).toHaveBeenCalledWith(expect.anything())
  })

  it('uses the router plugin', () => {
    expect(app.use).toHaveBeenCalled()
  })

  it('uses the Pinia store', () => {
    expect(app.use).toHaveBeenCalled()
  })

  it('uses i18n plugin', () => {
    expect(app.use).toHaveBeenCalled()
  })

  it('uses PortalVue plugin', () => {
    expect(app.use).toHaveBeenCalled()
  })

  it('uses Bootstrap Vue plugin', () => {
    expect(app.use).toHaveBeenCalled()
  })

  // The wallet's "Admin" can take the window a pin opened for the map to the admin interface,
  // and a window keeps its name: a pin pressed anywhere would take this window for the map.
  describe('in a window that carries the name of the map window', () => {
    afterEach(() => {
      window.name = ''
    })

    it('takes that name off the window as it starts', () => {
      window.name = 'gradido-wallet-map'
      createAdminApp()
      expect(window.name).toBe('')
    })

    it('leaves a window of another name alone', () => {
      window.name = 'my-window'
      createAdminApp()
      expect(window.name).toBe('my-window')
    })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
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
  default: {
    state: { moderator: { language: 'en' } },
  },
}))
vi.mock('./router/router', () => ({ default: {} }))
vi.mock('./router/guards', () => ({ default: vi.fn() }))
vi.mock('./i18n', () => ({
  default: {
    global: {
      locale: { value: 'en' },
    },
  },
}))
vi.mock('portal-vue', () => ({ default: {} }))
vi.mock('bootstrap-vue-next', () => ({ createBootstrap: vi.fn() }))
vi.mock('./mixins/toaster', () => ({ toasters: {} }))
vi.mock('./plugins/apolloProvider', () => ({ apolloProvider: { defaultClient: {} } }))

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

  it('uses the Vuex store', () => {
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

  it('uses Apollo provider', () => {
    expect(app.use).toHaveBeenCalled()
  })
})

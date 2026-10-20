import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { markAppOutdated, resetAppOutdated } from '@/composables/useAppOutdated'
import { AppOutdatedBar } from './AppOutdatedBar'

// ⚠️ The reload is caught at the composable, not at window.location. Under the vmThreads pool
// the global is jsdom's own window, whose location can be neither deleted nor replaced --
// assigning an object to it is a navigation. Everything else of the composable stays real.
const { reload } = vi.hoisted(() => ({ reload: vi.fn() }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key) => key }) }))
vi.mock('@/composables/useAppOutdated', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAppOutdated: () => ({ ...actual.useAppOutdated(), reloadApp: reload }),
  }
})

// ⚠️ No own $emit('click') here. $attrs already carries the parent's click handler onto the
// button, so emitting as well would run it twice and the test would count two reloads for
// one press.
const mockBButton = {
  name: 'BButton',
  template: '<button v-bind="$attrs"><slot></slot></button>',
}

describe('AppOutdatedBar', () => {
  const createWrapper = () =>
    mount(AppOutdatedBar, {
      global: {
        stubs: { BButton: mockBButton },
      },
    })

  beforeEach(() => {
    resetAppOutdated()
    reload.mockClear()
  })

  // The bar is a permanent interruption, so it must be invisible until there is a real
  // reason. A test that only checked the visible case would stay green if it were shown
  // always.
  it('shows nothing while the bundle still fits the schema', () => {
    expect(createWrapper().find('[data-test="app-outdated-bar"]').exists()).toBe(false)
  })

  it('appears once the app has been marked outdated', async () => {
    const wrapper = createWrapper()
    markAppOutdated()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="app-outdated-bar"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('appOutdated.text')
  })

  // ★ The reload is offered, never taken. Someone who has just typed a contribution must get
  // the chance to copy it out first -- reloading for them would destroy exactly the work the
  // failed submission was about.
  it('reloads only when the button is pressed', async () => {
    const wrapper = createWrapper()
    markAppOutdated()
    await wrapper.vm.$nextTick()

    expect(reload).not.toHaveBeenCalled()

    await wrapper.find('[data-test="app-outdated-reload"]').trigger('click')
    expect(reload).toHaveBeenCalledTimes(1)
  })
})

// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import MobileSidebar from './MobileSidebar.vue'

const { lock, unlock } = vi.hoisted(() => ({ lock: vi.fn(), unlock: vi.fn() }))
vi.mock('tua-body-scroll-lock', () => ({ lock, unlock }))

/**
 * The phone's menu, open or shut as the layout keeps it -- so the opener in the navbar, which
 * the layout tells the same value, can say which one it is. The drawer follows the value and
 * asks for it to change; it keeps no state of its own.
 */
describe('MobileSidebar', () => {
  let wrapper

  // v-model:open as the layout binds it: every request to change is written back.
  const mountDrawer = (open = false) => {
    wrapper = mount(MobileSidebar, {
      props: {
        open,
        'onUpdate:open': (value) => wrapper.setProps({ open: value }),
      },
      global: {
        stubs: {
          BCollapse: {
            name: 'BCollapse',
            props: ['modelValue'],
            emits: ['update:modelValue'],
            template: '<div data-test="collapse" :data-open="String(modelValue)"><slot /></div>',
          },
          BImg: true,
          Sidebar: {
            name: 'Sidebar',
            emits: ['close-sidebar', 'admin', 'logout'],
            template: '<nav data-test="sidebar" />',
          },
        },
      },
    })
    return wrapper
  }
  const drawer = () => wrapper.find('[data-test="collapse"]')

  beforeEach(() => {
    lock.mockClear()
    unlock.mockClear()
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
  })

  it('opens and shuts as the layout says', async () => {
    mountDrawer(false)
    expect(drawer().attributes('data-open')).toBe('false')
    await wrapper.setProps({ open: true })
    expect(drawer().attributes('data-open')).toBe('true')
    await wrapper.setProps({ open: false })
    expect(drawer().attributes('data-open')).toBe('false')
  })

  // ⛔ The two ways it shuts without the opener: they have to reach the layout, or the opener
  // goes on saying "expanded" -- what v-b-toggle did.
  it('asks to be shut when the dark area beside it is tapped', async () => {
    mountDrawer(true)
    await wrapper.find('[data-test="mobile-sidebar-overlay"]').trigger('click')
    expect(wrapper.emitted('update:open')).toEqual([[false]])
    expect(drawer().attributes('data-open')).toBe('false')
  })

  it('asks to be shut when one of its entries was chosen', async () => {
    mountDrawer(true)
    await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('close-sidebar')
    expect(wrapper.emitted('update:open')).toEqual([[false]])
  })

  it('passes on what the collapse itself asks for', async () => {
    mountDrawer(true)
    await wrapper.findComponent({ name: 'BCollapse' }).vm.$emit('update:modelValue', false)
    expect(wrapper.emitted('update:open')).toEqual([[false]])
  })

  it('holds the page behind it still while open, and lets it go when it shuts', async () => {
    mountDrawer(false)
    await wrapper.setProps({ open: true })
    expect(lock).toHaveBeenCalledTimes(1)
    await wrapper.setProps({ open: false })
    expect(unlock).toHaveBeenCalledTimes(1)
  })
})

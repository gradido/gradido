// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { ref } from 'vue'
import ChatVideoAppBox from './ChatVideoAppBox.vue'

const member = vi.hoisted(() => ({ gradidoID: 'me-id' }))
vi.mock('vuex', () => ({
  useStore: () => ({ state: member }),
}))

/** The box as the dialogs hold it: bound with v-model to a value of their own. */
const Dialog = {
  components: { ChatVideoAppBox },
  setup() {
    return { inApp: ref(false) }
  },
  template: '<ChatVideoAppBox v-model="inApp" />',
}

const mountBox = () => mount(Dialog, { global: { mocks: { $t: (key) => key } } })

describe('ChatVideoAppBox', () => {
  afterEach(() => {
    localStorage.clear()
    member.gradidoID = 'me-id'
  })

  it('stands at the right, on a line of its own, with its word and its hint', () => {
    const wrapper = mountBox()

    const line = wrapper.find('div')
    expect(line.classes()).toEqual(
      expect.arrayContaining(['w-100', 'd-flex', 'justify-content-end']),
    )
    const label = line.find('label')
    expect(label.text()).toBe('chatThread.videoStartInApp')
    expect(label.attributes('title')).toBe('chatThread.videoInAppHint')
    expect(label.find('[data-test="chat-video-app-box"]').element.type).toBe('checkbox')
  })

  // ⛔ What the box is now, at once -- the regression of 26.09.2026 remembered the opposite.
  it('remembers a tick at once for the member signed in, and lets go of it when emptied', async () => {
    const wrapper = mountBox()
    const box = wrapper.find('[data-test="chat-video-app-box"]')

    await box.setValue(true)
    expect(localStorage.getItem('chat-video-in-app:me-id')).toBe('1')
    expect(wrapper.vm.inApp).toBe(true)

    await box.setValue(false)
    expect(localStorage.getItem('chat-video-in-app:me-id')).toBeNull()
    expect(wrapper.vm.inApp).toBe(false)
  })

  it('remembers nothing where nobody is signed in yet', async () => {
    member.gradidoID = null
    const wrapper = mountBox()

    await wrapper.find('[data-test="chat-video-app-box"]').setValue(true)

    expect(localStorage.length).toBe(0)
    expect(wrapper.vm.inApp).toBe(true)
  })
})

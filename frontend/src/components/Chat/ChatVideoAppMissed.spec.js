// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ChatVideoAppMissed from './ChatVideoAppMissed.vue'

const ROOM = 'https://meet.ffmuc.net/k7m2x9q4t8wz#config.subject=%22Videoanruf%22'

describe('ChatVideoAppMissed', () => {
  const wrapper = () =>
    mount(ChatVideoAppMissed, {
      props: { room: ROOM },
      global: { mocks: { $t: (key) => key } },
    })

  // Said when it is put in, as the question's other problems are.
  it('says that the app did not open, as an alert', () => {
    const alert = wrapper().find('[role="alert"]')

    expect(alert.text()).toBe('chatThread.videoAppMissed')
  })

  it("offers the room in the browser, as the thread's link opens it", () => {
    const link = wrapper().find('[data-test="chat-video-app-missed-room"]')

    expect(link.text()).toBe('chatThread.videoOpenInBrowser')
    expect(link.attributes('href')).toBe(ROOM)
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
  })

  it("offers Jitsi's page of downloads", () => {
    const link = wrapper().find('[data-test="chat-video-app-download"]')

    expect(link.text()).toBe('chatThread.videoAppDownload')
    expect(link.attributes('href')).toBe('https://jitsi.org/downloads/')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
  })
})

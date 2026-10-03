// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ChatVideoLinkCopy from './ChatVideoLinkCopy.vue'
import { withChatVideoTopic } from '@/utils/chatVideoTopic'

const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastSuccess: mockToastSuccess, toastError: mockToastError }),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key) => key }),
}))

const ROOM = 'https://meet.opensuse.org/zsuhu82kdvs1'
const TOPIC = 'Lesekreis „Momo“'
const WHEN = {
  start: new Date('2026-09-30T13:00:00.000Z'),
  end: new Date('2026-09-30T14:00:00.000Z'),
}

// The icons are compiled in by the build (unplugin-icons), not in the tests: a stand-in of the
// same kind.
let wrapper
const mountCopy = (href) => {
  wrapper = mount(ChatVideoLinkCopy, {
    props: { href },
    global: { stubs: { IBiCopy: { template: '<svg />' } } },
  })
  return wrapper.find('button')
}

describe('ChatVideoLinkCopy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.unstubAllGlobals()
  })

  // A button, not a link: it opens nothing. Its name is for the ear and the pointer, the icon for
  // the eye only.
  it('is a button named "Copy link", with the icon hidden from the ear', () => {
    const button = mountCopy(withChatVideoTopic(ROOM, TOPIC))

    expect(button.attributes('type')).toBe('button')
    expect(button.attributes('aria-label')).toBe('chatThread.videoCopyLink')
    expect(button.attributes('title')).toBe('chatThread.videoCopyLink')
    expect(button.find('svg').attributes('aria-hidden')).toBe('true')
    expect(button.text()).toBe('')
  })

  it('copies the room with its topic, and says so', async () => {
    const writeText = vi.fn().mockResolvedValue()
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const address = withChatVideoTopic(ROOM, TOPIC)

    await mountCopy(address).trigger('click')
    await flushPromises()

    expect(writeText).toHaveBeenCalledWith(address)
    expect(mockToastSuccess).toHaveBeenCalledWith('chatThread.videoLinkCopied')
    expect(mockToastError).not.toHaveBeenCalled()
  })

  // Bernd, 29.09.2026: a link used again for another meeting brings no old date along -- the
  // calendar button a receiving wallet builds from it would show that date.
  it('leaves out the time of a planned call and keeps its topic', async () => {
    const writeText = vi.fn().mockResolvedValue()
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    await mountCopy(withChatVideoTopic(ROOM, TOPIC, WHEN)).trigger('click')
    await flushPromises()

    expect(writeText).toHaveBeenCalledWith(withChatVideoTopic(ROOM, TOPIC))
  })

  // Safari counts a write to the clipboard as the member's only while the tap is being answered:
  // the write goes out in the click itself, before anything is waited for.
  it('writes to the clipboard in the click itself', () => {
    const writeText = vi.fn().mockResolvedValue()
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    mountCopy(withChatVideoTopic(ROOM, TOPIC)).element.click()

    expect(writeText).toHaveBeenCalledTimes(1)
  })

  it('says nothing was copied when the write is refused', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    await mountCopy(withChatVideoTopic(ROOM, TOPIC)).trigger('click')
    await flushPromises()

    expect(mockToastSuccess).not.toHaveBeenCalled()
    expect(mockToastError).toHaveBeenCalledWith('gdd_per_link.not-copied')
  })

  // Without TLS, and in some browsers built into other apps, there is no clipboard at all: the
  // call throws on the spot, and a `.catch` on a promise would never run.
  it('survives a browser without a clipboard', async () => {
    vi.stubGlobal('navigator', {})

    await mountCopy(withChatVideoTopic(ROOM, TOPIC)).trigger('click')
    await flushPromises()

    expect(mockToastSuccess).not.toHaveBeenCalled()
    expect(mockToastError).toHaveBeenCalledWith('gdd_per_link.not-copied')
  })
})

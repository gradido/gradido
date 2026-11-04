// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MESSAGE_MAX_CHARS } from '@/validationSchemas'
import ChatNote from './ChatNote.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key) => key }),
}))

let wrapper
const mountNote = (props = {}) => {
  wrapper = mount(ChatNote, {
    props: { placeholder: 'chatNote.placeholderMember', ...props },
    attachTo: document.body,
    global: { mocks: { $t: (key) => key } },
  })
  return wrapper
}
const field = () => wrapper.find('[data-test="chat-note-field"]')
const panel = () => wrapper.find('[data-test="chat-note"]')

describe('ChatNote', () => {
  afterEach(() => {
    wrapper?.unmount()
  })

  it('says whose it is, and that only the member sees it', () => {
    mountNote()
    expect(panel().text()).toContain('chatNote.title')
    expect(panel().text()).toContain('chatNote.private')
    expect(field().attributes('placeholder')).toBe('chatNote.placeholderMember')
  })

  it('lets as many characters in as a chat message may have', () => {
    mountNote()
    expect(field().attributes('maxlength')).toBe(String(MESSAGE_MAX_CHARS))
  })

  // An empty note is opened to be written; a note with words to be read -- on a phone a keyboard
  // would cover it.
  it('takes the keyboard into an empty field', () => {
    mountNote({ modelValue: '' })
    expect(document.activeElement).toBe(field().element)
  })

  it('leaves the keyboard out of a field with words, the panel takes the focus', () => {
    mountNote({ modelValue: 'Anna Sonnenberg' })
    expect(document.activeElement).toBe(panel().element)
  })

  it('hands every word typed up', async () => {
    mountNote()
    await field().setValue('Anna')
    expect(wrapper.emitted('update:modelValue')).toEqual([['Anna']])
  })

  it('closes with "Done"', async () => {
    mountNote()
    await wrapper.find('[data-test="chat-note-done"]').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  // Esc closes the note, not the window: the window's dialog listens further up.
  it('closes with Esc, and the key goes no further', async () => {
    mountNote()
    const further = vi.fn()
    document.body.addEventListener('keydown', further)
    try {
      await field().trigger('keydown', { key: 'Escape' })
      expect(wrapper.emitted('close')).toHaveLength(1)
      expect(further).not.toHaveBeenCalled()
    } finally {
      document.body.removeEventListener('keydown', further)
    }
  })

  it('shows saving and saved as quiet words, not as an announcement', () => {
    mountNote({ status: 'saving' })
    expect(wrapper.find('[data-test="chat-note-status"]').text()).toBe('chatNote.saving')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    wrapper.unmount()
    mountNote({ status: 'saved' })
    expect(wrapper.find('[data-test="chat-note-status"]').text()).toBe('chatNote.saved')
  })

  it('says at once when a note was not saved, with a way to try again', async () => {
    mountNote({ modelValue: 'words', status: 'failed' })
    const alert = wrapper.find('[role="alert"]')
    expect(alert.text()).toContain('chatNote.failed')
    expect(field().attributes('aria-describedby')).toBe(alert.attributes('id'))
    expect(field().attributes('disabled')).toBeUndefined()
    await wrapper.find('[data-test="chat-note-retry"]').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  // An empty field over a note the server holds would replace it.
  it('cannot be written while the note could not be loaded', () => {
    mountNote({ status: 'loadFailed' })
    expect(wrapper.find('[role="alert"]').text()).toContain('chatNote.loadFailed')
    expect(field().attributes('disabled')).toBeDefined()
    expect(document.activeElement).toBe(panel().element)
  })

  // "Try again" loads it once more: the field waits for the note as well.
  it('cannot be written while the note loads', () => {
    mountNote({ status: 'loading' })
    expect(field().attributes('disabled')).toBeDefined()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('names no description while nothing went wrong', () => {
    mountNote({ status: 'saved' })
    expect(field().attributes('aria-describedby')).toBeUndefined()
  })
})

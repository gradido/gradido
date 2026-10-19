// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import {
  BButton,
  BCard,
  BCol,
  BForm,
  BFormGroup,
  BFormInput,
  BFormInvalidFeedback,
  BFormTextarea,
  BRow,
} from 'bootstrap-vue-next'
import i18n from '@/i18n'
import EmojiPicker from '@/components/Inputs/EmojiPicker.vue'
import { isComputer } from '@/utils/isComputer'
import TransactionForm from './TransactionForm.vue'
import { walletStore } from '@test/walletStore'

/**
 * The smiley at the message of the send form (Bernd, 10.10.2026), with the house's real input
 * and the real choice: what must hold is that an emoji pressed stands in the message's field and
 * in what the form hands on -- and the smiley finds that field by an id the input makes itself,
 * which a stand-in for the input would not make.
 */
const route = vi.hoisted(() => ({ params: {}, query: {}, fullPath: '/send' }))
vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ replace: vi.fn() }),
}))
vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({ result: ref(null), loading: ref(false), error: ref(null) }),
}))
vi.mock('@/composables/useToast', () => ({ useAppToast: () => ({ toastError: vi.fn() }) }))
// A computer unless a test says otherwise: the smiley is a computer's (utils/emojiChoice).
vi.mock('@/utils/isComputer', () => ({ isComputer: vi.fn(() => true) }))

let wrapper
const openForm = (props = {}) => {
  wrapper = mount(TransactionForm, {
    // In the page: the choice finds the message's field by its id.
    attachTo: document.body,
    global: {
      plugins: [i18n, walletStore({ gradidoID: 'uuid-emma' })],
      components: {
        BButton,
        BCard,
        BCol,
        BForm,
        BFormGroup,
        BFormInput,
        BFormInvalidFeedback,
        BFormTextarea,
        BRow,
      },
      stubs: {
        'community-switch': true,
        'b-img': true,
        'i-mdi-link-variant': true,
        'i-mdi-email-fast-outline': true,
        IMdiEmoticonHappyOutline: true,
        TransactionPictureField: true,
      },
    },
    props: { balance: 100, ...props },
  })
  return wrapper
}

const memoField = () => wrapper.find('#memo-input-field')
const picker = () => wrapper.findComponent(EmojiPicker)
const smiley = () => wrapper.find('[data-test="emoji-picker-toggle"]')
const choice = () => wrapper.find('[data-test="emoji-picker-panel"]')
const emoji = (sign) =>
  wrapper
    .findAll('[data-test="emoji-picker-emoji"]')
    .find((button) => button.element.textContent.trim() === sign)
/** A click of the mouse, as the browser sends it (`detail` 1; the test utils cannot set it). */
const click = async (target) => {
  target.element.dispatchEvent(
    new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }),
  )
  await flushPromises()
}

describe('TransactionForm, the smiley at the message', () => {
  beforeEach(() => {
    i18n.global.locale.value = 'de'
    route.query = {}
  })

  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
    vi.mocked(isComputer).mockReturnValue(true)
  })

  it.each([
    ['a transfer', {}, 'send'],
    ['a link', { art: 'link' }, 'link'],
    ['a letter', { art: 'email' }, 'email'],
  ])('stands at the message of %s', (_what, query, mode) => {
    route.query = query
    openForm()

    expect(wrapper.vm.radioSelected).toBe(mode)
    expect(smiley().exists()).toBe(true)
    expect(smiley().attributes('aria-label')).toBe('Emoji einfügen')
  })

  // The id is made by the input out of the field's name; the form only knows it by heart.
  it('belongs to the message’s field as the input renders it', () => {
    openForm()

    expect(memoField().exists()).toBe(true)
    expect(memoField().element.tagName).toBe('TEXTAREA')
    expect(picker().props('fieldId')).toBe(memoField().attributes('id'))
  })

  // The smiley in the corner of what wraps the field, the choice over the page: nothing of the
  // form gives way to it, and nothing moves from under a press when it shuts.
  it('stands in the corner of what wraps the field, and hangs its choice over the page', async () => {
    openForm()

    expect(picker().props('corner')).toBe(true)
    const wrap = wrapper.find('.memo-with-emoji').element
    expect(wrap.contains(memoField().element)).toBe(true)
    expect(wrap.contains(smiley().element)).toBe(true)
    await click(smiley())

    expect(choice().exists()).toBe(true)
    // Placed in the screen's own pixels (EmojiPicker), not left to the flow of the form.
    expect(choice().element.style.top).not.toBe('')
    expect(choice().element.style.left).not.toBe('')
  })

  it('puts an emoji into the message, and the form hands it on', async () => {
    openForm()
    await memoField().setValue('Danke fürs Rasenmähen ')
    memoField().element.setSelectionRange(22, 22)
    await click(smiley())

    await click(emoji('🙏'))

    expect(memoField().element.value).toBe('Danke fürs Rasenmähen 🙏')
    expect(wrapper.vm.form.memo).toBe('Danke fürs Rasenmähen 🙏')
  })

  it('puts it where the caret stands', async () => {
    openForm()
    await memoField().setValue('Danke Dir')
    memoField().element.setSelectionRange(5, 5)
    await click(smiley())

    await click(emoji('🌻'))

    expect(wrapper.vm.form.memo).toBe('Danke🌻 Dir')
  })

  // A phone and a tablet have the emoji on their keyboard.
  it('is not there on a phone or a tablet', () => {
    vi.mocked(isComputer).mockReturnValue(false)
    openForm()

    expect(picker().exists()).toBe(false)
    expect(memoField().exists()).toBe(true)
  })

  // Nothing to send: the message's field takes no words, and no emoji either.
  it('is not there at a field that takes no words', () => {
    openForm({ balance: 0 })

    expect(memoField().attributes('disabled')).toBeDefined()
    expect(picker().exists()).toBe(false)
  })

  // jsdom lays nothing out: the smiley is placed in the corner of what wraps the field.
  it('is placed in what wraps the message’s field', () => {
    const code = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'TransactionForm.vue'),
      'utf8',
    )
    const style = code.slice(code.indexOf('<style')).replace(/\/\*[\s\S]*?\*\//g, '')

    expect(style.match(/\n\.memo-with-emoji\s*\{([^}]*)\}/)?.[1]).toContain('position: relative')
  })
})

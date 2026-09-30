// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { BModal } from 'bootstrap-vue-next'
import ChatImageView from './ChatImageView.vue'
import {
  chatImageViewState,
  closeChatImageView,
  forgetAllChatImages,
  openChatImageView,
  rememberChatImage,
} from '@/composables/useChatImages'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
    d: (date, format) => `${format}(${date.toISOString()})`,
  }),
}))

/** The client a picture is asked for with: each question is recorded and left open. */
const pictureServer = vi.hoisted(() => ({ asked: [] }))
vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({
    client: {
      query: (options) => new Promise(() => pictureServer.asked.push(options)),
    },
  }),
}))

/**
 * BModal as far as the view uses it: shown while its model is true, the events a test fires
 * itself (`shown`, `hidden`, and `update:modelValue` for an Esc). The names written on the real
 * tag are held against the installed package at the end of this file.
 */
const BModalStub = {
  name: 'BModal',
  props: { modelValue: Boolean },
  emits: ['update:modelValue', 'shown', 'hidden'],
  template: '<div class="modal-stub" v-bind="$attrs"><slot v-if="modelValue" /></div>',
  inheritAttrs: false,
}

const VIEW = {
  imageUuid: 'image-7',
  width: 800,
  height: 600,
  who: 'Lena',
  name: 'Lena',
  at: '2026-09-25T10:30:00.000Z',
  caption: 'So sieht unser Stand aus.',
}

describe('ChatImageView', () => {
  let wrapper

  const mountView = () => {
    wrapper = mount(ChatImageView, {
      attachTo: document.body,
      global: { stubs: { BModal: BModalStub, IMdiClose: true } },
    })
    return wrapper
  }

  const modal = () => wrapper.findComponent({ name: 'BModal' })
  const close = () => wrapper.find('[data-test="chat-image-view-close"]')

  beforeEach(() => {
    pictureServer.asked = []
    URL.createObjectURL = vi.fn(() => 'blob:the-picture')
    URL.revokeObjectURL = vi.fn()
  })
  afterEach(() => {
    wrapper?.unmount()
    closeChatImageView()
    forgetAllChatImages()
    document.body.innerHTML = ''
    delete URL.createObjectURL
    delete URL.revokeObjectURL
  })

  it('is closed while no picture is open', () => {
    mountView()
    expect(modal().props('modelValue')).toBe(false)
    expect(close().exists()).toBe(false)
  })

  /**
   * Who sent it and when, "Schließen", the picture, its caption -- a dialog named "Bild von
   * {name}", modal (BModal does not say so itself).
   */
  it('shows who sent it and when, the picture and its caption, as a named modal dialog', async () => {
    rememberChatImage('image-7', btoa('JPEG'))
    mountView()

    openChatImageView(VIEW)
    await flushPromises()

    expect(modal().props('modelValue')).toBe(true)
    expect(modal().attributes('aria-label')).toBe('chatThread.imageViewTitle {"name":"Lena"}')
    expect(modal().attributes('aria-modal')).toBe('true')
    expect(wrapper.find('[data-test="chat-image-view-who"]').text()).toContain('Lena')
    expect(wrapper.find('[data-test="chat-image-view-when"]').text()).toBe(
      'short(2026-09-25T10:30:00.000Z), time(2026-09-25T10:30:00.000Z)',
    )
    const picture = wrapper.find('[data-test="chat-image-view-picture"]')
    expect(picture.attributes('src')).toBe('blob:the-picture')
    expect(picture.attributes('width')).toBe('800')
    expect(picture.attributes('height')).toBe('600')
    // The caption as any text of the thread: its link a link.
    expect(wrapper.find('[data-test="chat-image-view-caption"]').text()).toBe(
      'So sieht unser Stand aus.',
    )
    expect(close().attributes('aria-label')).toBe('form.close')
    expect(close().attributes('title')).toBe('form.close')
  })

  it('has no caption where the picture came without words', async () => {
    mountView()
    openChatImageView({ ...VIEW, caption: '' })
    await flushPromises()

    expect(wrapper.find('[data-test="chat-image-view-caption"]').exists()).toBe(false)
  })

  // E-044 F4: "Schließen" and nothing else -- no "Speichern".
  it('offers "Schließen" and nothing to save', async () => {
    mountView()
    openChatImageView(VIEW)
    await flushPromises()

    expect(wrapper.findAll('button')).toHaveLength(1)
    expect(wrapper.find('a').exists()).toBe(false)
    expect(wrapper.html()).not.toMatch(/download|save/i)
  })

  // Tapped before it had come: a quiet surface of its size, and the picture asked for (again).
  it('waits quietly for a picture that has not come, and asks for it', async () => {
    mountView()
    openChatImageView(VIEW)
    await flushPromises()

    expect(wrapper.find('[data-test="chat-image-view-picture"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="chat-image-view-waiting"]').exists()).toBe(true)
    expect(pictureServer.asked.map((options) => options.variables.imageUuid)).toEqual(['image-7'])
  })

  it('asks for nothing it has already', async () => {
    rememberChatImage('image-7', btoa('JPEG'))
    mountView()
    openChatImageView(VIEW)
    await flushPromises()

    expect(pictureServer.asked).toEqual([])
  })

  // The one control gets the focus once the dialog is there.
  it('gives the focus to "Schließen" once it is shown', async () => {
    mountView()
    openChatImageView(VIEW)
    await flushPromises()

    modal().vm.$emit('shown')

    expect(document.activeElement).toBe(close().element)
  })

  it('closes with "Schließen"', async () => {
    mountView()
    openChatImageView(VIEW)
    await flushPromises()

    await close().trigger('click')

    expect(chatImageViewState.value).toBeNull()
    expect(modal().props('modelValue')).toBe(false)
  })

  // Esc is BModal's: it says so through its model, and the view lets the picture go.
  it('closes when the dialog closes itself, on Esc', async () => {
    mountView()
    openChatImageView(VIEW)
    await flushPromises()

    modal().vm.$emit('update:modelValue', false)
    await flushPromises()

    expect(chatImageViewState.value).toBeNull()
  })

  // A press on the dark ground beside the picture closes it; a press on the picture does not.
  it('closes on a press on the dark ground, not on one on the picture', async () => {
    rememberChatImage('image-7', btoa('JPEG'))
    mountView()
    openChatImageView(VIEW)
    await flushPromises()

    await wrapper.find('[data-test="chat-image-view-picture"]').trigger('click')
    await wrapper.find('[data-test="chat-image-view-who"]').trigger('click')
    expect(chatImageViewState.value).not.toBeNull()

    await wrapper.find('.chat-image-view-stage').trigger('click')
    expect(chatImageViewState.value).toBeNull()

    openChatImageView(VIEW)
    await flushPromises()
    await wrapper.find('.chat-image-view').trigger('click')
    expect(chatImageViewState.value).toBeNull()

    openChatImageView(VIEW)
    await flushPromises()
    await wrapper.find('.chat-image-view-bar').trigger('click')
    expect(chatImageViewState.value).toBeNull()
  })

  /**
   * While it fades out the picture stays in it; once it is gone, the focus goes back to the
   * picture in its bubble -- where that is still in the page.
   */
  it('keeps the picture while it fades out, then hands the focus back to the bubble', async () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    mountView()
    openChatImageView({ ...VIEW, opener })
    await flushPromises()

    closeChatImageView()
    await flushPromises()
    expect(wrapper.find('[data-test="chat-image-view-who"]').exists()).toBe(false)
    expect(modal().props('modelValue')).toBe(false)

    modal().vm.$emit('hidden')
    await flushPromises()

    expect(document.activeElement).toBe(opener)
  })

  it('keeps its content until the dialog is gone', async () => {
    const stub = {
      ...BModalStub,
      template: '<div class="modal-stub" v-bind="$attrs"><slot /></div>',
    }
    wrapper = mount(ChatImageView, {
      attachTo: document.body,
      global: { stubs: { BModal: stub, IMdiClose: true } },
    })
    openChatImageView(VIEW)
    await flushPromises()

    closeChatImageView()
    await flushPromises()
    // Still there, fading out…
    expect(wrapper.find('[data-test="chat-image-view-who"]').exists()).toBe(true)

    modal().vm.$emit('hidden')
    await flushPromises()
    // …and gone once the dialog is.
    expect(wrapper.find('[data-test="chat-image-view-who"]').exists()).toBe(false)
  })

  it('leaves the focus alone where the bubble has gone meanwhile', async () => {
    const opener = document.createElement('button')
    const elsewhere = document.createElement('button')
    document.body.append(opener, elsewhere)
    mountView()
    openChatImageView({ ...VIEW, opener })
    await flushPromises()
    opener.remove()
    elsewhere.focus()

    closeChatImageView()
    modal().vm.$emit('hidden')
    await flushPromises()

    expect(document.activeElement).toBe(elsewhere)
  })

  // The state outlives the view: it goes with the view, so no picture opens by itself later.
  it('lets the picture go when it is taken away itself', async () => {
    mountView()
    openChatImageView(VIEW)
    await flushPromises()

    wrapper.unmount()
    wrapper = null

    expect(chatImageViewState.value).toBeNull()
  })

  const style = () =>
    readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'ChatImageView.vue'),
      'utf8',
    ).replace(/\/\*[\s\S]*?\*\//g, '')

  /**
   * ⛔ What only the stylesheet holds (jsdom lays nothing out): the picture fills the room between
   * bar and caption in its proportions -- on a phone it grows, at the desk (from the house's 1025 px)
   * it stops at twice its size -- and the dark ground wins over dark mode's `!important` surface
   * of every dialog (gradido-template-dark.scss: `.dark-mode .modal-content`, 0-2-0).
   */
  it('fills the screen in its proportions, at most twice its size at the desk, on a dark ground', () => {
    const code = style()
    const rule = (selector) => code.match(new RegExp(`\\n${selector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''

    expect(rule('\\.chat-image-view-stage')).toMatch(/container-type:\s*size/)
    const picture = rule('\\.chat-image-view-picture,\\s*\\.chat-image-view-waiting')
    expect(picture).toMatch(/width:\s*min\(100cqw,\s*100cqh \* var\(--chat-image-ratio/)
    expect(picture).toMatch(/aspect-ratio:\s*var\(--chat-image-ratio/)
    const desk = code.match(/@media \(width >= 1025px\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''
    expect(desk).toMatch(/var\(--chat-image-twice/)
    expect(code).not.toMatch(/992px/)

    const ground = rule('\\.modal \\.modal-content\\.chat-image-view-content')
    expect(ground).toMatch(/background-color:\s*rgb\(10 10 12\) !important/)
    expect(rule('\\.chat-image-view-close')).toMatch(/width:\s*2\.75rem/)
    expect(rule('\\.chat-image-view-close:focus-visible')).toMatch(/outline:\s*2px solid/)
  })

  /**
   * ⛔ The view is dark in both themes, the links of its caption were not: the light theme's green
   * came to 2.81:1 on the dark ground (measured, P7c). They take the dark theme's green in both --
   * all but a file card, which brings its own surface and colours.
   */
  it('gives the caption’s links the dark theme’s green, whatever the theme', async () => {
    const code = style()
    const links = code.match(
      /\n\.modal \.chat-image-view-caption :is\(a:not\(\.chat-file-card\), \.chat-video-link-copy\)\s*\{([^}]*)\}/,
    )?.[1]
    expect(links).toMatch(/color:\s*#3db85f/)

    mountView()
    openChatImageView({ ...VIEW, caption: 'Mehr dazu: https://gradido.net/de/' })
    await flushPromises()
    expect(wrapper.find('[data-test="chat-image-view-caption"] a').attributes('href')).toBe(
      'https://gradido.net/de/',
    )
  })

  it('tells the stylesheet the picture’s proportions and twice its size', async () => {
    mountView()
    openChatImageView(VIEW)
    await flushPromises()

    const stage = wrapper.find('.chat-image-view-stage').attributes('style')
    expect(stage).toContain('--chat-image-ratio: 1.3333333333333333')
    expect(stage).toContain('--chat-image-twice: 1600px')
  })

  /**
   * ⛔ The dialog's names against the installed bootstrap-vue-next -- an unknown one is taken as a
   * plain attribute and does nothing (ContactWindow.modalProps.spec). The stub above declares
   * whatever it is given, so only the source against the package can say it.
   */
  it('writes on its dialog only names the installed BModal declares', () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'ChatImageView.vue'),
      'utf8',
    ).replace(/<!--[\s\S]*?-->/g, '')
    const tags = [...source.matchAll(/<BModal\b([\s\S]*?)>/g)]
    expect(tags).toHaveLength(1)

    const written = [...tags[0][1].matchAll(/(?:^|\s)(:|@)?([a-z][a-z0-9:-]*)(?==|\s|$)/g)].map(
      (m) => (m[1] === '@' ? `@${m[2]}` : m[2]),
    )
    const camel = (name) => name.replace(/-([a-z])/g, (unused, letter) => letter.toUpperCase())
    const declaredProps = Object.keys(BModal.props ?? {})
    const declaredEvents = [...(BModal.emits ?? [])]
    expect(declaredProps.length).toBeGreaterThan(0)
    const OURS = ['data-test', 'aria-label', 'aria-modal']
    const unknown = written
      .filter((name) => !OURS.includes(name))
      .filter((name) =>
        name.startsWith('@')
          ? !declaredEvents.includes(camel(name.slice(1)))
          : !declaredProps.includes(camel(name)),
      )

    expect(unknown).toEqual([])
    expect(written).toEqual(
      expect.arrayContaining([
        'model-value',
        'fullscreen',
        'no-header',
        'no-footer',
        'autofocus',
        'content-class',
        'body-class',
        '@update:model-value',
        '@shown',
        '@hidden',
      ]),
    )
  })
})

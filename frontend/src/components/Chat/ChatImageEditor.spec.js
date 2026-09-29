// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { BModal } from 'bootstrap-vue-next'
import ChatImageEditor from './ChatImageEditor.vue'
import { CHAT_IMAGE_UNEDITED } from '@/utils/chatImageEdit'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
    n: (value) => `#${value}`,
  }),
}))

/**
 * BModal as far as the editor uses it: shown while its model is true, the events a test fires
 * itself (`shown`, `hidden`, and `update:modelValue` for an Esc). The names written on the real tag
 * are held against the installed package at the end of this file.
 */
const BModalStub = {
  name: 'BModal',
  props: { modelValue: Boolean },
  emits: ['update:modelValue', 'shown', 'hidden'],
  template: '<div class="modal-stub" v-bind="$attrs"><slot v-if="modelValue" /></div>',
  inheritAttrs: false,
}

/** A camera photo as openChatImage hands it on. */
const PHOTO = { image: { name: 'photo' }, width: 4000, height: 3000 }
/** The stage as a phone lays it out, in CSS pixels. */
const STAGE = { width: 390, height: 520 }

describe('ChatImageEditor', () => {
  let wrapper

  /**
   * jsdom has no 2D context: each canvas gets a recording one and remembers what was drawn on it
   * last. The editor's working copy is a canvas too, so what the stage was drawn from can be told.
   */
  const recordDrawing = () =>
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function () {
      const canvas = this
      canvas.steps = []
      const record =
        (name) =>
        (...args) =>
          canvas.steps.push([name, ...args])
      return {
        save: record('save'),
        restore: record('restore'),
        translate: record('translate'),
        scale: record('scale'),
        rotate: record('rotate'),
        clearRect: record('clearRect'),
        drawImage: (image, ...args) => {
          canvas.shown = image
          canvas.steps.push(['drawImage', image, ...args])
        },
      }
    })

  beforeEach(() => {
    recordDrawing()
  })
  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  const modal = () => wrapper.findComponent({ name: 'BModal' })
  const stage = () => wrapper.find('[data-test="chat-image-editor-stage"]')
  const canvas = () => wrapper.find('[data-test="chat-image-editor-canvas"]')
  const frame = () => wrapper.find('[data-test="chat-image-editor-frame"]')
  const readout = () => wrapper.find('[data-test="chat-image-editor-readout"]').text()
  const shape = (name) => wrapper.find(`[data-test="chat-image-editor-shape-${name}"]`)
  const zoom = () => wrapper.find('[data-test="chat-image-editor-zoom"]')
  const doneButton = () => wrapper.find('[data-test="chat-image-editor-done"]')

  const mountEditor = (props = {}) => {
    wrapper = mount(ChatImageEditor, {
      attachTo: document.body,
      props: { modelValue: true, source: PHOTO, edit: CHAT_IMAGE_UNEDITED, ...props },
      global: {
        stubs: { BModal: BModalStub, IBiArrowClockwise: true, IBiSymmetryVertical: true },
      },
    })
    return wrapper
  }

  /** The dialog on the screen: the stage gets its size, as a phone lays it out. */
  const show = async (size = STAGE) => {
    Object.defineProperty(stage().element, 'clientWidth', { value: size.width, configurable: true })
    Object.defineProperty(stage().element, 'clientHeight', {
      value: size.height,
      configurable: true,
    })
    modal().vm.$emit('shown')
    await flushPromises()
  }

  const pointer = (type, x, y, extra = {}) =>
    stage().trigger(type, { clientX: x, clientY: y, pointerId: 1, pointerType: 'touch', ...extra })

  /** What "Fertig" hands back. */
  const finish = async () => {
    await doneButton().trigger('click')
    return wrapper.emitted('done')?.at(-1)?.[0]
  }

  describe('the dialog', () => {
    it('is a dialog of its own, named, modal, full screen on a phone', () => {
      mountEditor()

      expect(modal().props('modelValue')).toBe(true)
      expect(modal().attributes('aria-label')).toBe('chatThread.imageEdit')
      expect(modal().attributes('aria-modal')).toBe('true')
      expect(modal().attributes('fullscreen')).toBe('sm')
      expect(wrapper.find('.chat-image-editor-title').text()).toBe('chatThread.imageEdit')
    })

    it('shows nothing without a picture', () => {
      mountEditor({ source: null })
      expect(stage().exists()).toBe(false)
    })

    it('gives the focus to "Fertig" once it is on the screen', async () => {
      mountEditor()
      await show()

      expect(document.activeElement).toBe(doneButton().element)
      expect(doneButton().text()).toBe('chatThread.imageEditDone')
    })

    /** "Fertig" hands back what was done, and closes. */
    it('hands back what was done with "Fertig"', async () => {
      mountEditor()
      await shape('square').trigger('click')

      const edit = await finish()

      expect(edit).toEqual({ ...CHAT_IMAGE_UNEDITED, shape: 'square' })
      expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    })

    it('closes with "Abbrechen", handing back nothing', async () => {
      mountEditor()
      await shape('square').trigger('click')

      await wrapper.find('[data-test="chat-image-editor-cancel"]').trigger('click')

      expect(wrapper.find('[data-test="chat-image-editor-cancel"]').text()).toBe('form.cancel')
      expect(wrapper.emitted('done')).toBeUndefined()
      expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    })

    // Esc, or a press beside the dialog: as "Abbrechen".
    it('closes on Esc, handing back nothing', async () => {
      mountEditor()
      await shape('square').trigger('click')

      modal().vm.$emit('update:modelValue', false)
      await flushPromises()

      expect(wrapper.emitted('done')).toBeUndefined()
      expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    })

    // Opened again, it starts from what the bar holds, not from a draft that was let go.
    it('starts again from the edit it is given each time it opens', async () => {
      mountEditor({ edit: { ...CHAT_IMAGE_UNEDITED, shape: 'portrait' } })
      expect(shape('portrait').attributes('aria-pressed')).toBe('true')
      await shape('square').trigger('click')

      await wrapper.setProps({ modelValue: false })
      await wrapper.setProps({ modelValue: true })

      expect(shape('portrait').attributes('aria-pressed')).toBe('true')
      expect(shape('square').attributes('aria-pressed')).toBe('false')
    })
  })

  describe('the tools', () => {
    it('says how much of the picture is kept', () => {
      mountEditor()
      expect(readout()).toBe('chatThread.imageCut {"width":"#4000","height":"#3000"}')
    })

    it('offers the four shapes, the one in use pressed', async () => {
      mountEditor()

      const shapes = wrapper.findAll('.chat-image-editor-shape')
      expect(shapes.map((button) => button.text())).toEqual([
        'chatThread.imageShapeOriginal',
        'chatThread.imageShapeLandscape',
        'chatThread.imageShapePortrait',
        'chatThread.imageShapeSquare',
      ])
      expect(shapes.map((button) => button.attributes('aria-pressed'))).toEqual([
        'true',
        'false',
        'false',
        'false',
      ])
      expect(wrapper.find('.chat-image-editor-shapes').attributes('aria-label')).toBe(
        'chatThread.imageShape',
      )

      await shape('square').trigger('click')
      expect(shape('square').attributes('aria-pressed')).toBe('true')
      expect(shape('original').attributes('aria-pressed')).toBe('false')
      expect(readout()).toBe('chatThread.imageCut {"width":"#3000","height":"#3000"}')
    })

    // A new shape starts with its largest cutout: the size goes back to 1.
    it('starts the size over with a new shape', async () => {
      mountEditor()
      await zoom().setValue('2')

      await shape('square').trigger('click')

      expect(readout()).toBe('chatThread.imageCut {"width":"#3000","height":"#3000"}')
      expect(zoom().element.value).toBe('1')
    })

    it('makes the picture larger under the frame with "Größe", up to four times', async () => {
      mountEditor()
      expect(zoom().attributes('min')).toBe('1')
      expect(zoom().attributes('max')).toBe('4')
      expect(zoom().element.closest('label').textContent).toContain('chatThread.imageZoom')

      await zoom().setValue('2')

      expect(readout()).toBe('chatThread.imageCut {"width":"#2000","height":"#1500"}')
    })

    it('turns a quarter clockwise and starts the size over', async () => {
      mountEditor()
      await zoom().setValue('2')

      const turn = wrapper.find('[data-test="chat-image-editor-turn"]')
      expect(turn.text()).toBe('chatThread.imageTurn')
      await turn.trigger('click')

      expect(readout()).toBe('chatThread.imageCut {"width":"#3000","height":"#4000"}')
      expect(zoom().element.value).toBe('1')
      expect((await finish()).turn).toBe(90)
    })

    it('mirrors, and says so', async () => {
      mountEditor()
      const mirror = wrapper.find('[data-test="chat-image-editor-mirror"]')
      expect(mirror.text()).toBe('chatThread.imageMirror')
      expect(mirror.attributes('aria-pressed')).toBe('false')

      await mirror.trigger('click')

      expect(mirror.attributes('aria-pressed')).toBe('true')
      expect((await finish()).mirrored).toBe(true)
    })
  })

  describe('the stage', () => {
    /**
     * The frame as large as the room allows, 18 pixels from the edges, in the cutout's shape: a
     * 4 : 3 photo in a phone's stage of 390 x 520 is 354 x 265.5, in the middle.
     */
    it('stands the frame in the middle, in the cutout’s shape', async () => {
      mountEditor()
      await show()

      expect(frame().attributes('style')).toBe(
        'left: 18px; top: 127.25px; width: 354px; height: 265.5px;',
      )
      await shape('portrait').trigger('click')
      // 3 : 4 in 354 x 484: as wide as the room allows, 472 high
      expect(frame().attributes('style')).toBe(
        'left: 18px; top: 24px; width: 354px; height: 472px;',
      )
    })

    // At the desk the stage is wider than high: a portrait frame is as high as the room allows.
    it('lets the height set the frame where the room is low', async () => {
      mountEditor()
      await show({ width: 460, height: 450 })
      await shape('portrait').trigger('click')

      // 3 : 4 in 424 x 414: 310.5 wide, 414 high
      expect(frame().attributes('style')).toBe(
        'left: 74.75px; top: 18px; width: 310.5px; height: 414px;',
      )
    })

    // Drawn with the cutout on the frame and the rest around it -- the same drawing as the preview.
    it('draws the picture with the cutout on the frame', async () => {
      mountEditor({ source: { ...PHOTO, width: 1200, height: 900 } })
      await show()

      const drawn = canvas().element
      expect([drawn.width, drawn.height]).toEqual([390, 520])
      expect(drawn.shown).toEqual({ name: 'photo' })
      const steps = drawn.steps.filter((step) => step[0] !== 'clearRect')
      expect(steps[1]).toEqual(['translate', 195, 260])
    })

    /** A finger moves the PICTURE: dragged to the left, the cutout goes to the right. */
    it('moves the picture with a finger, as far as the picture reaches', async () => {
      mountEditor()
      await show()
      await zoom().setValue('2')

      await pointer('pointerdown', 200, 200)
      await pointer('pointermove', 150, 200)
      await pointer('pointerup', 150, 200)
      // …and nothing moves after the finger is lifted
      await pointer('pointermove', 50, 50)

      const edit = await finish()
      // 50 CSS pixels at 354 / 2000 are 282.5 pixels of the picture, of 1000 to either side
      expect(edit.panX).toBeCloseTo(0.2825, 4)
      expect(edit.panY).toBe(0)
    })

    it('marks the stage while a finger holds it', async () => {
      mountEditor()
      await show()

      await pointer('pointerdown', 10, 10)
      expect(stage().classes()).toContain('is-dragging')
      await pointer('pointercancel', 10, 10)
      expect(stage().classes()).not.toContain('is-dragging')
    })

    // A right-hand mouse button is no drag.
    it('leaves a press of another mouse button alone', async () => {
      mountEditor()
      await show()
      await zoom().setValue('2')

      await pointer('pointerdown', 200, 200, { pointerType: 'mouse', button: 2 })
      await pointer('pointermove', 100, 200, { pointerType: 'mouse', button: 2 })

      expect((await finish()).panX).toBe(0)
    })

    it('makes the picture larger with the wheel, as the avatar’s cropper does', async () => {
      mountEditor()
      await show()

      await stage().trigger('wheel', { deltaY: -250 })

      expect((await finish()).zoom).toBeCloseTo(1.5)
    })

    /** The keyboard's way: the arrows move the picture a twentieth of the frame, + and - size it. */
    it('moves and sizes the picture with the keys', async () => {
      mountEditor()
      await show()
      expect(stage().attributes('tabindex')).toBe('0')
      expect(stage().attributes('aria-label')).toBe('chatThread.imageStage')
      await zoom().setValue('2')

      await stage().trigger('keydown', { key: 'ArrowRight' })
      await stage().trigger('keydown', { key: 'ArrowUp' })
      await stage().trigger('keydown', { key: '+' })

      const edit = await finish()
      // 17.7 CSS pixels at 354 / 2000 are 100 pixels of the picture
      expect(edit.panX).toBeCloseTo(-0.1, 4)
      expect(edit.panY).toBeCloseTo(0.1333, 3)
      expect(edit.zoom).toBeCloseTo(2.25)
    })

    it('leaves other keys to the page', async () => {
      mountEditor()
      await show()
      const tab = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true, bubbles: true })

      stage().element.dispatchEvent(tab)

      expect(tab.defaultPrevented).toBe(false)
    })

    /**
     * While a finger moves, the stage is drawn from a smaller copy; once things are quiet, from the
     * whole picture again (the avatar's cropper, measured by Bernd).
     */
    it('draws from a smaller copy while moving, and from the whole picture once quiet', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      mountEditor()
      await show()
      vi.advanceTimersByTime(200)
      expect(canvas().element.shown).toEqual({ name: 'photo' })

      await pointer('pointerdown', 200, 200)
      await pointer('pointermove', 190, 200)
      await flushPromises()
      const copy = canvas().element.shown
      expect(copy).toBeInstanceOf(HTMLCanvasElement)
      expect([copy.width, copy.height]).toEqual([1600, 1200])

      vi.advanceTimersByTime(90)
      expect(canvas().element.shown).toEqual({ name: 'photo' })
    })

    it('stops watching the stage once the dialog is gone', async () => {
      const disconnected = vi.fn()
      vi.stubGlobal(
        'ResizeObserver',
        class {
          observe() {}
          disconnect() {
            disconnected()
          }
        },
      )
      mountEditor()
      await show()

      modal().vm.$emit('hidden')

      expect(disconnected).toHaveBeenCalledTimes(1)
    })
  })

  /**
   * What only the stylesheet holds (jsdom lays nothing out): dark in both modes, above dark mode's
   * `!important` surface of every dialog, and a stage a finger can move on without the page
   * scrolling under it.
   */
  it('stays dark in both modes and keeps the page still under a finger', () => {
    const code = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'ChatImageEditor.vue'),
      'utf8',
    ).replace(/\/\*[\s\S]*?\*\//g, '')
    const rule = (selector) => code.match(new RegExp(`\\n${selector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''

    expect(rule('\\.modal \\.modal-content\\.chat-image-editor-content')).toMatch(
      /background-color:\s*rgb\(10 10 12\) !important/,
    )
    expect(rule('\\.chat-image-editor-stage')).toMatch(/touch-action:\s*none/)
    expect(rule('\\.chat-image-editor-frame')).toMatch(/box-shadow:\s*0 0 0 100vmax/)
  })

  /**
   * ⛔ Only names the installed BModal declares: an unknown one (the Vue-2 `hide-header`) is taken
   * silently as a plain attribute and does nothing (ContactWindow.modalProps.spec). The stub above
   * declares whatever it is given, so only the source against the package can say it.
   */
  it('writes on its dialog only names the installed BModal declares', () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'ChatImageEditor.vue'),
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
        'centered',
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

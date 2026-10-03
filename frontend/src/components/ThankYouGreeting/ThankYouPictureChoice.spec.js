// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { isComputer } from '@/utils/isComputer'
import { THANK_YOU_PICTURE_GROUND } from '@/utils/thankYouPicture'
import ThankYouPictureChoice from './ThankYouPictureChoice.vue'

/**
 * The choice of a greeting's picture, with the wallet's own texts: the five motifs, the tile for
 * a photo of one's own, and "Foto aufnehmen". Opening a file and the editor have their own specs
 * (utils/chatImage.spec.js, ChatImageEditor.spec.js); here they answer as a test says.
 */
vi.mock('@/utils/isComputer', () => ({ isComputer: vi.fn(() => false) }))

const pictures = vi.hoisted(() => ({ openChatImage: vi.fn(), thankYouPicturePreview: vi.fn() }))
vi.mock('@/utils/chatImage', async (importOriginal) => ({
  ...(await importOriginal()),
  openChatImage: (...args) => pictures.openChatImage(...args),
}))
vi.mock('@/utils/thankYouPicture', async (importOriginal) => ({
  ...(await importOriginal()),
  thankYouPicturePreview: (...args) => pictures.thankYouPicturePreview(...args),
}))

/** The editor as far as the choice uses it: open or not, what it was handed, and its two ends. */
const EditorStub = {
  name: 'ChatImageEditor',
  props: { modelValue: Boolean, source: Object, edit: Object },
  emits: ['update:modelValue', 'done'],
  template: '<div data-test="editor-stub" />',
}

const PHOTO = { image: { name: 'photo' }, width: 3000, height: 4000 }
const OTHER = { image: { name: 'other' }, width: 4000, height: 3000 }
const FRAMED = { turn: 0, mirrored: false, shape: 'original', zoom: 1, panX: 0, panY: 0 }
const CARD_EDIT = { ...FRAMED, frame: 36 / 25, ground: THANK_YOU_PICTURE_GROUND }
const file = (name = 'oma.jpg') => new File(['x'], name, { type: 'image/jpeg' })

/** A promise a test settles when it wants. */
const deferred = () => {
  const settle = {}
  const promise = new Promise((resolve, reject) => Object.assign(settle, { resolve, reject }))
  return { promise, ...settle }
}

describe('ThankYouPictureChoice', () => {
  let wrapper

  const mountChoice = (props = {}) => {
    wrapper = mount(ThankYouPictureChoice, {
      props: { motif: 'heart-leaves', photo: null, ...props },
      global: { plugins: [i18n], stubs: { ChatImageEditor: EditorStub } },
      attachTo: document.body,
    })
    return wrapper
  }

  const data = (name) => wrapper.find(`[data-test="thank-you-greeting-${name}"]`)
  const editor = () => wrapper.findComponent(EditorStub)
  const tiles = () => wrapper.findAll('.tyg-motif')

  /** The device's picker, or its camera, answers with a file. */
  const answer = async (field, chosen = file()) => {
    Object.defineProperty(field.element, 'files', {
      value: chosen ? [chosen] : [],
      configurable: true,
    })
    await field.trigger('change')
    await flushPromises()
  }

  /** A photo in its tile, as the page hands it back. */
  const photo = (extra = {}) => ({
    source: PHOTO,
    edit: CARD_EDIT,
    preview: 'data:image/jpeg;base64,FIRST',
    ...extra,
  })

  beforeEach(() => {
    vi.clearAllMocks()
    i18n.global.locale.value = 'de'
    isComputer.mockReturnValue(false)
    pictures.openChatImage.mockResolvedValue(PHOTO)
    pictures.thankYouPicturePreview.mockReturnValue('data:image/jpeg;base64,PREVIEW')
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
  })

  describe('the tiles', () => {
    it('shows the five motifs and, sixth, the tile for a photo of one’s own', () => {
      mountChoice()

      expect(tiles().map((tile) => tile.find('.tyg-motif-name').text())).toEqual([
        'Herz und Blätter',
        'Gebende Hände',
        'Blumenstrauß',
        'Leuchtender Kringel',
        'Morgenlicht',
        'Eigenes Foto',
      ])
      expect(tiles()[5].attributes('data-test')).toBe('thank-you-greeting-own')
    })

    it('marks the motif that is the choice, and no other tile', () => {
      mountChoice({ motif: 'bouquet' })

      expect(tiles().map((tile) => tile.classes('is-chosen'))).toEqual([
        false,
        false,
        true,
        false,
        false,
        false,
      ])
      expect(data('motif-bouquet').attributes('aria-pressed')).toBe('true')
      expect(wrapper.findAll('.tyg-motif-check')).toHaveLength(1)
    })

    it('hands on the motif a tap chooses', async () => {
      mountChoice()

      await data('motif-morning-light').trigger('click')

      expect(wrapper.emitted('update:motif')).toEqual([['morning-light']])
      expect(wrapper.emitted('update:photo')).toBeUndefined()
    })
  })

  describe('the empty tile', () => {
    it('is an offer: a broken line around an empty room, with its name', () => {
      mountChoice()

      expect(data('own').classes()).toContain('is-empty')
      expect(data('own').classes()).not.toContain('is-chosen')
      expect(data('own').find('img').exists()).toBe(false)
      expect(data('own').find('button').exists()).toBe(false)
      expect(data('photo-other').exists()).toBe(false)
    })

    /**
     * ⛔ A label for a file field hidden only from the eye: the label opens the field without a
     * line of script, and the field stays in the tab order (FOTO-04).
     */
    it('is the label of a file field that takes pictures, hidden only from the eye', () => {
      mountChoice()
      const field = data('photo-picker')

      expect(data('photo-choose').element.tagName).toBe('LABEL')
      expect(data('photo-choose').attributes('for')).toBe(field.attributes('id'))
      expect(field.attributes('type')).toBe('file')
      expect(field.attributes('accept')).toBe('image/*')
      // Here the picker offers the photos and the files: no camera forced.
      expect(field.attributes('capture')).toBeUndefined()
      expect(field.classes()).toContain('visually-hidden')
      expect(field.attributes('tabindex')).toBeUndefined()
      expect(field.attributes('hidden')).toBeUndefined()
    })
  })

  describe('"Foto aufnehmen"', () => {
    it('stands under the tiles on a phone, and its field asks for the camera', () => {
      mountChoice()
      const field = data('camera-field')

      expect(data('camera').text()).toBe('Foto aufnehmen')
      expect(data('camera').element.tagName).toBe('LABEL')
      expect(data('camera').attributes('for')).toBe(field.attributes('id'))
      expect(field.attributes('type')).toBe('file')
      expect(field.attributes('accept')).toBe('image/*')
      expect(field.attributes('capture')).toBe('environment')
      expect(field.classes()).toContain('visually-hidden')
      // two fields, two ids
      expect(field.attributes('id')).not.toBe(data('photo-picker').attributes('id'))
    })

    // ⛔ A computer's browser takes no notice of `capture`: there is no such row there at all.
    it('is not there on a computer', () => {
      isComputer.mockReturnValue(true)
      mountChoice()

      expect(data('camera').exists()).toBe(false)
      expect(data('camera-field').exists()).toBe(false)
      expect(wrapper.findAll('input[type="file"]')).toHaveLength(1)
      expect(wrapper.text()).not.toContain('Foto aufnehmen')
    })

    it('takes a photo the way the tile takes one', async () => {
      mountChoice()
      const taken = file('IMG_0042.jpg')

      await answer(data('camera-field'), taken)

      expect(pictures.openChatImage).toHaveBeenCalledWith(taken)
      expect(editor().props()).toMatchObject({ modelValue: true, source: PHOTO, edit: CARD_EDIT })
    })
  })

  describe('a photo chosen', () => {
    it('is opened and handed to the editor, filling the card’s frame', async () => {
      mountChoice()
      const chosen = file()
      expect(editor().props('modelValue')).toBe(false)

      await answer(data('photo-picker'), chosen)

      expect(pictures.openChatImage).toHaveBeenCalledTimes(1)
      expect(pictures.openChatImage).toHaveBeenCalledWith(chosen)
      expect(editor().props('modelValue')).toBe(true)
      expect(editor().props('source')).toBe(PHOTO)
      // the card's frame 36 : 25 on the card's ground, at the size that fills it
      expect(editor().props('edit')).toEqual(CARD_EDIT)
    })

    // Nothing is chosen until "Fertig" says so.
    it('is not the choice yet while the editor is open', async () => {
      mountChoice()

      await answer(data('photo-picker'))

      expect(wrapper.emitted('update:photo')).toBeUndefined()
      expect(wrapper.emitted('update:motif')).toBeUndefined()
      expect(pictures.thankYouPicturePreview).not.toHaveBeenCalled()
    })

    // Emptied, so the same file chosen again is a change again.
    it('empties the field once it has the file', async () => {
      mountChoice()
      const field = data('photo-picker')
      const emptied = vi.spyOn(field.element, 'value', 'set')

      await answer(field)

      expect(emptied).toHaveBeenCalledWith('')
    })

    it('becomes the choice with "Fertig": the photo, what was done to it, and its picture', async () => {
      mountChoice()
      await answer(data('photo-picker'))
      const edit = { ...CARD_EDIT, zoom: 0.52 }

      editor().vm.$emit('done', edit)
      await flushPromises()

      expect(pictures.thankYouPicturePreview).toHaveBeenCalledTimes(1)
      expect(pictures.thankYouPicturePreview).toHaveBeenCalledWith(PHOTO, edit)
      expect(wrapper.emitted('update:photo')).toEqual([
        [{ source: PHOTO, edit, preview: 'data:image/jpeg;base64,PREVIEW' }],
      ])
      expect(wrapper.emitted('update:motif')).toEqual([[null]])
    })

    it('leaves the choice as it was with "Abbrechen"', async () => {
      mountChoice()
      await answer(data('photo-picker'))

      editor().vm.$emit('update:modelValue', false)
      await flushPromises()

      expect(editor().props('modelValue')).toBe(false)
      expect(wrapper.emitted('update:photo')).toBeUndefined()
      expect(wrapper.emitted('update:motif')).toBeUndefined()
    })

    it('does nothing where the picker was closed without a file', async () => {
      mountChoice()

      await answer(data('photo-picker'), null)

      expect(pictures.openChatImage).not.toHaveBeenCalled()
      expect(editor().props('modelValue')).toBe(false)
    })

    /** Only the last photo chosen counts: the first one's answer, whenever it comes, is let go. */
    it('opens the editor with the last photo chosen, whichever is opened first', async () => {
      mountChoice()
      const first = deferred()
      pictures.openChatImage.mockReturnValueOnce(first.promise).mockResolvedValueOnce(OTHER)

      await answer(data('photo-picker'), file('first.jpg'))
      await answer(data('photo-picker'), file('second.jpg'))
      expect(editor().props('source')).toBe(OTHER)

      first.resolve(PHOTO)
      await flushPromises()

      expect(editor().props('source')).toBe(OTHER)
    })

    it('says for the ear that a photo is being opened, and marks the tile', async () => {
      mountChoice()
      const opening = deferred()
      pictures.openChatImage.mockReturnValueOnce(opening.promise)
      const status = data('picture-status')
      expect(status.attributes('role')).toBe('status')
      expect(status.text()).toBe('')
      expect(data('own').attributes('aria-busy')).toBeUndefined()

      await answer(data('photo-picker'))
      expect(status.text()).toBe('Bild wird vorbereitet …')
      expect(data('own').attributes('aria-busy')).toBe('true')

      opening.resolve(PHOTO)
      await flushPromises()
      expect(status.text()).toBe('')
      expect(data('own').attributes('aria-busy')).toBeUndefined()
    })
  })

  describe('a photo in its tile', () => {
    it('stands there with the tick of the chosen tile', () => {
      mountChoice({ motif: null, photo: photo() })

      expect(data('own').classes()).toContain('is-chosen')
      expect(data('own').classes()).not.toContain('is-empty')
      expect(data('photo-picture').attributes('src')).toBe('data:image/jpeg;base64,FIRST')
      // the name stands beside it, as with the motifs
      expect(data('photo-picture').attributes('alt')).toBe('')
      expect(data('photo').attributes('aria-pressed')).toBe('true')
      expect(data('photo').find('.tyg-motif-name').text()).toBe('Eigenes Foto')
      expect(data('photo').find('.tyg-motif-check').exists()).toBe(true)
      expect(wrapper.findAll('.tyg-motif-check')).toHaveLength(1)
      expect(data('photo-choose').exists()).toBe(false)
    })

    // 36 : 25 before the picture has come: nothing moves when it does.
    it('gives its picture the room of a motif', () => {
      mountChoice({ motif: null, photo: photo() })

      expect(data('photo-picture').attributes('width')).toBe('360')
      expect(data('photo-picture').attributes('height')).toBe('250')
    })

    /** How another photo is chosen, the tile says itself -- without a window of its own. */
    it('says how another photo is chosen: the label of the same field', () => {
      mountChoice({ motif: null, photo: photo() })

      expect(data('photo-other').text()).toBe('Anderes Foto')
      expect(data('photo-other').element.tagName).toBe('LABEL')
      expect(data('photo-other').attributes('for')).toBe(data('photo-picker').attributes('id'))
      expect(wrapper.findAll('input[type="file"]')).toHaveLength(2)
    })

    // The field between the photo and its label: the keyboard walks them in the order they are seen.
    it('keeps the photo, the field and "Anderes Foto" in the order they are seen', () => {
      mountChoice({ motif: null, photo: photo() })

      expect([...data('own').element.children].map((child) => child.tagName)).toEqual([
        'BUTTON',
        'INPUT',
        'LABEL',
      ])
    })

    it('opens its cutout once more with a tap, from what was done to it', async () => {
      const edit = { ...CARD_EDIT, zoom: 2, panX: 0.4 }
      mountChoice({ motif: null, photo: photo({ edit }) })

      await data('photo').trigger('click')

      expect(editor().props()).toMatchObject({ modelValue: true, source: PHOTO, edit })
      expect(pictures.openChatImage).not.toHaveBeenCalled()
      expect(wrapper.emitted('update:motif')).toBeUndefined()
    })

    it('says so to whoever does not see it', () => {
      mountChoice({ motif: null, photo: photo() })

      expect(data('photo').find('.visually-hidden').text()).toBe('Bild bearbeiten')
    })

    it('takes the new cutout over with "Fertig": the same photo, a new picture', async () => {
      mountChoice({ motif: null, photo: photo() })
      await data('photo').trigger('click')
      const edit = { ...CARD_EDIT, turn: 90 }

      editor().vm.$emit('done', edit)
      await flushPromises()

      expect(wrapper.emitted('update:photo')).toEqual([
        [{ source: PHOTO, edit, preview: 'data:image/jpeg;base64,PREVIEW' }],
      ])
    })

    it('takes another photo in its place, once "Fertig" says so', async () => {
      mountChoice({ motif: null, photo: photo() })
      pictures.openChatImage.mockResolvedValueOnce(OTHER)

      await answer(data('photo-picker'), file('other.jpg'))
      // not yet: the tile still shows the first one
      expect(wrapper.emitted('update:photo')).toBeUndefined()
      expect(editor().props()).toMatchObject({ source: OTHER, edit: CARD_EDIT })

      editor().vm.$emit('done', CARD_EDIT)
      await flushPromises()

      expect(wrapper.emitted('update:photo')).toEqual([
        [{ source: OTHER, edit: CARD_EDIT, preview: 'data:image/jpeg;base64,PREVIEW' }],
      ])
    })

    // "Abbrechen" leaves the choice as it was: the first photo stays in its tile.
    it('keeps the photo it has where the other one is let go', async () => {
      mountChoice({ motif: null, photo: photo() })
      pictures.openChatImage.mockResolvedValueOnce(OTHER)
      await answer(data('photo-picker'), file('other.jpg'))

      editor().vm.$emit('update:modelValue', false)
      await flushPromises()

      expect(wrapper.emitted('update:photo')).toBeUndefined()
      expect(data('photo-picture').attributes('src')).toBe('data:image/jpeg;base64,FIRST')
    })

    describe('while a motif is the choice again', () => {
      it('stays in its tile, without the tick', () => {
        mountChoice({ motif: 'bouquet', photo: photo() })

        expect(data('photo-picture').attributes('src')).toBe('data:image/jpeg;base64,FIRST')
        expect(data('own').classes()).not.toContain('is-chosen')
        expect(data('photo').attributes('aria-pressed')).toBe('false')
        expect(data('photo').find('.tyg-motif-check').exists()).toBe(false)
        expect(data('photo').find('.visually-hidden').exists()).toBe(false)
        expect(data('motif-bouquet').attributes('aria-pressed')).toBe('true')
        expect(data('photo-other').exists()).toBe(true)
      })

      // A tap chooses, as on every tile; the cutout opens with a tap on the chosen photo.
      it('becomes the choice again with a tap, without opening the cutout', async () => {
        mountChoice({ motif: 'bouquet', photo: photo() })

        await data('photo').trigger('click')

        expect(wrapper.emitted('update:motif')).toEqual([[null]])
        expect(wrapper.emitted('update:photo')).toBeUndefined()
        expect(editor().props('modelValue')).toBe(false)
      })
    })
  })

  /** What cannot be opened, the page says with the sentences the chat says it with. */
  describe('a photo that cannot be opened', () => {
    const refuse = (problem) =>
      pictures.openChatImage.mockRejectedValueOnce(
        Object.assign(new Error(`CHAT_IMAGE_${problem}`), { name: 'ChatImageError', problem }),
      )

    it.each([
      ['SOURCE_TOO_LARGE', 'Das Bild ist größer als 20 MB.'],
      [
        'HEIC',
        'Dieses Bild kann Dein Browser nicht öffnen. Ein Foto vom iPhone (HEIC) geht am iPhone selbst.',
      ],
      ['FORMAT', 'Dieses Bild kann Dein Browser nicht öffnen.'],
    ])('says why: %s', async (problem, words) => {
      mountChoice()
      refuse(problem)
      expect(data('picture-problem').exists()).toBe(false)

      await answer(data('photo-picker'))

      expect(data('picture-problem').text()).toBe(words)
      expect(data('picture-problem').attributes('role')).toBe('alert')
      expect(editor().props('modelValue')).toBe(false)
      expect(wrapper.emitted('update:photo')).toBeUndefined()
      expect(wrapper.emitted('update:motif')).toBeUndefined()
      expect(data('own').attributes('aria-busy')).toBeUndefined()
    })

    it('says the plain sentence for a failure without a name', async () => {
      mountChoice()
      pictures.openChatImage.mockRejectedValueOnce(new Error('something'))

      await answer(data('photo-picker'))

      expect(data('picture-problem').text()).toBe('Dieses Bild kann Dein Browser nicht öffnen.')
    })

    it('keeps the photo that is in the tile', async () => {
      mountChoice({ motif: null, photo: photo() })
      refuse('HEIC')

      await answer(data('photo-picker'), file('IMG_1.HEIC'))

      expect(data('photo-picture').attributes('src')).toBe('data:image/jpeg;base64,FIRST')
      expect(wrapper.emitted('update:photo')).toBeUndefined()
    })

    it('says it no longer with the next go, and not after a motif was chosen', async () => {
      mountChoice()
      refuse('FORMAT')
      await answer(data('photo-picker'))
      expect(data('picture-problem').exists()).toBe(true)

      await answer(data('photo-picker'))
      expect(data('picture-problem').exists()).toBe(false)

      editor().vm.$emit('update:modelValue', false)
      refuse('FORMAT')
      await answer(data('photo-picker'))
      expect(data('picture-problem').exists()).toBe(true)
      await data('motif-bouquet').trigger('click')
      expect(data('picture-problem').exists()).toBe(false)
    })

    // A refusal that comes after another photo was chosen is the old photo's: nothing is said.
    it('says nothing of a refusal that came after another photo was chosen', async () => {
      mountChoice()
      const first = deferred()
      pictures.openChatImage.mockReturnValueOnce(first.promise).mockResolvedValueOnce(OTHER)
      await answer(data('photo-picker'), file('first.jpg'))
      await answer(data('photo-picker'), file('second.jpg'))

      first.reject(Object.assign(new Error('x'), { problem: 'HEIC' }))
      await flushPromises()

      expect(data('picture-problem').exists()).toBe(false)
      expect(editor().props('source')).toBe(OTHER)
    })

    // The picture for the eye could not be drawn: nothing is chosen, and the page says so.
    it('chooses nothing where the picture cannot be drawn', async () => {
      mountChoice()
      await answer(data('photo-picker'))
      pictures.thankYouPicturePreview.mockImplementationOnce(() => {
        throw new Error('no canvas')
      })

      editor().vm.$emit('done', CARD_EDIT)
      await flushPromises()

      expect(wrapper.emitted('update:photo')).toBeUndefined()
      expect(wrapper.emitted('update:motif')).toBeUndefined()
      expect(data('picture-problem').text()).toBe('Dieses Bild kann Dein Browser nicht öffnen.')
    })
  })
})

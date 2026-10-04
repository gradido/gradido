// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import i18n from '@/i18n'
import ThankYouPictureChoice from '@/components/ThankYouGreeting/ThankYouPictureChoice.vue'
import TransactionPictureField from './TransactionPictureField.vue'

/**
 * "Bild dazu" in the form of a transfer (ZE-016): nothing chosen, the choice open in place, a
 * picture chosen -- and the sentence in the field's place for a member of another community.
 *
 * The picture choice is the REAL one (its tiles, its two models): the field uses it as it is.
 * Only its editor, a window, is left out. The field keeps nothing: what it says is caught and
 * handed back as its `picture`, as the page does.
 */
const PHOTO = {
  source: { width: 4, height: 3 },
  edit: { cut: true },
  preview: 'data:image/jpeg;base64,AAAA',
}

describe('TransactionPictureField', () => {
  let wrapper

  const mountField = (props = {}) => {
    wrapper = mount(TransactionPictureField, {
      props: {
        picture: null,
        // As the page holds it: what the field says is its picture from then on.
        'onUpdate:picture': (picture) => wrapper.setProps({ picture }),
        ...props,
      },
      global: { plugins: [i18n], stubs: { ChatImageEditor: true } },
      attachTo: document.body,
    })
    return wrapper
  }

  const at = (name) => wrapper.find(`[data-test="${name}"]`)
  const said = () => wrapper.emitted('update:picture') ?? []
  const choice = () => wrapper.findComponent(ThankYouPictureChoice)
  const tile = (key) => at(`thank-you-greeting-motif-${key}`)
  /** The choice is open: it is built and in sight. */
  const isOpen = () => at('send-picture-open').exists() && at('send-picture-open').isVisible()

  beforeEach(() => {
    i18n.global.locale.value = 'de'
  })
  afterEach(() => {
    wrapper?.unmount()
  })

  describe('with nothing chosen', () => {
    it('shows its label and one row, "Bild auswählen", and no choice', () => {
      mountField()

      expect(wrapper.find('.send-picture-label').text()).toBe('Bild dazu')
      expect(at('send-picture-choose').text()).toBe('Bild auswählen')
      expect(at('send-picture-choose').attributes('aria-expanded')).toBe('false')
      expect(at('send-picture-open').exists()).toBe(false)
      expect(at('send-picture-chosen').exists()).toBe(false)
      expect(choice().exists()).toBe(false)
    })

    it('is a group named by its label', () => {
      mountField()

      const group = at('send-picture')
      expect(group.attributes('role')).toBe('group')
      expect(document.getElementById(group.attributes('aria-labelledby')).textContent).toBe(
        'Bild dazu',
      )
    })

    it('opens the choice in place on a tap, with the five motifs, and takes the row away', async () => {
      mountField()

      await at('send-picture-choose').trigger('click')

      expect(isOpen()).toBe(true)
      expect(wrapper.findAll('.tyg-motif:not(.tyg-own)')).toHaveLength(5)
      expect(at('send-picture-choose').exists()).toBe(false)
      expect(at('send-picture-none').text()).toBe('Ohne Bild')
      // Nothing is chosen by opening.
      expect(said()).toEqual([])
      expect(wrapper.findAll('.tyg-motif.is-chosen')).toHaveLength(0)
    })

    it('puts the keyboard on the first tile of the opened choice', async () => {
      mountField()

      await at('send-picture-choose').trigger('click')
      await nextTick()

      expect(document.activeElement).toBe(tile('heart-leaves').element)
    })
  })

  describe('the open choice', () => {
    beforeEach(async () => {
      mountField()
      await at('send-picture-choose').trigger('click')
    })

    it('a tap on a motif chooses it and closes the choice', async () => {
      await tile('giving-hands').trigger('click')

      expect(said()).toEqual([[{ motif: 'giving-hands' }]])
      expect(isOpen()).toBe(false)
      expect(at('send-picture-chosen').exists()).toBe(true)
      expect(at('send-picture-thumb').attributes('src')).toBe(
        '/img/thank-you-greeting/giving-hands.svg',
      )
      expect(at('send-picture-thumb').attributes('alt')).toBe('Gebende Hände')
    })

    it('"Ohne Bild" closes it with no picture', async () => {
      await at('send-picture-none').trigger('click')

      expect(said()).toEqual([[null]])
      expect(isOpen()).toBe(false)
      expect(at('send-picture-choose').exists()).toBe(true)
      expect(at('send-picture-chosen').exists()).toBe(false)
    })

    it('a photo is chosen when its editor closes with "Fertig"', async () => {
      // What the picture choice says then: the photo, and right behind it "no motif".
      choice().vm.$emit('update:photo', PHOTO)
      choice().vm.$emit('update:motif', null)
      await nextTick()

      expect(said()).toEqual([[{ photo: PHOTO }]])
      expect(isOpen()).toBe(false)
      expect(at('send-picture-thumb').attributes('src')).toBe(PHOTO.preview)
      expect(at('send-picture-thumb').attributes('alt')).toBe('Eigenes Foto')
    })

    it('stays open while a photo is only being opened or its editor is left with "Abbrechen"', async () => {
      // Neither says anything: the choice hears of a photo at "Fertig" alone.
      await nextTick()

      expect(isOpen()).toBe(true)
      expect(said()).toEqual([])
    })
  })

  describe('with a picture chosen', () => {
    it('shows it small, with "Anderes Bild" and "Entfernen" beside it', () => {
      mountField({ picture: { motif: 'morning-light' } })

      expect(at('send-picture-thumb').attributes('alt')).toBe('Morgenlicht')
      expect(at('send-picture-other').text()).toBe('Anderes Bild')
      expect(at('send-picture-remove').text()).toBe('Entfernen')
      expect(at('send-picture-choose').exists()).toBe(false)
      expect(at('send-picture-open').exists()).toBe(false)
    })

    it('"Anderes Bild" opens the choice again, the chosen motif marked', async () => {
      mountField({ picture: { motif: 'morning-light' } })

      await at('send-picture-other').trigger('click')

      expect(isOpen()).toBe(true)
      expect(tile('morning-light').classes()).toContain('is-chosen')
      expect(wrapper.findAll('.tyg-motif.is-chosen')).toHaveLength(1)
      expect(at('send-picture-chosen').exists()).toBe(false)
      expect(said()).toEqual([])
    })

    it('"Anderes Bild" hands a chosen photo to the choice, in its tile and marked', async () => {
      mountField({ picture: { photo: PHOTO } })

      await at('send-picture-other').trigger('click')

      expect(choice().props('photo')).toEqual(PHOTO)
      expect(choice().props('motif')).toBeNull()
      expect(wrapper.find('.tyg-own').classes()).toContain('is-chosen')
    })

    it('another motif takes the place of a photo, and the photo is gone with it', async () => {
      mountField({ picture: { photo: PHOTO } })
      await at('send-picture-other').trigger('click')

      await tile('bouquet').trigger('click')

      expect(said()).toEqual([[{ motif: 'bouquet' }]])
      await at('send-picture-other').trigger('click')
      expect(choice().props('photo')).toBeNull()
    })

    // ⚠️ The picture choice knows no "no picture": without a motif a photo in its tile counts
    // as chosen. So the WHOLE picture goes, whichever of the two it was.
    it.each([
      ['a motif', { motif: 'bouquet' }],
      ['a photo', { photo: PHOTO }],
    ])('"Entfernen" empties the field of %s', async (_what, picture) => {
      mountField({ picture })

      await at('send-picture-remove').trigger('click')

      expect(said()).toEqual([[null]])
      expect(at('send-picture-choose').exists()).toBe(true)
      expect(at('send-picture-chosen').exists()).toBe(false)
    })

    it('"Ohne Bild" under the reopened choice removes the picture as well', async () => {
      mountField({ picture: { photo: PHOTO } })
      await at('send-picture-other').trigger('click')

      await at('send-picture-none').trigger('click')

      expect(said()).toEqual([[null]])
      expect(isOpen()).toBe(false)
      expect(at('send-picture-choose').exists()).toBe(true)
    })

    it('shows no picture for a motif this wallet does not know', () => {
      mountField({ picture: { motif: 'elephant' } })

      expect(at('send-picture-chosen').exists()).toBe(false)
      expect(at('send-picture-choose').exists()).toBe(true)
    })
  })

  describe('where the keyboard stands afterwards', () => {
    it('on "Anderes Bild" after a motif was chosen', async () => {
      mountField()
      await at('send-picture-choose').trigger('click')

      await tile('bouquet').trigger('click')
      await nextTick()

      expect(document.activeElement).toBe(at('send-picture-other').element)
    })

    // The editor is a window, and a window hands the keyboard back to where it stood before --
    // the tile, hidden by then: the keyboard falls to the page a moment after "Fertig".
    it('on "Anderes Bild" after a photo was chosen, also once the editor’s window has let the keyboard fall', async () => {
      vi.useFakeTimers()
      try {
        mountField()
        await at('send-picture-choose').trigger('click')
        choice().vm.$emit('update:photo', PHOTO)
        choice().vm.$emit('update:motif', null)
        await nextTick()
        await nextTick()
        expect(document.activeElement).toBe(at('send-picture-other').element)

        // What the closing window does.
        document.activeElement.blur()
        expect(document.activeElement).toBe(document.body)
        vi.advanceTimersByTime(100)

        expect(document.activeElement).toBe(at('send-picture-other').element)
      } finally {
        vi.useRealTimers()
      }
    })

    it('leaves the keyboard where the member put it after a photo was chosen', async () => {
      vi.useFakeTimers()
      const elsewhere = document.createElement('button')
      document.body.appendChild(elsewhere)
      try {
        mountField()
        await at('send-picture-choose').trigger('click')
        choice().vm.$emit('update:photo', PHOTO)
        await nextTick()
        await nextTick()

        elsewhere.focus()
        vi.advanceTimersByTime(1500)

        expect(document.activeElement).toBe(elsewhere)
        // And after that second nobody looks any more.
        elsewhere.blur()
        vi.advanceTimersByTime(1500)
        expect(document.activeElement).toBe(document.body)
      } finally {
        vi.useRealTimers()
        elsewhere.remove()
      }
    })

    it('on "Bild auswählen" after the picture was removed', async () => {
      mountField({ picture: { motif: 'bouquet' } })

      await at('send-picture-remove').trigger('click')
      await nextTick()

      expect(document.activeElement).toBe(at('send-picture-choose').element)
    })
  })

  describe('in the form of the transfer', () => {
    it('has no button that could be the form’s "Jetzt prüfen"', async () => {
      mountField({ picture: { motif: 'bouquet' } })
      await at('send-picture-other').trigger('click')

      const buttons = wrapper.findAll('button')
      // The five motifs and "Ohne Bild"; the tile of one's own photo is a label while empty.
      expect(buttons.length).toBeGreaterThanOrEqual(6)
      expect(buttons.map((button) => button.attributes('type'))).toEqual(
        buttons.map(() => 'button'),
      )
    })

    it('submits nothing on any press: a form around it hears no submit', async () => {
      let submits = 0
      const form = document.createElement('form')
      form.addEventListener('submit', (event) => {
        submits += 1
        event.preventDefault()
      })
      document.body.appendChild(form)
      wrapper = mount(TransactionPictureField, {
        props: { picture: null, 'onUpdate:picture': (picture) => wrapper.setProps({ picture }) },
        global: { plugins: [i18n], stubs: { ChatImageEditor: true } },
        attachTo: form,
      })

      await at('send-picture-choose').trigger('click')
      await tile('bouquet').trigger('click')
      await at('send-picture-other').trigger('click')
      await at('send-picture-none').trigger('click')
      await at('send-picture-choose').trigger('click')
      await tile('heart-leaves').trigger('click')
      await at('send-picture-remove').trigger('click')

      expect(submits).toBe(0)
      wrapper.unmount()
      form.remove()
    })

    it('closes the open choice where the picture is emptied from outside ("Zurücksetzen")', async () => {
      mountField({ picture: { motif: 'bouquet' } })
      await at('send-picture-other').trigger('click')
      expect(isOpen()).toBe(true)

      await wrapper.setProps({ picture: null })

      expect(isOpen()).toBe(false)
      expect(at('send-picture-choose').exists()).toBe(true)
    })
  })

  describe('for a member of another community', () => {
    it('shows the sentence in the field’s place, and nothing to choose', () => {
      mountField({ foreign: true })

      expect(at('send-picture-home-only').text()).toBe(
        'Ein Bild kannst Du vorerst nur Mitgliedern Deiner Gemeinschaft mitschicken.',
      )
      expect(at('send-picture').exists()).toBe(false)
      expect(wrapper.findAll('button')).toHaveLength(0)
    })

    it('leaves a picture chosen before untouched, and shows it again when the recipient changes back', async () => {
      mountField({ picture: { motif: 'bouquet' }, foreign: true })

      expect(at('send-picture-thumb').exists()).toBe(false)
      expect(said()).toEqual([])

      await wrapper.setProps({ foreign: false })

      expect(at('send-picture-thumb').attributes('alt')).toBe('Blumenstrauß')
      expect(said()).toEqual([])
    })
  })
})

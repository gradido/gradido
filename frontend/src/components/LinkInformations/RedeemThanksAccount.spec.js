// AI-GENERATED — not an architecture reference
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import {
  BButton,
  BCol,
  BFormGroup,
  BFormInput,
  BFormInvalidFeedback,
  BRow,
} from 'bootstrap-vue-next'
import i18n from '@/i18n'
import de from '@/locales/de.json'
import { loadAllRules } from '@/validation-rules'
import RedeemThanksAccount from './RedeemThanksAccount.vue'

/**
 * "Konto anlegen" on the page a thank-you arrived on: the strip, the fields of the registration
 * form, and the one button. The view asks and hands what was typed to the page; it books
 * nothing and keeps nothing.
 *
 * With the wallet's own vue-i18n, its own rules for a password and the real fields: which
 * names the form reads from its fields is the point, and a stand-in would agree to any.
 */
const GRADIDO_ID = '76378cbb-5a5c-4e4b-9a3b-1f2d3c4b5a69'
const PASSWORD = 'Aa12345_'
const LINE = 'Einfach so — weil es Dich gibt.'

const link = (overrides = {}) => ({
  __typename: 'TransactionLink',
  id: 7,
  amount: '20',
  memo: 'Danke fürs Reparieren der Gartenbank — sie steht wieder wie neu.',
  senderUser: { gradidoID: GRADIDO_ID, alias: 'Oma-Emma', publisherId: null },
  ...overrides,
})
const greeted = (recipientName = 'Sarah') =>
  link({
    memo: `${LINE}\nLiebe Sarah, mit Eurem iPad hat alles angefangen.`,
    greeting: { motif: 'morning-light', line: LINE, recipientName },
  })

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/redeem/:code', component: { template: '<div />' } }],
})

const mounted = []
const view = async ({ linkData = link(), accepting = false, slots = {}, picture = null } = {}) => {
  const wrapper = mount(RedeemThanksAccount, {
    props: { linkData, accepting, picture },
    slots,
    global: {
      plugins: [i18n, router],
      // The fields name their Bootstrap parts without importing them; the app resolves them.
      components: { BButton, BCol, BFormGroup, BFormInput, BFormInvalidFeedback, BRow },
      stubs: { IBiEye: true, IBiEyeSlash: true },
    },
    attachTo: document.body,
  })
  mounted.push(wrapper)
  await flushPromises()
  return wrapper
}

const strip = (wrapper) => wrapper.find('[data-test="redeem-thanks-strip"]')
const button = (wrapper) => wrapper.find('[data-test="redeem-thanks-open-account"]')
const firstName = (wrapper) => wrapper.find('#registerFirstname')

const fillIn = async (wrapper, fields = {}) => {
  const typed = {
    firstName: 'Sarah',
    lastName: 'Bernard',
    email: 'sarah@provence.fr',
    password: PASSWORD,
    repeat: PASSWORD,
    agree: true,
    ...fields,
  }
  await firstName(wrapper).setValue(typed.firstName)
  await wrapper.find('#registerLastname').setValue(typed.lastName)
  await wrapper.find('#email-input-field').setValue(typed.email)
  await wrapper.find('#newPassword-input-field').setValue(typed.password)
  await wrapper.find('#newPasswordRepeat-input-field').setValue(typed.repeat)
  await wrapper.find('#registerCheckbox').setValue(typed.agree)
  await flushPromises()
}

describe('RedeemThanksAccount', () => {
  beforeAll(async () => {
    loadAllRules(i18n.global)
    await router.push('/redeem/c0ffee1234567890abcdef12')
    await router.isReady()
  })

  beforeEach(() => {
    i18n.global.locale.value = 'de'
  })

  afterEach(() => {
    mounted.splice(0).forEach((wrapper) => wrapper.unmount())
  })

  describe('the strip above the form', () => {
    it('says who sent the thank-you, and welcomes', async () => {
      const wrapper = await view()

      expect(strip(wrapper).text()).toBe(
        'Oma-Emma hat Dir einen Dank geschickt. Schön, dass Du da bist.',
      )
    })

    it('shows the picture of a greeting, small and not read out', async () => {
      const wrapper = await view({ linkData: greeted() })
      const picture = strip(wrapper).find('[data-test="redeem-thanks-strip-motif"]')

      expect(picture.attributes('src')).toBe('/img/thank-you-greeting/morning-light.svg')
      expect(picture.attributes('alt')).toBe('')
      expect(picture.attributes('width')).toBeTruthy()
      expect(picture.attributes('height')).toBeTruthy()
    })

    it('has no picture for a plain link', async () => {
      const wrapper = await view()

      expect(wrapper.find('img').exists()).toBe(false)
    })

    /**
     * A greeting with a photo of the sender's own: the strip shows the photo the sheet showed a
     * moment ago -- the page hands it on, the strip asks nobody.
     */
    describe('with a photo of the sender’s own', () => {
      const PHOTO = 'blob:https://ki-playground.gradido.net/1c2d'
      const withPhoto = () =>
        link({
          memo: `${LINE}\nLiebe Sarah, mit Eurem iPad hat alles angefangen.`,
          greeting: { motif: null, line: LINE, recipientName: 'Sarah', hasPicture: true },
        })
      const photo = (wrapper) => strip(wrapper).find('[data-test="redeem-thanks-strip-photo"]')
      const room = (wrapper) => strip(wrapper).find('[data-test="redeem-thanks-strip-photo-room"]')

      it('shows the photo small, and says whose it is', async () => {
        const wrapper = await view({ linkData: withPhoto(), picture: PHOTO })

        expect(photo(wrapper).element.tagName).toBe('IMG')
        expect(photo(wrapper).attributes('src')).toBe(PHOTO)
        expect(photo(wrapper).attributes('alt')).toBe('Foto von Oma-Emma')
        expect(photo(wrapper).attributes('width')).toBe('360')
        expect(photo(wrapper).attributes('height')).toBe('250')
        expect(photo(wrapper).classes()).toEqual(
          expect.arrayContaining(['redeem-thanks-strip-picture', 'is-photo']),
        )
        expect(room(wrapper).exists()).toBe(false)
        expect(strip(wrapper).findAll('img')).toHaveLength(1)
      })

      // The sentence beside it stays where it is when the photo comes a moment later.
      it('keeps the room of the photo where it has not come, not read out', async () => {
        const wrapper = await view({ linkData: withPhoto() })

        expect(photo(wrapper).exists()).toBe(false)
        expect(room(wrapper).exists()).toBe(true)
        expect(room(wrapper).attributes('aria-hidden')).toBe('true')
        expect(room(wrapper).classes()).toEqual(
          expect.arrayContaining(['redeem-thanks-strip-picture', 'is-photo']),
        )
        expect(strip(wrapper).text()).toBe(
          'Oma-Emma hat Dir einen Dank geschickt. Schön, dass Du da bist.',
        )
      })

      it('shows the motif of a greeting that carries none, whatever is handed in', async () => {
        const wrapper = await view({ linkData: greeted(), picture: PHOTO })

        expect(photo(wrapper).exists()).toBe(false)
        expect(room(wrapper).exists()).toBe(false)
        expect(strip(wrapper).find('[data-test="redeem-thanks-strip-motif"]').exists()).toBe(true)
      })

      it('has no photo for a plain link, whatever is handed in', async () => {
        const wrapper = await view({ picture: PHOTO })

        expect(wrapper.find('img').exists()).toBe(false)
        expect(room(wrapper).exists()).toBe(false)
      })
    })

    // NU-021, as everywhere a sender is named: under the user name, and without one under the
    // Gradido ID -- never under a real name.
    it('names a sender without a user name as the wallet names a member', async () => {
      const wrapper = await view({
        linkData: link({
          senderUser: { gradidoID: GRADIDO_ID, alias: null, firstName: 'Wilhelmine' },
        }),
      })

      expect(strip(wrapper).text()).toContain(`${GRADIDO_ID} hat Dir einen Dank geschickt.`)
      expect(wrapper.text()).not.toContain('Wilhelmine')
    })
  })

  describe('what it asks', () => {
    it('is headed "Konto anlegen" and says why an account', async () => {
      const wrapper = await view()
      const title = wrapper.find('[data-test="redeem-thanks-title"]')

      expect(title.element.tagName).toBe('H2')
      expect(title.text()).toBe('Konto anlegen')
      expect(wrapper.findAll('h1, h2, h3')).toHaveLength(1)
      expect(wrapper.find('[data-test="redeem-thanks-account-text"]').text()).toBe(
        'Dein Dank braucht ein Zuhause: ein Gradido-Konto. Kostenfrei. Keine Verpflichtung.',
      )
    })

    it('has the fields of the registration form, the two for the password among them', async () => {
      const wrapper = await view()

      expect(
        [
          '#registerFirstname',
          '#registerLastname',
          '#email-input-field',
          '#newPassword-input-field',
          '#newPasswordRepeat-input-field',
          '#registerCheckbox',
        ].filter((field) => !wrapper.find(field).exists()),
      ).toEqual([])
      expect(wrapper.find('#newPassword-input-field').attributes('type')).toBe('password')
      expect(wrapper.find('#newPasswordRepeat-input-field').attributes('type')).toBe('password')
      // In the order a keyboard walks them.
      expect(wrapper.findAll('input').map((input) => input.attributes('id'))).toEqual([
        'registerFirstname',
        'registerLastname',
        'email-input-field',
        'newPassword-input-field',
        'newPasswordRepeat-input-field',
        'registerCheckbox',
      ])
    })

    // E-020: the guest learns that whoever thanked sees the confirmation is still missing.
    it('says under the passwords what follows, with the name of whoever thanked', async () => {
      const wrapper = await view()

      expect(wrapper.find('[data-test="register-guarantor-hint"]').text()).toBe(
        de.site.signup.guarantorHint.replace('{name}', 'Oma-Emma'),
      )
    })

    it('asks for the consent as the registration form does', async () => {
      const wrapper = await view()

      expect(wrapper.find('label[for="registerCheckbox"]').text()).toBe(
        'Ich stimme der Datenschutzerklärung zu.',
      )
    })
  })

  // Whom the greeting is for is the sender's word for the person: a nickname as readily as a
  // name. The account is opened under the guest's own, so nothing of it is put in.
  describe('the first name', () => {
    it.each([
      ['a single name', 'Sarah'],
      ['a nickname', 'Gänseblümchen'],
      ['several words', 'die liebe Sarah'],
      ['nothing', ''],
    ])('starts empty where the greeting is for %s', async (_, recipientName) => {
      const wrapper = await view({ linkData: greeted(recipientName) })

      expect(firstName(wrapper).element.value).toBe('')
    })

    it('starts empty for a plain link', async () => {
      const wrapper = await view()

      expect(firstName(wrapper).element.value).toBe('')
    })

    it('is sent as the guest typed it', async () => {
      const wrapper = await view({ linkData: greeted('Sarah') })

      await fillIn(wrapper, { firstName: 'Sarah-Marie' })
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.emitted('submit')[0][0].firstName).toBe('Sarah-Marie')
    })
  })

  // A browser fills a saved sign-in into fields it takes for a sign-in form -- here that would
  // be the address and password of whoever owns the computer the thank-you is opened on.
  describe('what a browser may fill in', () => {
    it.each(['#newPassword-input-field', '#newPasswordRepeat-input-field'])(
      'asks for a new password in %s',
      async (field) => {
        const wrapper = await view()

        expect(wrapper.find(field).attributes('autocomplete')).toBe('new-password')
      },
    )

    it('keeps the address field closed to it', async () => {
      const wrapper = await view()

      expect(wrapper.find('#email-input-field').attributes('autocomplete')).toBe('off')
    })
  })

  describe('the button', () => {
    // The word of the card (ZE-017 F4). "Konto anlegen und Dank annehmen" broke into two lines
    // on a 320px phone.
    it('is called "Dank annehmen" and sends the form', async () => {
      const wrapper = await view()

      expect(button(wrapper).text()).toBe('Dank annehmen')
      expect(button(wrapper).attributes('type')).toBe('submit')
      expect(button(wrapper).classes()).toContain('redeem-thanks-accept')
      expect(wrapper.find('form').element.contains(button(wrapper).element)).toBe(true)
    })

    it('waits until the form is filled in, as on the registration form', async () => {
      const wrapper = await view()

      expect(button(wrapper).element.disabled).toBe(true)
      expect(button(wrapper).classes()).toContain('btn-gradido-disable')

      await fillIn(wrapper)

      expect(button(wrapper).element.disabled).toBe(false)
      expect(button(wrapper).classes()).toContain('btn-gradido')
    })

    it.each([
      ['no first name', { firstName: '' }],
      ['a first name of two letters', { firstName: 'Jo' }],
      ['no last name', { lastName: '' }],
      ['no address', { email: '' }],
      ['an address that is none', { email: 'sarah.provence.fr' }],
      ['a password against the rules of the house', { password: 'sarah', repeat: 'sarah' }],
      ['a second password that is another', { repeat: 'Aa12345_x' }],
      ['no consent', { agree: false }],
    ])('stays locked with %s', async (_, fields) => {
      const wrapper = await view()

      await fillIn(wrapper, fields)

      expect(button(wrapper).element.disabled).toBe(true)
    })

    it('waits while the page opens the account, signs in and books', async () => {
      const wrapper = await view({ accepting: true })

      await fillIn(wrapper)

      expect(button(wrapper).element.disabled).toBe(true)

      await wrapper.setProps({ accepting: false })

      expect(button(wrapper).element.disabled).toBe(false)
    })
  })

  describe('what it hands to the page', () => {
    it('is what was typed, once, and nothing besides', async () => {
      const wrapper = await view()
      await fillIn(wrapper)

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.emitted('submit')).toHaveLength(1)
      expect(wrapper.emitted('submit')[0]).toEqual([
        {
          firstName: 'Sarah',
          lastName: 'Bernard',
          email: 'sarah@provence.fr',
          password: PASSWORD,
        },
      ])
    })

    it('hands over nothing for a form that is not filled in', async () => {
      const wrapper = await view()
      await fillIn(wrapper, { email: '' })

      // The Enter key in a field sends a form whatever its button says.
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.emitted('submit')).toBeUndefined()
    })

    it('hands over nothing while the page is at work', async () => {
      const wrapper = await view({ accepting: true })
      await fillIn(wrapper)

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.emitted('submit')).toBeUndefined()
    })
  })

  // The way in for somebody who has an account comes from the view around it, and stands
  // under the form: the button first, then the other way.
  it('puts what the view around it hands in under the form', async () => {
    const wrapper = await view({
      slots: { default: '<a data-test="other-way" href="/login">Ich habe schon ein Konto</a>' },
    })
    const form = wrapper.find('form').element
    const other = wrapper.find('[data-test="other-way"]').element

    expect(form.contains(other)).toBe(false)
    expect(form.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  // Signs are drawn, not typed.
  it.each(['de', 'en'])('carries no emoji and finds every text (%s)', async (language) => {
    i18n.global.locale.value = language
    const wrapper = await view({ linkData: greeted() })

    expect(wrapper.text()).not.toMatch(/\p{Extended_Pictographic}/u)
    expect(wrapper.text()).not.toContain('redeem-thanks.')
    expect(wrapper.text()).not.toContain('site.signup.')
    expect(wrapper.text()).not.toContain('form.')
  })
})

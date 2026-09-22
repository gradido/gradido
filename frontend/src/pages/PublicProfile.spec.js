// AI-GENERATED — not an architecture reference

import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHistory } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PublicProfile from './PublicProfile.vue'
import AuthTriads from '@/components/Auth/AuthTriads.vue'
import en from '@/locales/en.json'

vi.mock('@/config', () => ({
  default: { COMMUNITY_URL: 'https://ki-playground.gradido.net', COMMUNITY_NAME: 'KI Playground' },
}))

vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastSuccess: vi.fn() }),
}))

// The real English texts: the greeting and the second button carry placeholders, and only
// the language file can say whether the page fills the ones it names. A message written for
// this test would agree with the page by construction.
const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const GRADIDO_ID = '76378cbb-5a5c-4e4b-9a3b-1f2d3c4b5a69'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { name: 'PublicProfile', path: '/u/:alias', component: PublicProfile },
    { name: 'Register', path: '/register/:code?', component: { template: '<div />' } },
    {
      name: 'Send',
      path: '/send/:communityIdentifier?/:userIdentifier?',
      component: { template: '<div />' },
      meta: { requiresAuth: true },
    },
  ],
})

const wrapperFor = async (alias) => {
  await router.push(`/u/${alias}`)
  await router.isReady()
  return mount(PublicProfile, {
    global: { plugins: [i18n, router], stubs: { AuthTriads: true, IBiCopy: true } },
  })
}

describe('PublicProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // A door like the login and the register page, so the same greeting at the same place: first
  // on the page, with the same bottom padding as there.
  it('opens with the rotating triads, as the login and register pages do', async () => {
    const wrapper = await wrapperFor('bernd')

    const triads = wrapper.findComponent(AuthTriads)
    expect(triads.exists()).toBe(true)
    expect(wrapper.element.firstElementChild).toBe(triads.element)
    // The gap below is the triads' own, the same on every door: no spacing from the page.
    expect(triads.classes().filter((name) => /^[mp][tbsexy]?-/.test(name))).toEqual([])
  })

  it('shows the address that was opened', async () => {
    const wrapper = await wrapperFor('bernd')

    expect(wrapper.text()).toContain('ki-playground.gradido.net/u/bernd')
  })

  // The whole point of the button: it carries the recipient. A link to the bare send form
  // would lose exactly what the visitor arrived with, and nothing on the page would say so.
  it('offers a send button that names community and recipient', async () => {
    const wrapper = await wrapperFor('bernd')

    const button = wrapper.find('[data-test="public-profile-send"]')
    expect(button.exists()).toBe(true)
    expect(button.text()).toBe(en['public-profile'].send)
    expect(button.attributes('href')).toBe('/send/KI%20Playground/bernd')
  })

  /**
   * PS-029: one page for everybody, so two buttons of one size -- the page cannot know
   * whether a member or a newcomer is holding the phone. Sending stays first (PS-015).
   */
  it('offers sending first and opening an account second, side by side in one column', async () => {
    const wrapper = await wrapperFor('bernd')

    const buttons = wrapper.findAll('.profile-actions > *')
    expect(buttons.map((b) => b.attributes('data-test'))).toEqual([
      'public-profile-send',
      'public-profile-register',
    ])
  })

  // Bernd at the live page, twice: first the button spanned the whole card and read as a bar,
  // then a grid fraction squeezed "Gradido senden" onto two lines just above 1025px, where the
  // layout puts the picture back beside the card and the card gets narrower (PS-015).
  //
  // So the width is not a fraction of anything: the two buttons stand in one column that is
  // as wide as the wider label, and each fills it -- the style block is where that lives.
  // What a test can hold is that neither is put back into a grid column or given a width
  // utility, because either would make the labels stop deciding. The French wording needs
  // more room than the German; a fraction that fits one is wrong for the other.
  it('lets the labels decide the width instead of a grid fraction', async () => {
    const wrapper = await wrapperFor('bernd')

    for (const button of wrapper.findAll('.profile-actions > *')) {
      expect(button.classes()).toContain('profile-action')
      expect(button.classes()).not.toContain('w-100')
      expect(button.element.closest('[class*="col-"]')).toBe(null)
    }
  })

  // The community is named, not printed. The backend resolves a community by uuid, by name
  // or by its stored federation endpoint -- never by the host that gets printed on the card.
  // A link built from the printed form would open the send form and leave it empty.
  it('names the community the way the backend can resolve it', async () => {
    const wrapper = await wrapperFor('bernd')

    const href = wrapper.find('[data-test="public-profile-send"]').attributes('href')
    expect(href).not.toContain('ki-playground.gradido.net')
  })

  // The signed-out visitor is the normal case, not the exception: a phone camera opens the
  // default browser, while the wallet session lives in whichever browser the member usually
  // uses. The detour through the login is therefore the usual way in, and it works by the
  // guard storing this path and pushing it again afterwards.
  //
  // This test covers the one link of that chain that belongs to this page: the path the
  // button produces goes out and comes back with both parameters intact. A community name
  // with a space in it is the part that could quietly break on the trip, and the encoding
  // that saves it comes from the router resolving the route -- not from the guard, which
  // stores `to.path` verbatim. A guard test built from a hand-written string could not see
  // the difference; it would only measure the literal somebody typed into it.
  //
  // The other two links are held elsewhere, and they are what make this one enough:
  // `router.test.js` asserts that the real `/send/:communityIdentifier?/:userIdentifier?`
  // requires authentication, and `guards.test.js` asserts that the guard stores the path it
  // turned away and sends the visitor to the login.
  it('produces a path that survives being stored and pushed again', async () => {
    const wrapper = await wrapperFor('bernd')

    const stored = wrapper.find('[data-test="public-profile-send"]').attributes('href')
    await router.push(stored)

    expect(router.currentRoute.value.name).toBe('Send')
    expect(router.currentRoute.value.params).toEqual({
      communityIdentifier: 'KI Playground',
      userIdentifier: 'bernd',
    })
  })

  // The way onward for somebody who has no account yet, where the registration link below
  // the card used to be -- now carrying the name in the address along, so that the person who
  // showed Gradido becomes the referrer of the new account.
  it('offers to open an account, and takes the name in the address along', async () => {
    const wrapper = await wrapperFor('bernd')

    const join = wrapper.find('[data-test="public-profile-register"]')
    expect(join.text()).toBe(en['public-profile'].join)
    expect(join.attributes('href')).toBe('/register?referrer=bernd')
  })

  // ZE-005: the person in the address learns of the arrival, so the newcomer reads it here,
  // before registering -- on the same page as the button that starts the trace.
  it('tells the newcomer that the person in the address learns of the arrival', async () => {
    const wrapper = await wrapperFor('bernd')

    expect(wrapper.find('[data-test="public-profile-echo-hint"]').text()).toBe(
      en['public-profile'].echoHint.replace('{name}', 'bernd'),
    )
  })

  // Nothing is looked up for this either: a made-up name is carried and named just the same.
  // Whether it belongs to anybody is decided by the server, silently, after the registration.
  it('carries a made-up name along and names it the same way', async () => {
    const wrapper = await wrapperFor('xyzabc')

    expect(wrapper.find('[data-test="public-profile-register"]').attributes('href')).toBe(
      '/register?referrer=xyzabc',
    )
    expect(wrapper.find('[data-test="public-profile-echo-hint"]').text()).toBe(
      en['public-profile'].echoHint.replace('{name}', 'xyzabc'),
    )
  })

  // A Gradido ID leaves no trace -- the server takes user names only -- and a page that
  // greets "somebody" does not promise that somebody hears of it.
  it('carries nothing along and promises nothing where the address holds a Gradido ID', async () => {
    const wrapper = await wrapperFor(GRADIDO_ID)

    expect(wrapper.find('[data-test="public-profile-register"]').attributes('href')).toBe(
      '/register',
    )
    expect(wrapper.find('[data-test="public-profile-echo-hint"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain(en['public-profile'].echoHint.replace('{name}', ''))
  })

  // Not being a Gradido ID does not make something a user name: two characters are neither,
  // and the server would ignore them. The shape of a user name decides, not the absence of
  // the other shape.
  it('carries nothing along where the address holds no user name at all', async () => {
    const wrapper = await wrapperFor('ab')

    expect(wrapper.find('[data-test="public-profile-register"]').attributes('href')).toBe(
      '/register',
    )
    expect(wrapper.find('[data-test="public-profile-echo-hint"]').exists()).toBe(false)
  })

  /**
   * The community is named on purpose -- whoever belongs somewhere else is told so without
   * the page ever having to ask which community they are in -- and it is named under the
   * address, not in the button: there it broke the label onto up to four lines on a phone
   * (Bernd, 19.09.2026, after the measurement).
   */
  it('names the community in the line about opening an account', async () => {
    const wrapper = await wrapperFor('bernd')

    expect(wrapper.find('[data-test="public-profile-duration"]').text()).toBe(
      en['public-profile'].duration.replace('{communityName}', 'KI Playground'),
    )
    expect(wrapper.find('[data-test="public-profile-register"]').text()).not.toContain(
      'KI Playground',
    )
  })

  // The name comes from the address, not from the database: the visitor's own input read back.
  it('greets with the name in the address', async () => {
    const wrapper = await wrapperFor('bernd')

    expect(wrapper.find('[data-test="public-profile-shows"]').text()).toBe(
      en['public-profile'].shows.replace('{name}', 'bernd'),
    )
  })

  /**
   * A member without a user name has the Gradido ID in the address, and a UUID is no way to
   * greet anybody. The shape decides, not a lookup -- a user name can never be 36 characters.
   */
  it('says "somebody" where the address carries a Gradido ID', async () => {
    const wrapper = await wrapperFor(GRADIDO_ID)

    expect(wrapper.find('[data-test="public-profile-shows"]').text()).toBe(
      en['public-profile'].showsSomebody,
    )
    expect(wrapper.text()).toContain(`ki-playground.gradido.net/u/${GRADIDO_ID}`)
  })

  it('says what Gradido is', async () => {
    const wrapper = await wrapperFor('bernd')

    expect(wrapper.find('[data-test="public-profile-lead"]').text()).toBe(en['public-profile'].lead)
  })

  // The heart of it: from the outside it must not be possible to tell whether somebody is
  // with Gradido at all. The page never asks, so a made-up address produces the very same
  // page -- word for word, once the address itself is taken out of the comparison. A test
  // that only checked "no error message" would still pass if a lookup were added later;
  // this one fails as soon as anything on the page depends on who the alias belongs to.
  it('gives a made-up address the same page as a real one', async () => {
    const real = (await wrapperFor('bernd')).text().replaceAll('bernd', 'ALIAS')
    const invented = (await wrapperFor('xyzabc')).text().replaceAll('xyzabc', 'ALIAS')

    expect(invented).toBe(real)
  })

  // The same for the greeting's other form: whether a Gradido ID belongs to anybody is not
  // asked either, so every one of them gets the very same page.
  it('gives a made-up Gradido ID the same page as a real one', async () => {
    const other = '0b2f6e11-2c3d-4e5f-8a9b-0c1d2e3f4a5b'
    const real = (await wrapperFor(GRADIDO_ID)).text().replaceAll(GRADIDO_ID, 'ALIAS')
    const invented = (await wrapperFor(other)).text().replaceAll(other, 'ALIAS')

    expect(invented).toBe(real)
  })

  // The same for the button, which the comparison above cannot see because it lives in an
  // attribute: it points at whatever was opened, without asking whether that person exists.
  // Where the page stays silent, the send form speaks -- but only after a login, and only
  // to a member. That is the rule (the truth falls inside), not an oversight.
  it('points the button at a made-up address just the same', async () => {
    const wrapper = await wrapperFor('xyzabc')

    expect(wrapper.find('[data-test="public-profile-send"]').attributes('href')).toBe(
      '/send/KI%20Playground/xyzabc',
    )
  })

  it('shows no error, not even a friendly one', async () => {
    const wrapper = await wrapperFor('xyzabc')

    expect(wrapper.find('.alert').exists()).toBe(false)
    expect(wrapper.find('.text-danger').exists()).toBe(false)
  })
})

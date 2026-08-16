// AI-GENERATED — not an architecture reference

import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHistory } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PublicProfile from './PublicProfile.vue'

vi.mock('@/config', () => ({
  default: { COMMUNITY_URL: 'https://ki-playground.gradido.net', COMMUNITY_NAME: 'KI Playground' },
}))

vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastSuccess: vi.fn() }),
}))

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      'public-profile': {
        address: 'Gradido address',
        send: 'Send Gradido',
      },
      missingGradidoAccount: 'No {communityName} account yet?',
      signup: 'Sign up',
    },
  },
})

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
    global: { plugins: [i18n, router] },
  })
}

describe('PublicProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
    expect(button.text()).toBe('Send Gradido')
    expect(button.attributes('href')).toBe('/send/KI%20Playground/bernd')
  })

  // Bernd at the live page: the button spanned the whole card on a computer and read as a bar
  // rather than a button. It keeps the full width where the thumb is the pointing device and
  // gets narrower as the card grows -- so the classes are the behaviour here, and worth holding.
  it('fills the width on a phone and narrows as the card grows', async () => {
    const wrapper = await wrapperFor('bernd')

    const column = wrapper
      .find('[data-test="public-profile-send"]')
      .element.closest('[class*="col"]')
    expect(column.className).toContain('col-12')
    expect(column.className).toContain('col-md-8')
    expect(column.className).toContain('col-lg-6')
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

  // The way onward for somebody who has no account yet. The community is named on purpose:
  // whoever reads "No KI Playground account yet?" and belongs somewhere else is told so
  // without the page ever having to ask which community they are in.
  it('offers registration, naming the community', async () => {
    const wrapper = await wrapperFor('bernd')

    expect(wrapper.text()).toContain('No KI Playground account yet?')
    expect(wrapper.find('[data-test="public-profile-register"]').exists()).toBe(true)
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

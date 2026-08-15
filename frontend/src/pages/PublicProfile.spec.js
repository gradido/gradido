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
        send: 'Send Gradido:',
        'send-hint': 'Copy the address and paste it into your Gradido account.',
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

  it('says how to send Gradido', async () => {
    const wrapper = await wrapperFor('bernd')

    expect(wrapper.text()).toContain('Send Gradido:')
    expect(wrapper.text()).toContain('Copy the address and paste it into your Gradido account.')
  })

  // Bernd at the live page: a heading with its sentence underneath, not two things side by
  // side. The first attempt set them on one line with the house separator, and that read as
  // a divider between equals instead of a label for what follows.
  it('sets "send Gradido" as a heading above the sentence, not beside it', async () => {
    const wrapper = await wrapperFor('bernd')

    const heading = wrapper.find('.fw-bold')
    expect(heading.text()).toBe('Send Gradido:')
    expect(heading.element.nextElementSibling.textContent.trim()).toBe(
      'Copy the address and paste it into your Gradido account.',
    )
    expect(wrapper.find('.separator-start').exists()).toBe(false)
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

  it('shows no error, not even a friendly one', async () => {
    const wrapper = await wrapperFor('xyzabc')

    expect(wrapper.find('.alert').exists()).toBe(false)
    expect(wrapper.find('.text-danger').exists()).toBe(false)
  })
})

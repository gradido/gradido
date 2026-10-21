// AI-GENERATED — not an architecture reference

import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthFooter } from './AuthFooter'
import de from '@/locales/de.json'
import el from '@/locales/el.json'
import en from '@/locales/en.json'
import es from '@/locales/es.json'
import fr from '@/locales/fr.json'
import itLocale from '@/locales/it.json'
import nl from '@/locales/nl.json'
import pt from '@/locales/pt.json'
import ru from '@/locales/ru.json'
import tr from '@/locales/tr.json'

// The footer reads the flag once, when it is set up, so each case sets it before mounting.
const config = vi.hoisted(() => ({ MATCHING_ACTIVE: true }))
vi.mock('@/config', () => ({ default: config }))

const page = { template: '<div />' }

const mountFooter = async (locale = 'de') => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', component: page },
      { path: '/event-matching', component: page },
    ],
  })
  router.push('/login')
  await router.isReady()
  const wrapper = mount(AuthFooter, {
    global: {
      plugins: [createI18n({ legacy: false, locale, messages: { de, en } }), router],
    },
  })
  return { wrapper, router }
}

const footerLinks = (wrapper) => wrapper.findAll('.nav-footer a')

describe('AuthFooter', () => {
  beforeEach(() => {
    config.MATCHING_ACTIVE = true
  })

  it('links to the imprint and the privacy policy of the page language, in a new tab', async () => {
    const { wrapper } = await mountFooter('en')
    const [imprint, privacy] = footerLinks(wrapper)

    expect(imprint.text()).toBe(en.footer.imprint)
    expect(imprint.attributes('href')).toBe('https://gradido.net/en/impressum/')
    expect(imprint.attributes('target')).toBe('_blank')
    expect(privacy.text()).toBe(en.footer.privacy_policy)
    expect(privacy.attributes('href')).toBe('https://gradido.net/en/datenschutz/')
    expect(privacy.attributes('target')).toBe('_blank')
  })

  describe('event matching', () => {
    it('stands third, after the privacy policy', async () => {
      const { wrapper } = await mountFooter()

      expect(footerLinks(wrapper).map((link) => link.text())).toEqual([
        de.footer.imprint,
        de.footer.privacy_policy,
        'Event-Matching',
      ])
    })

    // A page of this wallet, not of gradido.net: it opens where the visitor is.
    it('is a link into this wallet, without a new tab', async () => {
      const { wrapper } = await mountFooter()
      const link = wrapper.find('[data-test="footer-event-matching"] a')

      expect(link.attributes('href')).toBe('/event-matching')
      expect(link.attributes('target')).toBeUndefined()
    })

    it('goes there through the router, without loading the wallet anew', async () => {
      const { wrapper, router } = await mountFooter()

      await wrapper.find('[data-test="footer-event-matching"] a').trigger('click')
      await flushPromises()

      expect(router.currentRoute.value.path).toBe('/event-matching')
    })

    // Three links take a second line on most screens. The list is then as wide as the page;
    // these two classes keep its lines in the middle below the desk layout and at the left
    // from there on, where the row around the list stands too. (jsdom lays nothing out: this
    // holds the classes, the built wallet was measured for where the links end up.)
    it('keeps the list centred where it wraps, and left-aligned on the desk', async () => {
      const { wrapper } = await mountFooter()
      const list = wrapper.find('.nav-footer')

      expect(list.element.tagName).toBe('UL')
      expect(list.classes()).toContain('justify-content-center')
      expect(list.classes()).toContain('justify-content-lg-start')
      expect(list.element.parentElement.classList).toContain('justify-content-center')
      expect(list.element.parentElement.classList).toContain('justify-content-lg-start')
    })

    // routes.js registers the page with the same flag. A link without its page would lead to
    // "not found" on every sign-in page of an instance without matching.
    it('is left out where the instance has no matching', async () => {
      config.MATCHING_ACTIVE = false
      const { wrapper } = await mountFooter()

      expect(wrapper.find('[data-test="footer-event-matching"]').exists()).toBe(false)
      expect(footerLinks(wrapper).map((link) => link.text())).toEqual([
        de.footer.imprint,
        de.footer.privacy_policy,
      ])
    })

    // The name of the function: the same two words in every language, written the German way
    // with a hyphen in German only.
    it('has its name in all ten languages', () => {
      const names = Object.fromEntries(
        Object.entries({ de, el, en, es, fr, it: itLocale, nl, pt, ru, tr }).map(
          ([language, messages]) => [language, messages.footer.eventMatching],
        ),
      )

      expect(names.de).toBe('Event-Matching')
      for (const language of ['el', 'en', 'es', 'fr', 'it', 'nl', 'pt', 'ru', 'tr']) {
        expect(names[language], language).toBe('Event Matching')
      }
    })
  })
})

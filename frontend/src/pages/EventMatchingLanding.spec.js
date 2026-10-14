// AI-GENERATED — not an architecture reference

import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHistory } from 'vue-router'
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import EventMatchingLanding from './EventMatchingLanding.vue'
import AuthTriads from '@/components/Auth/AuthTriads.vue'
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

// The real texts of all ten languages: the sentence is put together from a word the matching
// already has ("I love") and the link's own, and only the language files can say whether
// every language has both.
const messages = { de, el, en, es, fr, it: itLocale, nl, pt, ru, tr }
const i18nIn = (locale) => createI18n({ legacy: false, locale, messages })

const Page = { template: '<div />' }
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { name: 'EventMatchingLanding', path: '/event', component: EventMatchingLanding },
    { name: 'Register', path: '/register/:code?', component: Page },
    { name: 'Login', path: '/login/:code?', component: Page },
  ],
})

const LINK = {
  interest: 'Kongress Frequency Healing',
  details: 'Die lang verschwiegenen Geheimnisse über Selbstheilung, Biohacking, Longevity',
  remote: '1',
  v: '1',
}

const wrapperFor = async (query = LINK, locale = 'de') => {
  await router.push({ path: '/event', query })
  await router.isReady()
  return mount(EventMatchingLanding, {
    global: { plugins: [i18nIn(locale), router], stubs: { AuthTriads: true, IBiGlobe2: true } },
  })
}
const part = (wrapper, name) => wrapper.find(`[data-test="event-matching-${name}"]`)

describe('EventMatchingLanding', () => {
  // A door like the sign-in page, the registration and the Gradido address, so the same
  // greeting at the same place: first on the page, with no spacing of the page's own.
  it('opens with the rotating triads, as the other doors do', async () => {
    const wrapper = await wrapperFor()

    const triads = wrapper.findComponent(AuthTriads)
    expect(triads.exists()).toBe(true)
    expect(wrapper.element.firstElementChild).toBe(triads.element)
    expect(triads.classes().filter((name) => /^[mp][tbsexy]?-/.test(name))).toEqual([])
  })

  describe('what the link offers', () => {
    it('says what the page is for', async () => {
      const wrapper = await wrapperFor()

      expect(part(wrapper, 'headline').text()).toBe('Die Karte zu den Menschen Deines Kongresses')
      expect(wrapper.text()).toContain('Dein erster Eintrag:')
    })

    it('reads the sentence back as an entry would say it', async () => {
      const wrapper = await wrapperFor()

      expect(part(wrapper, 'sentence').text()).toBe('Ich liebe Kongress Frequency Healing')
    })

    it('shows the details under it', async () => {
      const wrapper = await wrapperFor()

      expect(part(wrapper, 'details').text()).toBe(LINK.details)
    })

    it('shows no details where the link brings none', async () => {
      const wrapper = await wrapperFor({ interest: 'Training Rücken ohne Bewegung', remote: '0' })

      expect(part(wrapper, 'details').exists()).toBe(false)
    })

    it('says that the entry is found from afar, in the word the list of entries uses', async () => {
      const wrapper = await wrapperFor()

      expect(part(wrapper, 'remote').text()).toBe(de.matching.entries.remote)
    })

    it('says so as well where the link says nothing about it', async () => {
      const wrapper = await wrapperFor({ interest: 'Kongress X' })

      expect(part(wrapper, 'remote').exists()).toBe(true)
    })

    it('does not say so for an entry found only where the member lives', async () => {
      const wrapper = await wrapperFor({ interest: 'Training Rücken ohne Bewegung', remote: '0' })

      expect(part(wrapper, 'remote').exists()).toBe(false)
    })

    it('cuts a sentence to what an entry holds', async () => {
      const wrapper = await wrapperFor({ interest: 'k'.repeat(400) })

      expect(part(wrapper, 'sentence').text()).toBe(`Ich liebe ${'k'.repeat(160)}`)
    })

    it('cuts details to what an entry holds', async () => {
      const wrapper = await wrapperFor({ interest: 'Kongress X', details: 'd'.repeat(2500) })

      expect(part(wrapper, 'details').text()).toBe('d'.repeat(2000))
    })

    // Line breaks stay line breaks, as in the member's list: the stylesheet keeps them
    // (white-space: pre-wrap), and the text itself has to still carry them for that.
    it('keeps the line breaks of the details', async () => {
      const wrapper = await wrapperFor({ interest: 'Kongress X', details: 'Zeile 1\nZeile 2' })

      expect(part(wrapper, 'details').element.textContent).toBe('Zeile 1\nZeile 2')
    })
  })

  /**
   * ⛔ Sentence and details are somebody else's text out of an address. They are shown as
   * text: markup in them becomes no element, and what reads like a placeholder or a linked
   * message of the language files is letters.
   */
  describe('the words of the link stay text', () => {
    const MARKUP = '<b>Kongress</b> <img src=x onerror="alert(1)"> "X" {name} @:signup | $t'

    it('makes no element out of markup in the sentence', async () => {
      const wrapper = await wrapperFor({ interest: MARKUP })

      const sentence = part(wrapper, 'sentence')
      expect(sentence.element.children).toHaveLength(0)
      expect(sentence.text()).toBe(`Ich liebe ${MARKUP}`)
      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.find('b').exists()).toBe(false)
    })

    it('makes no element out of markup in the details', async () => {
      const wrapper = await wrapperFor({ interest: 'Kongress X', details: MARKUP })

      const details = part(wrapper, 'details')
      expect(details.element.children).toHaveLength(0)
      expect(details.text()).toBe(MARKUP)
      expect(wrapper.find('img').exists()).toBe(false)
    })
  })

  describe('the two ways on', () => {
    // One page for everybody: it cannot know whether a newcomer or a member reads it, so two
    // buttons of one size, the registration first.
    it('offers opening an account first and the sign-in second, in one column', async () => {
      const wrapper = await wrapperFor()

      const buttons = wrapper.findAll('.landing-actions > *')
      expect(buttons.map((b) => b.attributes('data-test'))).toEqual([
        'event-matching-register',
        'event-matching-login',
      ])
      expect(buttons.map((b) => b.text())).toEqual(['Konto anlegen', 'Ich habe schon ein Konto'])
    })

    // The store holds the entry (routes/guards.js). The link's parameters mean something here
    // and nowhere else -- and a `referrer` or a `guarantor` written into an event link by hand
    // must not reach the registration through these buttons.
    it('leads on without anything of the link in the address', async () => {
      const wrapper = await wrapperFor({
        ...LINK,
        referrer: 'somebody',
        guarantor: '1.abc',
        redirect: 'https://elsewhere.example',
      })

      expect(part(wrapper, 'register').attributes('href')).toBe('/register')
      expect(part(wrapper, 'login').attributes('href')).toBe('/login')
    })

    it('lets the labels decide the width instead of a grid fraction', async () => {
      const wrapper = await wrapperFor()

      for (const button of wrapper.findAll('.landing-actions > *')) {
        expect(button.classes()).toContain('landing-action')
        expect(button.classes()).not.toContain('w-100')
        expect(button.element.closest('[class*="col-"]')).toBe(null)
      }
    })

    it('says what to do with an account in another community', async () => {
      const wrapper = await wrapperFor()

      expect(part(wrapper, 'other-community').text()).toBe(de.eventMatching.landing.otherCommunity)
    })
  })

  // The guard leads an address without a sentence to the sign-in page before this page is
  // entered. Mounted on its own it shows nothing rather than an offer of nothing.
  it('shows nothing where the address holds no sentence', async () => {
    const wrapper = await wrapperFor({ details: 'only details' })

    expect(wrapper.find('.event-matching-landing').exists()).toBe(false)
    expect(wrapper.text()).toBe('')
  })

  describe('in every language of the wallet', () => {
    const LANGUAGES = Object.keys(messages)

    it.each(LANGUAGES)('%s begins the sentence the way its entries do', async (locale) => {
      const wrapper = await wrapperFor(LINK, locale)

      const start = messages[locale].matching.type.interesse.prefix
      expect(start).toBeTruthy()
      expect(part(wrapper, 'sentence').text()).toBe(`${start} Kongress Frequency Healing`)
    })

    it.each(LANGUAGES)('%s has every text of the page in its own words', async (locale) => {
      const own = messages[locale].eventMatching.landing
      expect(Object.keys(own).sort()).toEqual(Object.keys(de.eventMatching.landing).sort())
      for (const [key, text] of Object.entries(own)) {
        expect(text, key).toBeTruthy()
        // A language that fell back on another one's words would pass every test above.
        if (locale !== 'de') expect(text, key).not.toBe(de.eventMatching.landing[key])
        if (locale !== 'en') expect(text, key).not.toBe(en.eventMatching.landing[key])
      }
    })

    // The two buttons say what the same two say where a thank-you is accepted and on the
    // Gradido address: one wording per language for one thing.
    it.each(LANGUAGES)('%s names the two buttons as its other doors do', (locale) => {
      const own = messages[locale].eventMatching.landing

      expect(own.register).toBe(messages[locale]['public-profile'].join)
      expect(own.haveAccount).toBe(messages[locale]['redeem-thanks']['have-account'])
    })
  })
})

/**
 * The two buttons are laid out as the two of the Gradido address are (PublicProfile), rule for
 * rule -- and a scoped stylesheet cannot be shared. This holds the two copies together: a
 * change to one of them that the other does not follow fails here.
 */
describe('the two buttons, laid out as on the Gradido address', () => {
  const here = dirname(fileURLToPath(import.meta.url))
  const rulesOf = (file, names) => {
    const source = readFileSync(join(here, file), 'utf8')
    const [, style] = source.match(/<style[^>]*>([\s\S]*?)<\/style>/) ?? []
    // The fixture has to prove itself: no style block would compare nothing with nothing.
    expect(style).toBeDefined()
    return (
      style
        // Comments say why, and say it differently in the two files.
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(names.from, names.to)
        .replace(/\s+/g, ' ')
        .trim()
    )
  }

  it('carries the same rules for them', () => {
    const address = rulesOf('PublicProfile.vue', { from: /profile-action/g, to: 'landing-action' })
    const landing = rulesOf('EventMatchingLanding.vue', { from: /^$/, to: '' })

    expect(address).toContain('.landing-actions {')
    // Everything the address says about its two buttons, in the same order, is said here.
    expect(landing).toContain(address)
  })

  /**
   * The words are the link's: a title without a single blank, or details of two thousand
   * characters on one line. What keeps them inside the card is two rules a test of the text
   * cannot see -- measured in the built wallet, and held here against being cleared away.
   */
  describe('the link’s words inside the card', () => {
    const landing = rulesOf('EventMatchingLanding.vue', { from: /^$/, to: '' })
    const ruleOf = (selector) => {
      const [, body] = landing.match(new RegExp(`\\${selector} \\{([^}]*)\\}`)) ?? []
      // The fixture has to prove itself.
      expect(body).toBeDefined()
      return body
    }

    it('breaks a sentence without blanks rather than widen the card', () => {
      expect(ruleOf('.event-entry-sentence')).toContain('overflow-wrap: anywhere;')
    })

    it('keeps the line breaks of the details, and breaks a long word in them', () => {
      expect(ruleOf('.event-entry-details')).toContain('white-space: pre-wrap;')
      expect(ruleOf('.event-entry-details')).toContain('overflow-wrap: anywhere;')
    })

    // The two rules hold nothing unless the sentence and the details carry the two classes.
    it('gives the sentence and the details the classes these rules are written for', async () => {
      const wrapper = await wrapperFor({ interest: 'Kongress X', details: 'Zeile 1\nZeile 2' })

      expect(part(wrapper, 'sentence').classes()).toContain('event-entry-sentence')
      expect(part(wrapper, 'details').classes()).toContain('event-entry-details')
    })
  })
})

// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createI18n } from 'vue-i18n'
import ChatUnreadDot from './ChatUnreadDot.vue'
import de from '@/locales/de.json'
import en from '@/locales/en.json'
import ru from '@/locales/ru.json'
import tr from '@/locales/tr.json'
import { pluralRules } from '@/utils/pluralRules'

// The real sentences and the real plural rules, so the screen reader's sentence is measured the
// way the wallet renders it -- not a stub that says whatever the test hands it.
const mountAt = (count, locale = 'de') =>
  mount(ChatUnreadDot, {
    props: count === undefined ? {} : { count },
    global: {
      plugins: [createI18n({ legacy: false, locale, messages: { de, en, ru, tr }, pluralRules })],
    },
  })

const here = dirname(fileURLToPath(import.meta.url))
const styles = readFileSync(resolve(here, './ChatUnreadDot.vue'), 'utf8')
  .split('<style scoped>')[1]
  .replace(/\/\*[\s\S]*?\*\//g, '')

describe('ChatUnreadDot', () => {
  it('draws nothing while nothing waits unread, and nothing for a row without the number', () => {
    expect(mountAt(0).find('[data-test="chat-unread-contact-dot"]').exists()).toBe(false)
    expect(mountAt(undefined).find('[data-test="chat-unread-contact-dot"]').exists()).toBe(false)
  })

  it('draws the dot from one unread message on', () => {
    expect(mountAt(1).find('[data-test="chat-unread-contact-dot"]').exists()).toBe(true)
  })

  // ⛔ The sentence lives INSIDE the dot: wherever the dot is put -- in the button that opens
  // the person -- its words go along, and a dot without words cannot come about.
  it('carries its sentence inside itself, hidden from the eye only', () => {
    const dot = mountAt(2).find('[data-test="chat-unread-contact-dot"]')
    const sentence = dot.find('.visually-hidden')
    expect(sentence.exists()).toBe(true)
    expect(sentence.text()).toBe('2 neue Nachrichten')
    expect(dot.attributes('aria-hidden')).toBeUndefined()
  })

  it('says one message in the singular and more in the plural', () => {
    expect(mountAt(1).text()).toBe('1 neue Nachricht')
    expect(mountAt(3).text()).toBe('3 neue Nachrichten')
    expect(mountAt(1, 'en').text()).toBe('1 new message')
    expect(mountAt(3, 'en').text()).toBe('3 new messages')
  })

  // Russian counts in three classes (utils/pluralRules): 1 and 21, 2–4, 5–20.
  it('counts in Russian by the three Russian forms', () => {
    expect(mountAt(1, 'ru').text()).toBe('1 новое сообщение')
    expect(mountAt(3, 'ru').text()).toBe('3 новых сообщения')
    expect(mountAt(5, 'ru').text()).toBe('5 новых сообщений')
    expect(mountAt(21, 'ru').text()).toBe('21 новое сообщение')
  })

  // Turkish does not put a noun after a number in the plural: one form for every number.
  it('says it in one form in Turkish', () => {
    expect(mountAt(1, 'tr').text()).toBe('1 yeni mesaj')
    expect(mountAt(4, 'tr').text()).toBe('4 yeni mesaj')
  })

  it('is a round dot in Gold B, the colour of the mark in the menu', () => {
    const rule = styles.match(/\.chat-unread-contact-dot\s*\{([^}]*)\}/)[1]
    expect(rule).toMatch(/background:\s*#c08935/)
    expect(rule).toMatch(/border-radius:\s*50%/)
    expect(rule).toMatch(/width:\s*9px/)
    expect(rule).toMatch(/height:\s*9px/)
  })
})

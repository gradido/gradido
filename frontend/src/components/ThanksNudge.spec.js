// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import ThanksNudge from './ThanksNudge.vue'

const here = dirname(fileURLToPath(import.meta.url))
/** A file's source without its block comments: a rule only counts where it is code. */
const source = (path) => readFileSync(join(here, path), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const rule = (code, selector) => code.match(new RegExp(`\\n${selector}\\s*\\{([^}]*)\\}`))?.[1]

const WORDS = {
  question: 'Möchtest Du Dich bei Lena für das Gespräch bedanken?',
  yes: 'Danke sagen',
  no: 'Nicht jetzt',
}

describe('ThanksNudge', () => {
  let wrapper

  const mountLine = (props = WORDS) => {
    wrapper = mount(ThanksNudge, { props })
    return wrapper
  }

  const yes = () => wrapper.find('[data-test="thanks-nudge-yes"]')
  const no = () => wrapper.find('[data-test="thanks-nudge-no"]')

  afterEach(() => {
    wrapper?.unmount()
  })

  it('asks its question, and offers the way there and "not now"', () => {
    mountLine()

    expect(wrapper.find('[data-test="thanks-nudge-question"]').text()).toBe(WORDS.question)
    expect(yes().text()).toBe('Danke sagen')
    expect(no().text()).toBe('Nicht jetzt')
    // In the order a reader meets them: the question, then the way there, then "not now".
    expect(wrapper.findAll('button').map((button) => button.text())).toEqual([
      'Danke sagen',
      'Nicht jetzt',
    ])
  })

  // In a form (the send form stands beside the contact window) a button without a type would
  // send it.
  it('has buttons that send no form', () => {
    mountLine()

    expect(yes().attributes('type')).toBe('button')
    expect(no().attributes('type')).toBe('button')
  })

  it('says which was pressed, and nothing else', async () => {
    mountLine()

    await yes().trigger('click')
    expect(wrapper.emitted('yes')).toHaveLength(1)
    expect(wrapper.emitted('no')).toBeUndefined()

    await no().trigger('click')
    expect(wrapper.emitted('no')).toHaveLength(1)
    expect(wrapper.emitted('yes')).toHaveLength(1)
  })

  // A keyboard that comes to the first button hears what the two are about.
  it('is a group named by its question, one name for each line', () => {
    mountLine()
    const group = wrapper.find('[data-test="thanks-nudge"]')
    const question = wrapper.find('[data-test="thanks-nudge-question"]')

    expect(group.attributes('role')).toBe('group')
    expect(question.attributes('id')).toBeTruthy()
    expect(group.attributes('aria-labelledby')).toBe(question.attributes('id'))
  })

  // Two lines in one page -- a thread with two calls of one's own -- name their own groups.
  it('names each line by its own question where two stand in one page', () => {
    wrapper = mount({
      components: { ThanksNudge },
      template: `<div>
        <thanks-nudge question="Eins?" yes="Ja" no="Nein" />
        <thanks-nudge question="Zwei?" yes="Ja" no="Nein" />
      </div>`,
    })
    const groups = wrapper.findAll('[data-test="thanks-nudge"]')
    const named = groups.map((group) => group.attributes('aria-labelledby'))

    expect(new Set(named).size).toBe(2)
    expect(named.map((id) => wrapper.find(`[id="${id}"]`).text())).toEqual(['Eins?', 'Zwei?'])
  })

  describe('the look', () => {
    const code = source('ThanksNudge.vue')

    // "Gold B" (E-033, E-048): the flat gold of "Gradido senden" in the contact window, white
    // words -- the same value, so the two do not drift apart.
    it('draws the way there in the gold of "Gradido senden", with white words', () => {
      const own = rule(code, '\\.thanks-nudge-yes')
      const window = rule(source('Contacts/ContactWindow.vue'), '\\.send-gradido')
      const gold = window.match(/background:\s*(#[0-9a-f]{6})/i)[1]

      expect(gold).toBe('#c08935')
      expect(own).toMatch(new RegExp(`background:\\s*${gold}`, 'i'))
      expect(own).toMatch(/color:\s*#fff\b/)
    })

    // Quiet: no frame and no ground, as a word to be tapped.
    it('draws "not now" without frame or ground', () => {
      const own = rule(code, '\\.thanks-nudge-no')

      expect(own).toMatch(/border:\s*0/)
      expect(own).toMatch(/background:\s*transparent/)
    })

    // ⛔ A button held to one line is as wide as its words however narrow the bubble: at 320 px a
    // long language would hang it out of the bubble. Its words may break, as the last resort.
    it('lets a button’s words break rather than hang out of a narrow bubble', () => {
      expect(rule(code, '\\.thanks-nudge-yes')).not.toMatch(/white-space:\s*nowrap/)
      expect(rule(code, '\\.thanks-nudge-no')).not.toMatch(/white-space:\s*nowrap/)
    })

    it('rings either button for the keyboard', () => {
      expect(code).toMatch(
        /\.thanks-nudge-yes:focus-visible,\s*\.thanks-nudge-no:focus-visible\s*\{[^}]*outline:\s*2px solid/,
      )
    })
  })
})

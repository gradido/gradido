// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import ChatCheck from './ChatCheck.vue'

/** A parent that binds the box with v-model, as the dialogs do, and notes every `change`. */
const Parent = {
  components: { ChatCheck },
  setup() {
    const ticked = ref(false)
    const changes = ref([])
    return { ticked, changes, word: 'Auch per E-Mail' }
  },
  template:
    '<ChatCheck v-model="ticked" box-test="the-box" @change="changes.push($event)">{{ word }}</ChatCheck>',
}

describe('ChatCheck', () => {
  it("is the browser's own box inside its label, with its word beside it", () => {
    const wrapper = mount(ChatCheck, { props: { boxTest: 'the-box' }, slots: { default: 'Wort' } })

    const label = wrapper.find('label.chat-check')
    const box = label.find('input[type="checkbox"]')
    expect(box.attributes('data-test')).toBe('the-box')
    expect(box.classes()).toEqual(['chat-check-box'])
    expect(label.find('.chat-check-text').text()).toBe('Wort')
  })

  it('takes a title and a class of its parent onto its label', () => {
    const wrapper = mount(ChatCheck, { attrs: { title: 'Hinweis', class: 'mt-3' } })

    expect(wrapper.find('label').attributes('title')).toBe('Hinweis')
    expect(wrapper.find('label').classes()).toContain('mt-3')
  })

  it('follows v-model both ways', async () => {
    const wrapper = mount(Parent)
    const box = wrapper.find('[data-test="the-box"]')

    await box.setValue(true)
    expect(wrapper.vm.ticked).toBe(true)

    wrapper.vm.ticked = false
    await wrapper.vm.$nextTick()
    expect(box.element.checked).toBe(false)
  })

  /**
   * ⛔ `change` says what the box is NOW. The model value is still the old one at that moment where
   * the parent binds it (it comes back down only when the parent draws again): read off it, the
   * box "Start in the Jitsi app" remembered the opposite of every tick (26.09.2026).
   */
  it('says with every change what the box is now, where the parent binds it', async () => {
    const wrapper = mount(Parent)
    const box = wrapper.find('[data-test="the-box"]')

    await box.setValue(true)
    await box.setValue(false)
    await box.setValue(true)

    expect(wrapper.vm.changes).toEqual([true, false, true])
  })

  // The compose bar's box: the browser's own, in the wallet's gold. jsdom draws nothing, so the
  // stylesheet says it; comments stripped first.
  it("is the compose bar's box, in the stylesheet", () => {
    const here = dirname(fileURLToPath(import.meta.url))
    const style = (file) =>
      readFileSync(join(here, file), 'utf8')
        .slice(readFileSync(join(here, file), 'utf8').indexOf('<style'))
        .replace(/\/\*[\s\S]*?\*\//g, '')
    const rule = (code, selector) =>
      code
        .match(new RegExp(`\\n${selector}\\s*\\{([^}]*)\\}`))?.[1]
        .replace(/\s+/g, ' ')
        .trim()

    const check = style('ChatCheck.vue')
    const bar = style('ChatComposeBar.vue')
    for (const property of [
      'width: 1.1rem',
      'height: 1.1rem',
      'accent-color: var(--gold, #c58d38)',
    ]) {
      expect(rule(check, '\\.chat-check-box'), property).toContain(property)
      expect(rule(bar, '\\.chat-compose-check-box'), property).toContain(property)
    }
    expect(rule(check, '\\.chat-check-box:focus-visible')).toBe(
      rule(bar, '\\.chat-compose-check-box:focus-visible'),
    )
  })
})

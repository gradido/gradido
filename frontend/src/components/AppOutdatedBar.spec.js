import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import AppOutdatedBar from './AppOutdatedBar'
import { markAppOutdated, resetAppOutdated } from '@/composables/useAppOutdated'

const read = (relativePath) =>
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), relativePath), 'utf8')

// ⚠️ No own $emit('click') here. $attrs already carries the parent's click handler onto the
// button, so emitting as well would run it twice and the test would count two reloads for
// one press.
const mockBButton = {
  name: 'BButton',
  template: '<button v-bind="$attrs"><slot></slot></button>',
}

describe('AppOutdatedBar', () => {
  const createWrapper = () =>
    mount(AppOutdatedBar, {
      global: {
        stubs: { BButton: mockBButton },
        mocks: { $t: (key) => key },
      },
    })

  beforeEach(() => {
    resetAppOutdated()
  })

  // The bar is a permanent interruption, so it must be invisible until there is a real
  // reason. A test that only checked the visible case would stay green if it were shown
  // always.
  it('shows nothing while the bundle still fits the schema', () => {
    expect(createWrapper().find('[data-test="app-outdated-bar"]').exists()).toBe(false)
  })

  it('appears once the app has been marked outdated', async () => {
    const wrapper = createWrapper()
    markAppOutdated()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="app-outdated-bar"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('appOutdated.text')
  })

  // ★ The reload is offered, never taken. Someone who has just typed a contribution must get
  // the chance to copy it out first -- reloading for them would destroy exactly the work the
  // failed submission was about.
  it('reloads only when the button is pressed', async () => {
    const reload = vi.fn()
    const original = window.location
    delete window.location
    window.location = { ...original, reload }

    const wrapper = createWrapper()
    markAppOutdated()
    await wrapper.vm.$nextTick()

    expect(reload).not.toHaveBeenCalled()

    await wrapper.find('[data-test="app-outdated-reload"]').trigger('click')
    expect(reload).toHaveBeenCalledTimes(1)

    window.location = original
  })
})

/**
 * ⛔ jsdom resolves no custom property and computes no contrast, so nothing that MOUNTS this
 * component can see what colour it ends up. It ended up unreadable: the bar asked for
 * `var(--bs-warning, #f3cd7c)` with black text, and gradido.css sets `--bs-warning: #8c0505`
 * in the one place it is set -- a dark red, so the amber fallback never applied and the strip
 * was black on dark red at 2.14:1. Nobody noticed because the bar was rare; newVersionCheck
 * makes it ordinary.
 *
 * So the colours are held against the files that define them instead, the way
 * webAppManifest.spec.js holds the manifest against index.html and nginx.
 */
describe('the bar is readable', () => {
  const style = read('./AppOutdatedBar.vue').split('<style')[1]
  const [, token, fallback] = style.match(
    /background-color:\s*var\((--[\w-]+),\s*(#[0-9a-f]{6})\)/i,
  )
  const [, text] = style.match(/\n\s*color:\s*(#[0-9a-f]{3,6})/i)

  // The token has to be a semantic one from the design system, whose light and dark values
  // both live in files this test can read. Bootstrap's own variables are not: they are set
  // in the compiled gradido.css, where a value can be anything and nothing here would know.
  const tokenValue = (path, selector) => {
    const scss = read(path)
    return scss
      .slice(scss.indexOf(selector))
      .match(new RegExp(`${token}:\\s*(#[0-9a-f]{3,8})`, 'i'))
  }

  const luminance = (hex) => {
    const channel = (pair) => {
      const value = Number.parseInt(pair, 16) / 255
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    }
    const [r, g, b] = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map(channel)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  const contrast = (a, b) => {
    const [low, high] = [luminance(a), luminance(b)].sort((x, y) => x - y)
    return (high + 0.05) / (low + 0.05)
  }

  it.each([
    ['light', '../assets/scss/_design-tokens.scss', ':root'],
    ['dark', '../assets/scss/gradido-template-dark.scss', 'body.dark-mode'],
  ])('takes its background from a token the %s theme really defines', (_mode, path, selector) => {
    expect(tokenValue(path, selector)).not.toBeNull()
  })

  // 4.5:1 is the readable threshold for body text. The fallback is measured too: it is what
  // a viewer sees if the stylesheet that carries the token has not arrived yet.
  it.each([
    ['light', '../assets/scss/_design-tokens.scss', ':root'],
    ['dark', '../assets/scss/gradido-template-dark.scss', 'body.dark-mode'],
  ])('keeps its text readable on the %s value', (_mode, path, selector) => {
    expect(contrast(text, tokenValue(path, selector)[1])).toBeGreaterThanOrEqual(4.5)
  })

  it('keeps its text readable on the fallback colour', () => {
    expect(contrast(text, fallback)).toBeGreaterThanOrEqual(4.5)
  })
})

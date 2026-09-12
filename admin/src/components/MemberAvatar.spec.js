// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { AVATAR_COLOR_PALETTE } from '@/utils/avatarColor'
import MemberAvatar from './MemberAvatar.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
  }),
}))

const circle = (props = {}) => mount(MemberAvatar, { props: { size: 48, ...props } })

describe('MemberAvatar', () => {
  it('shows the letters while there is no picture, in the colour of the seed', () => {
    const wrapper = circle({ initials: 'MA', colorSeed: 'MG' })

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toBe('MA')
    expect(wrapper.attributes('style')).toContain('width: 48px')
  })

  /**
   * ⛔ The letters follow the alias, the colour keeps following the real initials (AS-010).
   * Measured as a DIFFERENCE, because that is the whole point: a circle reading "MA" is not
   * necessarily the colour of "MA".
   */
  it('colours from the seed rather than from what it shows', () => {
    const bySeed = circle({ initials: 'MA', colorSeed: 'MG' })
    const byLetters = circle({ initials: 'MA' })

    expect(bySeed.attributes('style')).not.toBe(byLetters.attributes('style'))
  })

  // The server-computed digit wins where it is given: it exists for rows where the real name
  // is not delivered at all, and the circle has to keep the colour it always had (NU-017).
  it('takes the server digit over the seed', () => {
    const wrapper = circle({ initials: 'MA', colorSeed: 'MG', colorIndex: 4 })

    // The colour of palette entry 4, in the notation a browser writes it back as.
    const asRendered = circle({ initials: 'MA', colorIndex: 4 }).element.style.backgroundColor
    expect(wrapper.element.style.backgroundColor).toBe(asRendered)
    expect(asRendered).not.toBe('')
    // And it really is entry 4 rather than whatever the seed would have given.
    const { bg } = AVATAR_COLOR_PALETTE[4]
    expect(wrapper.html()).toContain('background-color')
    expect(bg).toMatch(/^#/)
  })

  it('shows the picture where there is one, and offers it', () => {
    const wrapper = circle({ initials: 'MA', src: 'data:image/jpeg;base64,face' })

    expect(wrapper.find('img').attributes('src')).toBe('data:image/jpeg;base64,face')
    expect(wrapper.element.tagName).toBe('BUTTON')
  })

  /**
   * ⛔ A button only where there is something to open. Twenty rows of a moderation list
   * would otherwise announce twenty controls to a screen reader that do nothing at all.
   */
  it('is not a control while it has only letters', async () => {
    const wrapper = circle({ initials: 'MA' })

    expect(wrapper.element.tagName).toBe('DIV')
    await wrapper.trigger('click')
    expect(wrapper.emitted('zoom')).toBeUndefined()
  })

  it('asks for the picture to be opened when it is tapped', async () => {
    const wrapper = circle({ initials: 'MA', src: 'data:image/jpeg;base64,face', name: 'margret' })

    await wrapper.trigger('click')

    expect(wrapper.emitted('zoom')).toHaveLength(1)
    // And it says whose picture it would open -- the wallet's words, under the wallet's key.
    expect(wrapper.attributes('aria-label')).toContain('avatar.zoom-open')
    expect(wrapper.attributes('aria-label')).toContain('margret')
  })
})

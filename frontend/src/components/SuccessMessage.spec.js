// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { BButton } from 'bootstrap-vue-next'
import SuccessMessage from './SuccessMessage.vue'

/**
 * The page after something went out: a contribution handed in, a transfer, a letter. Its button
 * says "Schließen" unless it is told otherwise -- the send page says "Zurück" (E-043), the
 * contributions keep the word they had.
 */
const mountMessage = (props = {}) =>
  mount(SuccessMessage, {
    props: { message: 'contribution.submitted', ...props },
    global: { mocks: { $t: (key) => key }, components: { BButton } },
  })
const button = (wrapper) => wrapper.find('[data-test="success-message-button"]')

describe('SuccessMessage', () => {
  it('says "Schließen" where nothing else is asked for', () => {
    expect(button(mountMessage()).text()).toBe('form.close')
  })

  it('says what it is asked to', () => {
    expect(button(mountMessage({ buttonText: 'Zurück' })).text()).toBe('Zurück')
  })

  it('tells the page that the button was pressed', async () => {
    const wrapper = mountMessage({ buttonText: 'Zurück' })

    await button(wrapper).trigger('click')

    expect(wrapper.emitted('on-back')).toHaveLength(1)
  })
})

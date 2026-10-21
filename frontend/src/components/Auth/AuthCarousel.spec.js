// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { BCarousel } from 'bootstrap-vue-next'
import { describe, expect, it, vi } from 'vitest'
import { AuthCarousel } from './AuthCarousel'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key) => key }) }))

const mountCarousel = () => mount(AuthCarousel)

describe('AuthCarousel', () => {
  it('shows three pictures, each with its two lines', () => {
    const wrapper = mountCarousel()

    expect(wrapper.findAll('img').map((img) => img.attributes('src'))).toEqual([
      '/img/template/Foto_01_2400_small.jpg',
      '/img/template/Foto_05_2400_small.jpg',
      '/img/template/Foto_04_2400_small.jpg',
    ])
    expect(wrapper.findAll('.caption-first-text').map((line) => line.text())).toEqual([
      'auth.left.gratitude',
      'auth.left.dignity',
      'auth.left.donation',
    ])
    expect(wrapper.findAll('.caption-second-text').map((line) => line.text())).toEqual([
      'auth.left.oneGratitude',
      'auth.left.oneDignity',
      'auth.left.oneDonation',
    ])
  })

  it('turns on by itself, every thirteen seconds', () => {
    const carousel = mountCarousel().findComponent(BCarousel)

    expect(carousel.props('interval')).toBe(13000)
    expect(carousel.props('ride')).toBe('carousel')
  })
})

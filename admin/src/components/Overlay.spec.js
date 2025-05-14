import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import Overlay from './Overlay.vue'
import { useI18n } from 'vue-i18n'
import { BButton, BCard, BCol, BContainer, BRow } from 'bootstrap-vue-next'

vi.mock('vue-i18n')

describe('Overlay', () => {
  const mockT = vi.fn((key) => key)
  const mockD = vi.fn((date, format) => {
    if (format === 'month') return 'January'
    if (format === 'year') return '2023'
    return date.toISOString()
  })
  let wrapper

  const mockItem = {
    amount: '100',
    contributionDate: '2023-01-15T00:00:00.000Z',
    memo: 'Test memo',
    user: {
      firstName: 'John',
      lastName: 'Doe',
      emailContact: {
        email: 'john.doe@example.com',
      },
    },
  }

  beforeEach(() => {
    useI18n.mockReturnValue({ t: mockT, d: mockD })

    wrapper = mount(Overlay, {
      props: {
        item: mockItem,
      },
      global: {
        stubs: {
          BCard,
          BRow,
          BCol,
          BContainer,
          BButton,
        },
      },
      slots: {
        title: '<div>Test Title</div>',
        text: '<p>Test Text</p>',
        question: '<p>Test Question?</p>',
        'submit-btn': '<button>Submit</button>',
      },
    })
  })

  it('renders the component', () => {
    expect(wrapper.find('.component-overlay').exists()).toBe(true)
  })

  it('renders slot content correctly', () => {
    expect(wrapper.find('.display-3').html()).toContain('Test Title')
    expect(wrapper.html()).toContain('<p>Test Text</p>')
    expect(wrapper.html()).toContain('<p>Test Question?</p>')
    expect(wrapper.html()).toContain('<button>Submit</button>')
  })

  it('displays item properties correctly', () => {
    expect(wrapper.text()).toContain('100 GDD')
    expect(wrapper.text()).toContain('Test memo')
    expect(wrapper.text()).toContain('John Doe')
    expect(wrapper.text()).toContain('john.doe@example.com')
  })

  it('emits overlay-cancel event when cancel button is clicked', async () => {
    await wrapper.find('button.m-3.text-light').trigger('click')
    expect(wrapper.emitted('overlay-cancel')).toBeTruthy()
    expect(wrapper.emitted('overlay-cancel')).toHaveLength(1)
  })
})

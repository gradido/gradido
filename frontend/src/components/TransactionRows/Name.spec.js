import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import Name from './Name'
import { BLink } from 'bootstrap-vue-next'

const routerPushMock = vi.fn()

const mocks = {
  $router: {
    push: routerPushMock,
  },
  $route: {
    path: '/transactions',
  },
}

const propsData = {
  text: 'Plaintext Name',
}

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}))

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}))

const mockToastError = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: mockToastError,
  })),
}))

describe('Name', () => {
  let wrapper

  const createWrapper = () => {
    return mount(Name, {
      global: {
        mocks,
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
      props: propsData,
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.name').exists()).toBe(true)
    })

    describe('without linked user', () => {
      it('has a span with the text', () => {
        expect(wrapper.find('div.gdd-transaction-list-item-name').text()).toBe('Plaintext Name')
      })

      it('has no link', () => {
        expect(wrapper.find('div.gdd-transaction-list-item-name').find('a').exists()).toBe(false)
      })
    })

    describe('with linked user', () => {
      beforeEach(async () => {
        await wrapper.setProps({
          linkedUser: {
            firstName: 'Bibi',
            lastName: 'Bloxberg',
            gradidoID: 'gradido-ID',
            communityUuid: 'community UUID',
          },
        })
      })

      it('has a link with first and last name', () => {
        expect(wrapper.find('div.gdd-transaction-list-item-name').text()).toBe('Bibi Bloxberg')
      })

      it('has a link', () => {
        expect(
          wrapper.find('div.gdd-transaction-list-item-name').findComponent(RouterLinkStub).exists(),
        ).toBe(true)
      })

      it('RouterLink has correct to prop', () => {
        const routerLink = wrapper.findComponent(RouterLinkStub)
        expect(routerLink.props().to).toEqual({
          name: 'Send',
          params: {
            communityIdentifier: 'community UUID',
            userIdentifier: 'gradido-ID',
          },
        })
      })
    })
  })
})

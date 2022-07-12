import { mount } from '@vue/test-utils'
import ContributionList from './ContributionList.vue'

const localVue = global.localVue

describe('ContributionList', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
  }

  const propsData = {
    items: [
      {
        id: '0',
        date: '07/06/2022',
        memo: 'Ich habe 10 Stunden die Elbwiesen von Müll befreit.',
        amount: 200,
        status: 'pending',
      },
      {
        id: '1',
        date: '06/22/2022',
        memo: 'Ich habe 30 Stunden Frau Müller beim EInkaufen und im Haushalt geholfen.',
        amount: 600,
        status: 'pending',
      },
      {
        id: '2',
        date: '05/04/2022',
        memo:
          'Ich habe 50 Stunden den Nachbarkindern bei ihren Hausaufgaben geholfen und Nachhilfeunterricht gegeben.',
        amount: 1000,
        status: 'pending',
      },
    ],
  }

  const Wrapper = () => {
    return mount(ContributionList, {
      localVue,
      mocks,
      propsData,
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a DIV .contribution-list', () => {
      expect(wrapper.find('div.contribution-list').exists()).toBe(true)
    })
  })
})

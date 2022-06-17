import { mount } from '@vue/test-utils'
import OpenCreationsTable from './OpenCreationsTable.vue'

const localVue = global.localVue

const apolloMutateMock = jest.fn().mockResolvedValue({})
const apolloQueryMock = jest.fn().mockResolvedValue({})

const propsData = {
  items: [
    {
      id: 4,
      firstName: 'Bob',
      lastName: 'der Baumeister',
      email: 'bob@baumeister.de',
      amount: 300,
      memo: 'Aktives Grundeinkommen für Januar 2022',
      date: '2022-01-01T00:00:00.000Z',
      moderator: 1,
      creation: [700, 1000, 1000],
      __typename: 'PendingCreation',
    },
    {
      id: 5,
      firstName: 'Räuber',
      lastName: 'Hotzenplotz',
      email: 'raeuber@hotzenplotz.de',
      amount: 210,
      memo: 'Aktives Grundeinkommen für Januar 2022',
      date: '2022-01-01T00:00:00.000Z',
      moderator: 1,
      creation: [790, 1000, 1000],
      __typename: 'PendingCreation',
    },
    {
      id: 6,
      firstName: 'Stephen',
      lastName: 'Hawking',
      email: 'stephen@hawking.uk',
      amount: 330,
      memo: 'Aktives Grundeinkommen für Januar 2022',
      date: '2022-01-01T00:00:00.000Z',
      moderator: 1,
      creation: [670, 1000, 1000],
      __typename: 'PendingCreation',
    },
  ],
  fields: [
    { key: 'bookmark', label: 'delete' },
    { key: 'email', label: 'e_mail' },
    { key: 'firstName', label: 'firstname' },
    { key: 'lastName', label: 'lastname' },
    {
      key: 'amount',
      label: 'creation',
      formatter: (value) => {
        return value + ' GDD'
      },
    },
    { key: 'memo', label: 'text' },
    {
      key: 'date',
      label: 'date',
      formatter: (value) => {
        return value
      },
    },
    { key: 'moderator', label: 'moderator' },
    { key: 'edit_creation', label: 'edit' },
    { key: 'confirm', label: 'save' },
  ],
  toggleDetails: false,
}

const mocks = {
  $t: jest.fn((t) => t),
  $d: jest.fn((d) => d),
  $apollo: {
    mutate: apolloMutateMock,
    query: apolloQueryMock,
  },
  $store: {
    state: {
      moderator: {
        id: 0,
        name: 'test moderator',
      },
    },
  },
}

describe('OpenCreationsTable', () => {
  let wrapper

  const Wrapper = () => {
    return mount(OpenCreationsTable, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a DIV element with the class .open-creations-table', () => {
      expect(wrapper.find('div.open-creations-table').exists()).toBe(true)
    })

    it('has a table with three rows', () => {
      expect(wrapper.findAll('tbody > tr')).toHaveLength(3)
    })

    it('find first button.bi-pencil-square for open EditCreationFormular ', () => {
      expect(wrapper.findAll('tr').at(1).find('.bi-pencil-square').exists()).toBe(true)
    })

    describe('show edit details', () => {
      beforeEach(async () => {
        await wrapper.findAll('tr').at(1).find('.bi-pencil-square').trigger('click')
      })

      it.skip('has a component element with name EditCreationFormular', () => {
        expect(wrapper.findComponent({ name: 'EditCreationFormular' }).exists()).toBe(true)
      })

      it.skip('renders the component component-edit-creation-formular', () => {
        expect(wrapper.find('div.component-edit-creation-formular').exists()).toBe(true)
      })
    })

    describe('call updateUserData', () => {
      it('user creations has updated data', async () => {
        wrapper.vm.updateUserData(propsData.items[0], [444, 555, 666])
        await wrapper.vm.$nextTick()
        expect(wrapper.vm.items[0].creation).toEqual([444, 555, 666])
      })
    })
  })
})

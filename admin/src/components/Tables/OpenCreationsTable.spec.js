import { mount } from '@vue/test-utils'
import OpenCreationsTable from './OpenCreationsTable'

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
      moderatorId: 1,
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
      moderatorId: null,
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
      moderatorId: 1,
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
    { key: 'memo', label: 'text', class: 'text-break' },
    {
      key: 'date',
      label: 'date',
      formatter: (value) => {
        return value
      },
    },
    { key: 'moderator', label: 'moderator' },
    { key: 'editCreation', label: 'edit' },
    { key: 'confirm', label: 'save' },
  ],
  toggleDetails: false,
  hideResubmission: true,
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
        id: 1,
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

    it('has no button.bi-pencil-square for user contribution ', () => {
      expect(wrapper.findAll('tr').at(2).find('.bi-pencil-square').exists()).toBe(false)
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

    describe('call updateStatus', () => {
      beforeEach(() => {
        wrapper.vm.updateStatus(4)
      })

      it('emits update-status', () => {
        expect(wrapper.vm.$root.$emit('update-status', 4)).toBeTruthy()
      })
    })

    describe('test reload-contribution', () => {
      beforeEach(() => {
        wrapper.vm.reloadContribution(3)
      })

      it('emits reload-contribution', () => {
        expect(wrapper.emitted('reload-contribution')).toBeTruthy()
        expect(wrapper.emitted('reload-contribution')[0]).toEqual([3])
      })
    })
  })
})

import { mount } from '@vue/test-utils'
import DeletedUserFormular from './DeletedUserFormular.vue'
import { deleteUser } from '../graphql/deleteUser'
import { unDeleteUser } from '../graphql/unDeleteUser'

const localVue = global.localVue

const apolloMutateMock = jest.fn().mockResolvedValue({
  data: {
    deleteUser: { userId: 1, deletedAt: new Date() },
    unDeleteUser: { userId: 1, deletedAt: null },
  },
})
const toastedErrorMock = jest.fn()
const toastedSuccessMock = jest.fn()

const mocks = {
  $t: jest.fn(),
  $apollo: {
    mutate: apolloMutateMock,
  },
  $store: {
    state: {
      moderator: {
        id: 0,
        name: 'test moderator',
      },
    },
  },
  $toasted: {
    error: toastedErrorMock,
    success: toastedSuccessMock,
  },
}

const propsData = {
  item: {},
}

describe('DeletedUserFormular', () => {
  let wrapper

  const Wrapper = () => {
    return mount(DeletedUserFormular, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a DIV element with the class.delete-user-formular', () => {
      expect(wrapper.find('.deleted-user-formular').exists()).toBeTruthy()
    })
  })
})

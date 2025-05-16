import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createStore } from 'vuex'
import OpenCreationsTable from './OpenCreationsTable.vue'

vi.mock('../RowDetails', () => ({ default: { name: 'RowDetails' } }))
vi.mock('../EditCreationFormular', () => ({ default: { name: 'EditCreationFormular' } }))
vi.mock('../ContributionMessages/ContributionMessagesList', () => ({
  default: { name: 'ContributionMessagesList' },
}))

describe('OpenCreationsTable', () => {
  let wrapper
  let store

  const mockItems = [
    { id: 1, contributionStatus: 'PENDING', userId: 2, moderatorId: null, messagesCount: 0 },
    { id: 2, contributionStatus: 'CONFIRMED', userId: 3, moderatorId: 1, messagesCount: 2 },
  ]

  const mockFields = [
    { key: 'contributionStatus', label: 'Status' },
    { key: 'bookmark', label: 'Bookmark' },
    { key: 'memo', label: 'Memo' },
    { key: 'editCreation', label: 'Edit' },
    { key: 'chatCreation', label: 'Chat' },
    { key: 'deny', label: 'Deny' },
    { key: 'confirm', label: 'Confirm' },
  ]

  beforeEach(() => {
    store = createStore({
      state: {
        moderator: {
          id: 1,
        },
      },
    })

    wrapper = shallowMount(OpenCreationsTable, {
      props: {
        items: mockItems,
        fields: mockFields,
        hideResubmission: false,
      },
      global: {
        plugins: [store],
        mocks: {
          $t: (key) => key,
        },
        stubs: {
          BTableLite: true,
          BButton: true,
          IBiQuestionSquare: true,
          IBiBellFill: true,
          IBiCheck: true,
          IBiXCircle: true,
          IBiTrash: true,
          IBiPencilSquare: true,
          IBiChatDots: true,
          IBiExclamationCircleFill: true,
          IBiQuestionDiamond: true,
          IBiX: true,
        },
      },
    })
  })

  it('renders the component', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'BTableLite' }).exists()).toBe(true)
  })

  it('applies correct row class based on status', () => {
    const rowClass = wrapper.vm.rowClass({ contributionStatus: 'CONFIRMED' }, 'row')
    expect(rowClass).toBe('table-success')
  })

  it('emits show-overlay event when calling $emit', async () => {
    const mockItem = mockItems[0]
    await wrapper.vm.$emit('show-overlay', mockItem, 'delete')
    expect(wrapper.emitted('show-overlay')).toBeTruthy()
    expect(wrapper.emitted('show-overlay')[0]).toEqual([mockItem, 'delete'])
  })

  it('toggles row details correctly', () => {
    const mockRow = {
      toggleDetails: vi.fn(),
      detailsShowing: false,
      index: 0,
      item: mockItems[0],
    }

    wrapper.vm.rowToggleDetails(mockRow, 0)
    expect(mockRow.toggleDetails).toHaveBeenCalled()
    expect(wrapper.vm.openRow).toEqual(mockRow)
    expect(wrapper.vm.slotIndex).toBe(0)
    expect(wrapper.vm.creationUserData).toEqual(mockItems[0])
  })

  it('identifies if the item belongs to the current user', () => {
    expect(wrapper.vm.myself({ userId: 1 })).toBe(true)
    expect(wrapper.vm.myself({ userId: 2 })).toBe(false)
  })

  it('emits update-contributions event', async () => {
    await wrapper.vm.updateContributions()
    expect(wrapper.emitted('update-contributions')).toBeTruthy()
  })

  it('emits update-status event', async () => {
    const id = 1
    await wrapper.vm.updateStatus(id)
    expect(wrapper.emitted('update-status')).toBeTruthy()
    expect(wrapper.emitted('update-status')[0]).toEqual([id])
  })

  it('emits reload-contribution event', async () => {
    const id = 1
    await wrapper.vm.reloadContribution(id)
    expect(wrapper.emitted('reload-contribution')).toBeTruthy()
    expect(wrapper.emitted('reload-contribution')[0]).toEqual([id])
  })

  it('gets correct status icon', () => {
    expect(wrapper.vm.getStatusIcon('IN_PROGRESS')).toBe('question-square')
    expect(wrapper.vm.getStatusIcon('PENDING')).toBe('bell-fill')
    expect(wrapper.vm.getStatusIcon('CONFIRMED')).toBe('check')
    expect(wrapper.vm.getStatusIcon('DENIED')).toBe('x-circle')
    expect(wrapper.vm.getStatusIcon('DELETED')).toBe('trash')
    expect(wrapper.vm.getStatusIcon('UNKNOWN')).toBe('default-icon')
  })
})

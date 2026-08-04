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
        groupTags: [
          { id: 1, tag: 'music', name: 'Musik' },
          { id: 2, tag: 'sports', name: null },
        ],
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

  // Group functions: the group is editable while a contribution is open, and a change goes
  // through a confirmation because it can hand the contribution to another moderator.
  describe('changing the group', () => {
    it('offers the dropdown only while the contribution is open', () => {
      expect(wrapper.vm.canEditGroup({ contributionStatus: 'PENDING' })).toBe(true)
      expect(wrapper.vm.canEditGroup({ contributionStatus: 'IN_PROGRESS' })).toBe(true)
      expect(wrapper.vm.canEditGroup({ contributionStatus: 'CONFIRMED' })).toBe(false)
      expect(wrapper.vm.canEditGroup({ contributionStatus: 'DENIED' })).toBe(false)
      expect(wrapper.vm.canEditGroup({ contributionStatus: 'DELETED' })).toBe(false)
    })

    it('lists "no group" plus every canonical group', () => {
      expect(wrapper.vm.groupSelectOptions).toEqual([
        { value: '', text: 'contribution.noGroup' },
        { value: 'music', text: 'Musik (#music)' },
        { value: 'sports', text: '#sports' },
      ])
    })

    it('asks before moving, and does not emit yet', async () => {
      wrapper.vm.onGroupPicked({ id: 7, groupTags: [{ tag: 'music' }] }, 'sports')
      expect(wrapper.vm.groupChangeModal).toBe(true)
      expect(wrapper.vm.pendingGroupChange.fromLabel).toBe('Musik (#music)')
      expect(wrapper.vm.pendingGroupChange.toLabel).toBe('#sports')
      expect(wrapper.emitted('assign-group')).toBeFalsy()
    })

    // Saving replaces the whole set, so a contribution that belongs to two groups loses one
    // of them. The dropdown can only show the first, so the question has to name both --
    // otherwise the second group disappears without ever having been on screen.
    it('names every group it is about to replace, not just the first', () => {
      wrapper.vm.onGroupPicked({ id: 7, groupTags: [{ tag: 'music' }, { tag: 'sports' }] }, '')
      expect(wrapper.vm.pendingGroupChange.fromLabel).toBe('Musik (#music), #sports')
      expect(wrapper.vm.pendingGroupChange.toLabel).toBe('contribution.noGroup')
    })

    it('emits the change once confirmed', async () => {
      wrapper.vm.onGroupPicked({ id: 7, groupTags: [{ tag: 'music' }] }, 'sports')
      wrapper.vm.confirmGroupChange()
      expect(wrapper.emitted('assign-group')[0]).toEqual([{ contributionId: 7, tags: ['sports'] }])
      expect(wrapper.vm.groupChangeModal).toBe(false)
    })

    it('sends an empty list when moving to "no group"', async () => {
      wrapper.vm.onGroupPicked({ id: 7, groupTags: [{ tag: 'music' }] }, '')
      wrapper.vm.confirmGroupChange()
      expect(wrapper.emitted('assign-group')[0]).toEqual([{ contributionId: 7, tags: [] }])
    })

    it('emits nothing when the change is cancelled', async () => {
      wrapper.vm.onGroupPicked({ id: 7, groupTags: [{ tag: 'music' }] }, 'sports')
      wrapper.vm.cancelGroupChange()
      expect(wrapper.emitted('assign-group')).toBeFalsy()
      expect(wrapper.vm.groupChangeModal).toBe(false)
    })

    it('ignores picking the group the contribution already has', async () => {
      wrapper.vm.onGroupPicked({ id: 7, groupTags: [{ tag: 'music' }] }, 'music')
      expect(wrapper.vm.groupChangeModal).toBe(false)
      expect(wrapper.emitted('assign-group')).toBeFalsy()
    })

    // The dropdown must never show a group the contribution does not have. A pick is only
    // shown while it is waiting for its answer -- every ending that is not a saved change
    // has to put it back.
    describe('what the dropdown shows', () => {
      const item = { id: 7, groupTags: [{ tag: 'music' }] }

      it('shows the group of the contribution when nothing is pending', () => {
        expect(wrapper.vm.displayedGroupTag(item)).toBe('music')
        expect(wrapper.vm.displayedGroupTag({ id: 8, groupTags: [] })).toBe('')
      })

      it('shows the picked group while the question is open', () => {
        wrapper.vm.onGroupPicked(item, 'sports')
        expect(wrapper.vm.displayedGroupTag(item)).toBe('sports')
      })

      it('puts the old group back when the change is cancelled', () => {
        wrapper.vm.onGroupPicked(item, 'sports')
        wrapper.vm.cancelGroupChange()
        expect(wrapper.vm.displayedGroupTag(item)).toBe('music')
      })

      it.each(['cancel', 'close', 'esc', 'backdrop'])(
        'puts the old group back when the dialog ends with "%s"',
        (trigger) => {
          wrapper.vm.onGroupPicked(item, 'sports')
          wrapper.vm.onGroupModalHide({ trigger })
          expect(wrapper.vm.displayedGroupTag(item)).toBe('music')
          expect(wrapper.emitted('assign-group')).toBeFalsy()
        },
      )

      it('carries the change out and keeps showing it when the dialog ends with "ok"', () => {
        wrapper.vm.onGroupPicked(item, 'sports')
        wrapper.vm.onGroupModalHide({ trigger: 'ok' })
        expect(wrapper.emitted('assign-group')[0]).toEqual([
          { contributionId: 7, tags: ['sports'] },
        ])
        expect(wrapper.vm.displayedGroupTag(item)).toBe('sports')
      })

      it('puts the old group back when the backend refuses the change', async () => {
        wrapper.vm.onGroupPicked(item, 'sports')
        wrapper.vm.onGroupModalHide({ trigger: 'ok' })
        await wrapper.setProps({ groupChangeFailures: 1 })
        expect(wrapper.vm.displayedGroupTag(item)).toBe('music')
      })

      it('stops showing the pick once fresh contributions arrive', async () => {
        wrapper.vm.onGroupPicked(item, 'sports')
        wrapper.vm.onGroupModalHide({ trigger: 'ok' })
        await wrapper.setProps({ items: [...mockItems] })
        expect(wrapper.vm.displayedGroupTag(item)).toBe('music')
      })
    })
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

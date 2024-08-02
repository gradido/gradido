import { toggleRowDetails } from './toggleRowDetails'
import { mount } from '@vue/test-utils'
import { vi, describe, beforeEach, it, expect } from 'vitest'

const localVue = global.localVue

const Component = {
  render() {},
  mixins: [toggleRowDetails],
}

const toggleDetailsMock = vi.fn()
const secondToggleDetailsMock = vi.fn()

const row = {
  toggleDetails: toggleDetailsMock,
  index: 0,
  item: {
    data: 'item-data',
  },
}

let wrapper

describe('toggleRowDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = mount(Component, { localVue })
  })

  it('sets default data', () => {
    expect(wrapper.vm.slotIndex).toBe(0)
    expect(wrapper.vm.openRow).toBe(null)
    expect(wrapper.vm.creationUserData).toEqual({})
  })

  describe('no open row', () => {
    beforeEach(() => {
      wrapper.vm.rowToggleDetails(row, 2)
    })

    it('calls toggleDetails', () => {
      expect(toggleDetailsMock).toBeCalled()
    })

    it('updates slot index', () => {
      expect(wrapper.vm.slotIndex).toBe(2)
    })

    it('updates open row', () => {
      expect(wrapper.vm.openRow).toEqual(
        expect.objectContaining({
          index: 0,
          item: {
            data: 'item-data',
          },
        }),
      )
    })

    it('updates creation user data', () => {
      expect(wrapper.vm.creationUserData).toEqual({ data: 'item-data' })
    })
  })

  describe('with open row', () => {
    beforeEach(() => {
      wrapper.setData({ openRow: row })
    })

    describe('row index is open row index', () => {
      describe('index is slot index', () => {
        beforeEach(() => {
          wrapper.vm.rowToggleDetails(row, 0)
        })

        it('calls toggleDetails', () => {
          expect(toggleDetailsMock).toBeCalled()
        })

        it('sets open row to null', () => {
          expect(wrapper.vm.openRow).toBe(null)
        })
      })

      describe('index is not slot index', () => {
        beforeEach(() => {
          wrapper.vm.rowToggleDetails(row, 2)
        })

        it('does not call toggleDetails', () => {
          expect(toggleDetailsMock).not.toBeCalled()
        })

        it('updates slot index', () => {
          expect(wrapper.vm.slotIndex).toBe(2)
        })
      })
    })

    describe('row index is not open row index', () => {
      beforeEach(() => {
        wrapper.vm.rowToggleDetails(
          {
            toggleDetails: secondToggleDetailsMock,
            index: 2,
            item: {
              data: 'new-item-data',
            },
          },
          2,
        )
      })

      it('closes the open row', () => {
        expect(toggleDetailsMock).toBeCalled()
      })

      it('opens the new row', () => {
        expect(secondToggleDetailsMock).toBeCalled()
      })

      it('updates slot index', () => {
        expect(wrapper.vm.slotIndex).toBe(2)
      })

      it('updates open row', () => {
        expect(wrapper.vm.openRow).toEqual({
          toggleDetails: secondToggleDetailsMock,
          index: 2,
          item: {
            data: 'new-item-data',
          },
        })
      })

      it('updates creation user data', () => {
        expect(wrapper.vm.creationUserData).toEqual({ data: 'new-item-data' })
      })
    })
  })
})
